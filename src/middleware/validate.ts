import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware generator that validates `req.body` against a Zod schema.
 * If validation fails, responds with 400 and the validation errors.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.format();
      return res.status(400).json({ message: 'Invalid request data', errors });
    }
    // Replace body with parsed data to guarantee types downstream
    req.body = result.data;
    next();
  };
};
