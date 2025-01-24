import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config();

// Helper functions
const generateClubId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'CLUB-';
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static('dist'));

// MongoDB connection state
let isMongoConnected = false;

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      minPoolSize: 0,
      maxPoolSize: 10
    });
    console.log('Connected to MongoDB');
    isMongoConnected = true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isMongoConnected = false;
    setTimeout(connectToMongoDB, 5000);
  }
};

// Try to connect to MongoDB but don't block server start
connectToMongoDB().catch(console.error);

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  isMongoConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  isMongoConnected = false;
  connectToMongoDB();
});

// Database check middleware
const checkDatabase = (req, res, next) => {
  if (!isMongoConnected) {
    return res.status(503).json({ 
      message: 'Baza danych jest tymczasowo niedostępna. Spróbuj ponownie później.' 
    });
  }
  next();
};

// Schemas and models (only used when database is connected)
let User;
let ClubVerification;
let Event;
let Ticket;

if (mongoose.connection) {
  const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'club', 'admin'], default: 'user' },
    authToken: { type: String, default: null },
    originalId: { type: String, sparse: true }
  });

  userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
      { 
        id: this._id, 
        username: this.username, 
        role: this.role,
        originalId: this.originalId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    this.authToken = token;
    return token;
  };

  const clubVerificationSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    clubId: {
      type: String,
      unique: true,
      sparse: true
    },
    clubName: {
      type: String,
      required: true,
      minlength: 3
    },
    address: {
      type: String,
      required: true
    },
    nip: {
      type: String,
      required: true,
      match: /^\d{10}$/
    },
    regon: {
      type: String,
      required: true,
      match: /^\d{9}$/
    },
    description: {
      type: String,
      required: true,
      minlength: 10
    },
    openingHours: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true,
      match: /^\d{9}$/
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: Date,
    reviewNotes: String
  });

  User = mongoose.models.User || mongoose.model('User', userSchema);
  ClubVerification = mongoose.models.ClubVerification || mongoose.model('ClubVerification', clubVerificationSchema);
  
  const eventSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      minlength: 3
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClubVerification',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true
    },
    description: {
      type: String,
      required: true,
      minlength: 10
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    ticketsSold: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });

  // Update the updatedAt timestamp before saving
  eventSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });

  Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

  const ticketSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'used', 'expired'],
      default: 'active'
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    price: {
      type: Number,
      required: true
    }
  });

  Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
}

// Middleware
const authenticateToken = async (req, res, next) => {
  if (!isMongoConnected) {
    return res.status(503).json({ message: 'Baza danych jest tymczasowo niedostępna' });
  }

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Brak tokenu uwierzytelniającego' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ _id: decoded.id, authToken: token });

      if (!user) {
        return res.status(403).json({ message: 'Nieprawidłowy token' });
      }

      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token wygasł' });
      }
      return res.status(403).json({ message: 'Nieprawidłowy token' });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas weryfikacji tokenu' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Brak uprawnień' });
  }
  next();
};

// API Routes
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongoConnection: isMongoConnected,
    timestamp: new Date().toISOString()
  });
});

// Club verification endpoint
apiRouter.post('/club-verification', authenticateToken, checkDatabase, async (req, res) => {
  try {
    const { clubName, address, nip, regon, description, openingHours, phoneNumber } = req.body;

    // Create new club verification request
    const clubVerification = new ClubVerification({
      userId: req.user.id,
      clubName,
      address,
      nip,
      regon,
      description,
      openingHours,
      phoneNumber
    });

    await clubVerification.save();

    res.status(201).json({
      message: 'Wniosek o weryfikację klubu został przyjęty',
      verification: clubVerification
    });
  } catch (error) {
    console.error('Club verification error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Błąd walidacji danych',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Błąd podczas składania wniosku o weryfikację' });
  }
});

// Authentication endpoints
apiRouter.get('/auth/check-admin', authenticateToken, checkDatabase, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    if (!['admin'].includes(user.role)) {
      return res.json({ isAdmin: false });
    }

    res.json({ isAdmin: true });
  } catch (error) {
    console.error('Error checking admin status:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Nieprawidłowy format ID użytkownika' });
    }
    res.status(500).json({ message: 'Błąd podczas sprawdzania statusu administratora' });
  }
});

apiRouter.post('/auth/register', checkDatabase, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Użytkownik o podanym adresie email lub nazwie już istnieje' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    const token = user.generateAuthToken();
    await user.save();

    res.status(201).json({
      message: 'Rejestracja zakończona pomyślnie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        originalId: user.originalId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Błąd podczas rejestracji' });
  }
});

apiRouter.post('/auth/login', checkDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const token = user.generateAuthToken();
    await user.save();

    res.json({
      message: 'Logowanie zakończone pomyślnie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        originalId: user.originalId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Błąd podczas logowania' });
  }
});

