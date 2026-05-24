import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.warn('[DB] MongoDB unavailable — running in degraded mode (in-memory fallbacks)');
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB error:', err);
});
