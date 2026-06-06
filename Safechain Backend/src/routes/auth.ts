import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken } from '../services/jwtService';
import { activityLogger } from '../middleware/activityLogger';
import { validateBody } from '../middleware/validate';
import { loginSchema } from '../schemas/authSchemas';
import { loginRateLimiter } from '../middleware/loginRateLimiter';
import { authenticateJWT } from '../middleware/auth';
import logger from '../logger';

const router = Router();
const prisma = new PrismaClient();

// Login - expects email and password
router.post('/login', loginRateLimiter, loginLimiter, validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const passwordMatch = bcrypt.compareSync(password, admin.hashedPassword);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Create tokens
    const accessToken = signAccessToken({ sub: admin.id, role: admin.role, email: admin.email });
    const refreshToken = signRefreshToken({ sub: admin.id });
    // Set HttpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1h
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
    // Log login activity
    await prisma.adminActivityLog.create({
      data: {
        userId: admin.id,
        action: 'login',
        target: `email:${email}`,
      },
    });
    res.json({ message: 'Login successful' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }
  try {
    const payload = signRefreshToken ? require('../services/jwtService').verifyRefreshToken(token) : null;
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const newAccess = signAccessToken({ sub: admin.id, role: admin.role, email: admin.email });
    res.cookie('accessToken', newAccess, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });
    res.json({ message: 'Token refreshed' });
  } catch (err) {
    logger.error(err);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

// Logout – clear cookies and log activity
router.post('/logout', authenticateJWT, async (req: Request, res: Response) => {
  const user = (req as any).user;
  await prisma.adminActivityLog.create({
    data: {
      userId: user.id,
      action: 'logout',
      target: `email:${user.email}`,
    },
  });
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

export default router;