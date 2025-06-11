require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://manas-next.vercel.app',
    'https://manas-foundation.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
let cachedDb = null;

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // If we have a cached connection, return it
    if (cachedDb) {
      return cachedDb;
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    const db = await mongoose.connect(process.env.MONGODB_URI, options);
    cachedDb = db;
    console.log('Connected to MongoDB');
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Initialize DB connection
connectDB().catch(console.error);

// Routes
app.use('/api/auth', authRoutes);

// Basic route for testing
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to MANAS Foundation API' });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const health = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    };
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app; 