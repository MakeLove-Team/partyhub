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
