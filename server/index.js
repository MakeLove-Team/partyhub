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
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in .env

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:1420', // Tauri app's development port
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// MongoDB connection with retry logic
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

// Handle MongoDB connection errors
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
  role: { type: String, enum: ['user', 'club', 'admin'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu uwierzytelniającego' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Nieprawidłowy token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongoConnection: mongoose.connection.readyState === 1 });
});

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    // Validate MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Serwer tymczasowo niedostępny. Spróbuj ponownie za chwilę.' });
    }

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    // Validate role
    if (!['user', 'club'].includes(role)) {
      return res.status(400).json({ message: 'Nieprawidłowa rola' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik z tym emailem lub nazwą już istnieje' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Rejestracja zakończona sukcesem',
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
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ message: 'Użytkownik z tym emailem lub nazwą już istnieje' });
    }
    res.status(500).json({ message: 'Błąd serwera podczas rejestracji. Spróbuj ponownie za chwilę.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Serwer tymczasowo niedostępny. Spróbuj ponownie za chwilę.' });
    }

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Logowanie zakończone sukcesem',
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
    res.status(500).json({ message: 'Błąd serwera podczas logowania. Spróbuj ponownie za chwilę.' });
  }
});

// Protected route example
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
