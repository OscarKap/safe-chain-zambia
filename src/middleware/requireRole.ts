// Middleware to enforce role‑based access
import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthenticated' });

    // Suspended admins lose all access immediately
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    if (allowedRoles.includes(user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Insufficient role' });
  };
};
