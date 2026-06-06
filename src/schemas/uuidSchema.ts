import { z } from 'zod';

// Schema to validate UUID format (version 4)
export const uuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/).default(() => {
  throw new Error('Invalid UUID format');
});