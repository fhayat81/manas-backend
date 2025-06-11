import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Root path handler
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const db = await connectDB();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      database: db.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Health check error:', error);
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
    status: 'error',
    message: 'Internal server error'
  });
});

// Export the Express API
export default app; 