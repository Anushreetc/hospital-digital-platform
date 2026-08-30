import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { FileRepository } from './repositories/FileRepository';
import { GoogleSheetsRepository } from './repositories/GoogleSheetsRepository';
import { AppointmentService } from './services/AppointmentService';
import { VoiceNluService } from './services/VoiceNluService';
import { AuthService } from './services/AuthService';
import { TelephonyService } from './services/TelephonyService';
import { createApiRouter } from './routes/apiRoutes';
import { createAiRouter } from './routes/aiRoutes';
import { createTelephonyRouter } from './routes/telephonyRoutes';

const app = express();
const PORT = process.env.PORT || 5001;

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false // disabled for local development flexibility
}));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use('/api', limiter);

// Initialize Architecture Services
const fileRepo = new FileRepository();
const sheetsRepo = new GoogleSheetsRepository();
const appointmentService = new AppointmentService(fileRepo, sheetsRepo);
const voiceService = new VoiceNluService(appointmentService, fileRepo);
const authService = new AuthService(fileRepo);
const telephonyService = new TelephonyService(fileRepo, appointmentService);

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/telephony', createTelephonyRouter(telephonyService, fileRepo));
app.use('/api/ai', createTelephonyRouter(telephonyService, fileRepo));
app.use('/api/ai', createAiRouter(fileRepo, appointmentService));
app.use('/api', createApiRouter(fileRepo, appointmentService, voiceService, authService));

// Fallback 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist.'
    }
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred.'
    }
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🏥 Hospital Digital Platform API Engine Running!`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`=================================================`);
  });
}

export { app, appointmentService, fileRepo, authService, voiceService };
