// Helper to generate Prisma where clauses that enforce district‑based access
import { Prisma } from '@prisma/client';

/**
 * Returns a Prisma where clause restricting records to the user's district.
 * SuperAdmin has unrestricted access. DistrictAdmin is limited to their own district.
 * Other roles receive no district restriction here (they may be filtered elsewhere).
 */
export const districtScope = (user: any): Prisma.CaseWhereInput => {
  if (!user) return {} as any;
  if (user.role === 'SuperAdmin') return {} as any; // no filter
  if (user.role === 'DistrictAdmin') {
    return { district: user.district } as any;
  }
  // default: no additional district filter (other role‑specific logic will apply)
  return {} as any;
};
