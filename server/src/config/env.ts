import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server folder root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnv = ['MONGODB_URI'];

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Missing environment variable [${envName}]. Server cannot start.`
    );
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI as string,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access_secret_fallback_key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback_key',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
