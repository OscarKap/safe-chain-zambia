import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware to log admin activity
export const activityLogger = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  // capture original send to log after response
  const originalSend = res.send;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).send = async function (body: any) {
    // after response is sent, log activity
    try {
      const user = (req as any).user; // set by auth middleware if present
      if (user) {
        await prisma.adminActivityLog.create({
          data: {
            userId: user.id,
            action: `${req.method} ${req.originalUrl}`,
            target: JSON.stringify({ params: req.params, query: req.query, body: req.body }),
          },
        });
      }
    } catch (e) {
      console.error('Failed to log activity', e);
    }
    // call original send
    // eslint-disable-next-line prefer-rest-params
    return originalSend.apply(this, arguments as any);
  };
  // Continue to next middleware/handler
  next();
};