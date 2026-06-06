import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit'; // primary rate limiter
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import { activityLogger } from './middleware/activityLogger';

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app: express.Application = express();
const prisma = new PrismaClient();
// Immutable AuditLog guard – prevent updates/deletes
prisma.$use(async (params, next) => {
  if (params.model === 'AuditLog' && ['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
    throw new Error('Audit logs are immutable and cannot be modified');
  }
  return next(params);
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
// Stricter rate limiting for sensitive endpoints
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: 'Too many login attempts, please try again later.',
});

const sosLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many SOS requests, please wait.',
});

const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: 'Too many report submissions, please slow down.',
});

const adminApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Rate limit exceeded for admin API.',
});

// Attach specific limiters to routes after they are defined (see route files).

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection
import { csrfProtection } from './middleware/csrf';
app.use(csrfProtection);

// Activity logging (after auth setup)
app.use(activityLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// CSRF token endpoint
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Auth routes (login, refresh, logout)
app.use('/auth', authRouter);

// Protected dashboard routes – all routes under /dashboard require authentication
app.use('/dashboard', dashboardRouter);

// Error handling middleware
// Centralized error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log the error internally (stack trace) for debugging
  logger.error(err);

  // Determine HTTP status code
  const status = err.status || err.statusCode || 500;

  // In production, hide internal details
  const safeMessage = process.env.NODE_ENV === 'production'
    ? (status >= 500 ? 'Internal server error' : err.message)
    : err.message;

  const response: any = { error: safeMessage };

  // Include stack trace only in non‑production environments for debugging
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Handle specific known errors (e.g., CSRF token)
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'CSRF token missing or invalid' });
  }

  res.status(status).json(response);
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
  console.log(`Server running on port ${PORT}`);
});

export { app, prisma };