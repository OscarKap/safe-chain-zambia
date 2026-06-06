import { z } from 'zod';

export const responderUpdateSchema = z.object({
  availability: z.boolean().optional(),
  active: z.boolean().optional(),
  specialty: z.array(z.string()).optional()
});
