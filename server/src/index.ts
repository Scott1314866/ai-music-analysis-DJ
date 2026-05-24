import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env.js';
import authRoutes from './routes/auth.js';
import musicRoutes from './routes/music.js';
import aiRoutes from './routes/ai.js';

validateEnv();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(env.PORT, () => {
  console.log(`[Claudio FM] Server running on port ${env.PORT}`);
  console.log(`[Claudio FM] Environment: ${env.NODE_ENV}`);
});

export default app;
