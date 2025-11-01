import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth.js';
import avisRouter from './routes/avis.js';
import summaryRouter from './routes/summary.js';
import { logger } from './utils/logger.js';
import { checkGotenbergHealth } from './services/gotenberg.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : '*',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30', 10),
  message: { error: 'Too many requests', message: 'Please try again later' }
});

app.use('/api/pdf', limiter);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', async (_req, res) => {
  try {
    const gotenbergStatus = await checkGotenbergHealth();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        gotenberg: gotenbergStatus ? 'ok' : 'unavailable'
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        gotenberg: 'error'
      }
    });
  }
});

// PDF generation routes (with auth)
app.use('/api/pdf/avis', authMiddleware, avisRouter);
app.use('/api/pdf/summary', authMiddleware, summaryRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`PDF API Server running on port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    gotenbergUrl: process.env.GOTENBERG_URL
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
