const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory's .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:1420', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Parse JSON with larger limit and better error handling
app.use(express.json({ limit: '10mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Nieprawidłowy format danych' });
  }
  next();
});

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    setTimeout(connectToMongoDB, 5000);
  }
};

connectToMongoDB();

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectToMongoDB();
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'club', 'admin'], default: 'user' },
  authToken: { type: String, default: null }
});

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    { id: this._id, username: this.username, role: this.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  this.authToken = token;
  return token;
};

const User = mongoose.model('User', userSchema);

// Club Verification Schema
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

const ClubVerification = mongoose.model('ClubVerification', clubVerificationSchema);

// Enhanced token verification middleware
const authenticateToken = async (req, res, next) => {
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

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Użytkownik o podanym adresie email lub nazwie już istnieje' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    // Generate auth token
    const token = user.generateAuthToken();
    await user.save();

    res.status(201).json({
      message: 'Rejestracja zakończona pomyślnie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Błąd podczas rejestracji' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Generate new token
    const token = user.generateAuthToken();
    await user.save();

    res.json({
      message: 'Logowanie zakończone pomyślnie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Błąd podczas logowania' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.authToken = null;
      await user.save();
    }
    res.json({ message: 'Wylogowano pomyślnie' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Błąd podczas wylogowywania' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongoConnection: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

// Club Verification Endpoints with enhanced error handling
app.post('/api/club-verification', authenticateToken, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Baza danych jest tymczasowo niedostępna' });
    }

    const verification = new ClubVerification({
      userId: req.user.id,
      ...req.body
    });

    try {
      await verification.save();
    } catch (validationError) {
      if (validationError.name === 'ValidationError') {
        const errors = Object.values(validationError.errors).map(err => err.message);
        return res.status(400).json({ 
          message: 'Błąd walidacji danych',
          errors 
        });
      }
      throw validationError;
    }

    res.status(201).json({
      message: 'Wniosek o weryfikację klubu został wysłany',
      verification
    });
  } catch (error) {
    console.error('Club verification submission error:', error);
    res.status(500).json({ message: 'Błąd podczas wysyłania wniosku o weryfikację' });
  }
});

// Get verification status for current user
app.get('/api/club-verification/status', authenticateToken, async (req, res) => {
  try {
    const verification = await ClubVerification.findOne({ userId: req.user.id })
      .sort({ submittedAt: -1 });
    
    if (!verification) {
      return res.status(404).json({ message: 'Nie znaleziono wniosku o weryfikację' });
    }

    res.json(verification);
  } catch (error) {
    console.error('Club verification status error:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania statusu weryfikacji' });
  }
});

// Admin endpoints
app.get('/api/admin/verifications', authenticateToken, isAdmin, async (req, res) => {
  try {
    const verifications = await ClubVerification.find()
      .populate('userId', 'username email')
      .sort({ submittedAt: -1 });
    
    res.json(verifications);
  } catch (error) {
    console.error('Admin verifications fetch error:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania wniosków o weryfikację' });
  }
});

app.put('/api/admin/verifications/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const verification = await ClubVerification.findById(req.params.id);
    
    if (!verification) {
      return res.status(404).json({ message: 'Nie znaleziono wniosku o weryfikację' });
    }

    verification.status = status;
    verification.reviewNotes = reviewNotes;
    verification.reviewedAt = new Date();
    await verification.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(verification.userId, { role: 'club' });
    }

    res.json({
      message: 'Status weryfikacji został zaktualizowany',
      verification
    });
  } catch (error) {
    console.error('Admin verification update error:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji statusu weryfikacji' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Wystąpił błąd serwera' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
