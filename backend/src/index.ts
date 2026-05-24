import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import uploadRoutes from './routes/upload';
import reviewRoutes from './routes/reviews';
import scraperRoutes from './routes/scraper';
import stripeRoutes from './routes/stripe';
import transbankRoutes from './routes/transbank';
import couponRoutes from './routes/coupons';
import notificationRoutes from './routes/notifications';
import supportRoutes from './routes/support';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://ecommerce-platform-frontend-three.vercel.app',
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
// Stripe webhook needs raw body BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(morgan('dev'));

import passport from './config/passport';
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/transbank', transbankRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);

// Health check — always responds, even without DB
app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const states: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ status: 'ok', db: states[dbState] || 'unknown', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Start server FIRST, then connect DB ─────────────────
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});

// MongoDB with auto-retry — server stays up even if DB is temporarily down
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.log('🔄 Retrying in 10 seconds...');
    setTimeout(connectDB, 10000);
  }
};

connectDB();
