import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import { activityLogger } from './middleware/activityLogger';
import logger from './logger';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Prevent AuditLog modifications
prisma.$use(async (params, next) => {
  if (
    params.model === 'AuditLog' &&
    ['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)
  ) {
    throw new Error('Audit logs are immutable and cannot be modified');
  }
  return next(params);
});

// Security middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Global rate limiter (ONLY ONE rateLimit instance)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Extra limiters (defined but NOT causing duplicates)
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
});

const sosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many SOS requests, please wait.',
});

const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many report submissions, please slow down.',
});

const adminApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Rate limit exceeded for admin API.',
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Activity logging
app.use(activityLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);

  const status = err.status || err.statusCode || 500;

  const safeMessage =
    process.env.NODE_ENV === 'production'
      ? status >= 500
        ? 'Internal server error'
        : err.message
      : err.message;

  const response: any = { error: safeMessage };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'CSRF token missing or invalid' });
  }

  res.status(status).json(response);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { app, prisma };