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

app.use(cors({
  origin: ['http://localhost:1420', 'http://localhost:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

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

// Add method to generate token
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

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Brak tokenu uwierzytelniającego' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, authToken: token });

    if (!user) {
      return res.status(403).json({ message: 'Nieprawidłowy token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Nieprawidłowy token' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongoConnection: mongoose.connection.readyState === 1 });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Serwer tymczasowo niedostępny' });
    }

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    if (!['user', 'club'].includes(role)) {
      return res.status(400).json({ message: 'Nieprawidłowa rola' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik z tym emailem lub nazwą już istnieje' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    // Generate and save token
    const token = user.generateAuthToken();
    await user.save();

    console.log('User registered successfully:', {
      id: user._id,
      username: user.username,
      token: token
    });

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
    res.status(500).json({ message: 'Błąd serwera podczas rejestracji' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Serwer tymczasowo niedostępny' });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    // Generate and save new token
    const token = user.generateAuthToken();
    await user.save();

    console.log('User logged in successfully:', {
      id: user._id,
      username: user.username,
      token: token
    });

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
    res.status(500).json({ message: 'Błąd serwera podczas logowania' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.authToken = null;
      await user.save();
      console.log('User logged out successfully:', user._id);
    }
    res.json({ message: 'Wylogowano pomyślnie' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas wylogowywania' });
  }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -authToken');
    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Wystąpił błąd serwera' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
