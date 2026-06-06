import { z } from 'zod';
import { IncidentCategory, Severity, Priority, CaseStatus } from '@prisma/client';

export const caseCreateSchema = z.object({
  incidentType: z.nativeEnum(IncidentCategory),
  province: z.string().min(1),
  district: z.string().min(1),
  coordinates: z.string().regex(/^[-+]?\d{1,3}\.\d+,\s?[-+]?\d{1,3}\.\d+$/).optional(),
  reporterPhone: z.string().min(7),
  reporterInfo: z.any().optional(),
  victimInfo: z.any().optional(),
  severity: z.nativeEnum(Severity),
  priority: z.nativeEnum(Priority),
  mediaUrls: z.array(z.string().url()).optional(),
  notes: z.any().optional(),
});

export const caseUpdateSchema = z.object({
  status: z.nativeEnum(CaseStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  notes: z.any().optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  reporterInfo: z.any().optional(),
  victimInfo: z.any().optional(),
});
