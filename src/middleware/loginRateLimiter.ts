import rateLimit from 'express-rate-limit';

// Limit login attempts to mitigate brute‑force attacks
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // maximum 5 login attempts per window per IP
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
