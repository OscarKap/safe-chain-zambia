import { z } from 'zod';

export const assignRespondersSchema = z.object({
  responderIds: z.array(z.string().uuid()).min(1, 'At least one responder ID is required')
});