// Public endpoint for fetching upcoming events
apiRouter.get('/events', checkDatabase, async (req, res) => {
  try {
    console.log('Fetching events with query:', req.query);
    const { status } = req.query;

    // First get all approved and non-banned clubs
    const approvedClubs = await ClubVerification.find({
      status: 'approved',
      isBanned: { $ne: true }
    }).select('_id clubName address').lean();
      
    console.log('Found approved clubs:', approvedClubs);

    if (!approvedClubs || approvedClubs.length === 0) {
      console.log('No approved clubs found');
      return res.json([]); // Return empty array if no approved clubs
    }

    // Get events for these clubs
    const events = await Event.find({
      status: status || 'upcoming',
      isBlocked: false,
      date: { $gte: new Date() },
      club: { $in: approvedClubs.map(club => club._id) }
    })
    .lean() // Convert to plain JavaScript objects
    .sort({ date: 1 });

    console.log('Found events:', events);

    // Map club data to events
    const transformedEvents = events.map(event => {
      const club = approvedClubs.find(c => c._id.toString() === event.club.toString());
      return {
        ...event,
        club: club ? {
          _id: club._id,
          clubName: club.clubName,
          address: club.address
        } : null
      };
    });

    console.log('Transformed events:', transformedEvents);
    res.json(transformedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania wydarzeń' });
  }
});

// Public endpoint for fetching clubs
apiRouter.get('/clubs/public', checkDatabase, async (req, res) => {
  try {
    const clubs = await ClubVerification.find()
    .select('-userId -reviewNotes -reviewedAt')
    .sort({ submittedAt: -1 });

    res.json(clubs);
  } catch (error) {
    console.error('Error fetching approved clubs:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania listy klubów' });
  }
});

// Club endpoints
apiRouter.get('/club/details', authenticateToken, checkDatabase, async (req, res) => {
  try {
    if (req.user.role !== 'club') {
      return res.status(403).json({ message: 'Dostęp tylko dla klubów' });
    }

    const clubDetails = await ClubVerification.findOne({ 
      userId: req.user.id,
      status: 'approved'
    });

    if (!clubDetails) {
      return res.status(404).json({ message: 'Nie znaleziono danych klubu' });
    }

    res.json(clubDetails);
  } catch (error) {
    console.error('Error fetching club details:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania danych klubu' });
  }
});

apiRouter.get('/events/club', authenticateToken, checkDatabase, async (req, res) => {
  try {
    if (req.user.role !== 'club') {
      return res.status(403).json({ message: 'Dostęp tylko dla klubów' });
    }

    const clubDetails = await ClubVerification.findOne({ 
      userId: req.user.id,
      status: 'approved'
    });

    if (!clubDetails) {
      return res.status(404).json({ message: 'Nie znaleziono danych klubu' });
    }

    const events = await Event.find({ club: clubDetails._id })
      .sort({ date: -1 });

    res.json(events);
  } catch (error) {
    console.error('Error fetching club events:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania wydarzeń klubu' });
  }
});

// Event management endpoints
apiRouter.put('/events/:id', authenticateToken, checkDatabase, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, date, price, capacity } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Wydarzenie nie zostało znalezione' });
    }

    // Check if user is admin or the club owner
    if (req.user.role !== 'admin') {
      const clubDetails = await ClubVerification.findOne({ 
        userId: req.user.id,
        status: 'approved'
      });

      if (!clubDetails || !clubDetails._id.equals(event.club)) {
        return res.status(403).json({ message: 'Brak uprawnień do edycji tego wydarzenia' });
      }
    }

    // Update event details
    event.name = name;
    event.description = description;
    event.date = date;
    event.price = price;
    event.capacity = capacity;

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Błąd walidacji danych',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Błąd podczas aktualizacji wydarzenia' });
  }
});

apiRouter.put('/events/:id/toggle-block', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Wydarzenie nie zostało znalezione' });
    }

    event.isBlocked = !event.isBlocked;
    await event.save();

    res.json({ 
      message: `Wydarzenie zostało ${event.isBlocked ? 'zablokowane' : 'odblokowane'}`,
      event 
    });
  } catch (error) {
    console.error('Error toggling event block:', error);
    res.status(500).json({ message: 'Błąd podczas zmiany statusu blokady wydarzenia' });
  }
});

apiRouter.delete('/events/:id', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: 'Wydarzenie nie zostało znalezione' });
    }

    await event.deleteOne();
    res.json({ message: 'Wydarzenie zostało usunięte' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania wydarzenia' });
  }
});

apiRouter.post('/events', authenticateToken, checkDatabase, async (req, res) => {
  try {
    if (req.user.role !== 'club') {
      return res.status(403).json({ message: 'Dostęp tylko dla klubów' });
    }

    const clubDetails = await ClubVerification.findOne({ 
      userId: req.user.id,
      status: 'approved'
    });

    if (!clubDetails) {
      return res.status(404).json({ message: 'Nie znaleziono danych klubu' });
    }

    const { name, description, date, price, capacity } = req.body;

    const event = new Event({
      name,
      description,
      date,
      price,
      capacity,
      club: clubDetails._id,
      ticketsSold: 0,
      status: 'upcoming'
    });

    await event.save();

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Błąd walidacji danych',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Błąd podczas tworzenia wydarzenia' });
  }
});

