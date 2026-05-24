import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/claudio-fm',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'claudio-fm-dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // LLM API (OpenAI-compatible)
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_API_BASE: process.env.LLM_API_BASE || 'https://api.openai.com/v1',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',

  // NetEase Music
  NETEASE_MUSIC_U: process.env.NETEASE_MUSIC_U || '',
  NETEASE_API_BASE: process.env.NETEASE_API_BASE || 'http://localhost:3000',
};

export function validateEnv(): void {
  const missing: string[] = [];
  if (!env.LLM_API_KEY) missing.push('LLM_API_KEY');
  if (missing.length > 0) {
    console.warn(`[ENV] Missing optional env vars: ${missing.join(', ')}. Related features will be degraded.`);
  }
}
