import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types for request with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

// Verify JWT and attach user to request
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Missing authentication token' });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not set');
      return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
    }
    const payload = jwt.verify(token, secret) as { sub: string; role: string; email: string };
    // Attach user info
    (req as any).user = { id: payload.sub, role: payload.role, email: payload.email };
    // Log activity (optional – handled by separate logger)
    next();
  } catch (err) {
    console.error('JWT verification error', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role‑based authorization middleware
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};