// Ticket endpoints
apiRouter.get('/tickets/user', authenticateToken, checkDatabase, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id })
      .populate({
        path: 'eventId',
        populate: {
          path: 'club',
          select: 'clubName address'
        }
      })
      .sort({ purchaseDate: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania biletów' });
  }
});

// Admin endpoints
apiRouter.get('/admin/users', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    const users = await User.find({}, '-password -authToken');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania listy użytkowników' });
  }
});

apiRouter.get('/admin/events', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('club', 'clubName')
      .sort({ date: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania listy wydarzeń' });
  }
});

// Admin endpoint for managing clubs
apiRouter.get('/clubs/approved', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    const approvedClubs = await ClubVerification.find({ 
      status: 'approved',
      clubId: { $exists: true }
    })
      .populate('userId', 'username email')
      .sort({ submittedAt: -1 });

    const clubsWithUserData = approvedClubs.map(club => ({
      ...club.toObject(),
      user: club.userId
    }));

    res.json(clubsWithUserData);
  } catch (error) {
    console.error('Error fetching approved clubs:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania listy klubów' });
  }
});

apiRouter.post('/clubs/:id/ban', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    const club = await ClubVerification.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Nie znaleziono klubu' });
    }

    club.isBanned = true;
    await club.save();

    res.json({ message: 'Klub został zablokowany', club });
  } catch (error) {
    console.error('Error banning club:', error);
    res.status(500).json({ message: 'Błąd podczas blokowania klubu' });
  }
});

apiRouter.post('/clubs/:id/unban', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    const club = await ClubVerification.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Nie znaleziono klubu' });
    }

    club.isBanned = false;
    await club.save();

    res.json({ message: 'Klub został odblokowany', club });
  } catch (error) {
    console.error('Error unbanning club:', error);
    res.status(500).json({ message: 'Błąd podczas odblokowywania klubu' });
  }
});

apiRouter.get('/admin/verifications', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    // Check if user exists and has admin role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień administratora' });
    }

    const verifications = await ClubVerification.find()
      .populate('userId', 'username email')
      .sort({ submittedAt: -1 });

    // Return empty array if no verifications found instead of 404
    if (!verifications || verifications.length === 0) {
      return res.json([]);
    }

    res.json(verifications);
  } catch (error) {
    console.error('Error fetching verifications:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Nieprawidłowy format danych' });
    }
    res.status(500).json({ message: 'Błąd podczas pobierania wniosków o weryfikację' });
  }
});

apiRouter.put('/admin/verifications/:id', authenticateToken, isAdmin, checkDatabase, async (req, res) => {
  try {
    // Check if user exists and has admin role
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień administratora' });
    }

    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Nieprawidłowy status' });
    }

    const verification = await ClubVerification.findById(id);
    if (!verification) {
      return res.status(404).json({ message: 'Nie znaleziono wniosku o weryfikację' });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({ message: 'Ten wniosek został już zweryfikowany' });
    }

    verification.status = status;
    verification.reviewNotes = reviewNotes || '';
    verification.reviewedAt = new Date();

    // Generate clubId before starting transaction if status is approved
    let clubId;
    if (status === 'approved') {
      let isUnique = false;
      while (!isUnique) {
        clubId = generateClubId();
        const existingVerification = await ClubVerification.findOne({ clubId });
        if (!existingVerification) {
          isUnique = true;
        }
      }
    }

    // Start transaction for all database operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update verification status and details
      verification.status = status;
      verification.reviewNotes = reviewNotes || '';
      verification.reviewedAt = new Date();
      
      if (status === 'approved') {
        verification.clubId = clubId;
        
        // Find and update user within transaction
        const verificationUser = await User.findById(verification.userId).session(session);
        if (!verificationUser) {
          throw new Error('Nie znaleziono użytkownika');
        }
        
        verificationUser.role = 'club';
        await verificationUser.save({ session });
      }
      
      await verification.save({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Fetch updated verification with populated user data
    const updatedVerification = await ClubVerification.findById(id)
      .populate('userId', 'username email');

    res.json({ 
      message: `Wniosek został ${status === 'approved' ? 'zatwierdzony' : 'odrzucony'}`,
      verification: updatedVerification 
    });
  } catch (error) {
    console.error('Error updating verification:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Nieprawidłowy format ID' });
    }
    res.status(500).json({ message: 'Błąd podczas aktualizacji statusu weryfikacji' });
  }
});

// Mount API routes
app.use('/api', apiRouter);

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Wystąpił błąd serwera' });
});

const port = process.env.PORT || 1420;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
