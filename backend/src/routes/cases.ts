import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../services/encryptionService';
import { activityLogger } from '../middleware/activityLogger';
import { validateBody } from '../middleware/validate';
import { caseCreateSchema, caseUpdateSchema } from '../schemas/caseSchemas';
import { requireRole } from '../middleware/requireRole';
import { requirePermission } from '../middleware/requirePermission';
import { ownership } from '../middleware/ownership';
import { districtScope } from '../utils/districtFilter';
import logger from '../logger';

const router = Router();
const prisma = new PrismaClient();

// Create a new case (used by SOS endpoint etc.)
router.post('/', requireRole([
  'DistrictAdmin',
  'SuperAdmin',
  'NGO_CBOResponder',
  'CommunityVolunteer',
  'MentalHealthCounsellor',
  'DataReviewer',
]), validateBody(caseCreateSchema), async (req: Request, res: Response) => {
  // Encrypt sensitive JSON fields before persisting
  const encryptIfPresent = (data: any) => data ? encrypt(data) : undefined;
  const {
    incidentType,
    province,
    district,
    coordinates,
    reporterPhone,
    reporterInfo,
    victimInfo,
    severity,
    priority,
    mediaUrls,
    notes
  } = req.body;

  try {
    const newCase = await prisma.case.create({
      data: {
        incidentType,
        province,
        district,
        coordinates,
        reporterPhone,
        reporterInfo: encryptIfPresent(reporterInfo),
        victimInfo: encryptIfPresent(victimInfo),
        severity,
        priority,
        mediaUrls: mediaUrls || [],
        notes: notes || {}
      }
    });
    // Log creation
    await prisma.adminActivityLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'create_case',
        target: `caseId:${newCase.id}`
      }
    });
    res.status(201).json(newCase);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Failed to create case' });
  }
});

// Get cases with pagination, filtering, sorting
const decryptIfPresent = (data: string | null) => data ? decrypt(data) : undefined
router.get('/', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, priority, district, incidentType, sortBy = 'createdAt', order = 'desc' } = req.query as any;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (district) where.district = district;
  if (incidentType) where.incidentType = incidentType;
  // Exclude soft‑deleted cases
  where.deletedAt = null;
  try {
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: order }
      }),
      prisma.case.count({ where })
    ]);
    res.json({ data: cases, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Failed to fetch cases' });
  }
});

// Get single case details
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const caseDetail = await prisma.case.findUnique({ where: { id, deletedAt: null } });
    if (!caseDetail) return res.status(404).json({ message: 'Case not found' });
    // Decrypt sensitive fields before response
  const decryptedCase = {
    ...caseDetail,
    reporterInfo: decryptIfPresent(caseDetail.reporterInfo as any),
    victimInfo: decryptIfPresent(caseDetail.victimInfo as any)
  };
  res.json(decryptedCase);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error retrieving case' });
  }
});

// Update case (status, priority, notes, assignment, etc.)
router.patch('/:id', validateBody(caseUpdateSchema), async (req: Request, res: Response) => {
  // Encrypt sensitive fields if they are being updated
  const encryptIfPresent = (data: any) => data ? encrypt(data) : undefined
  const { id } = req.params;
  const { status, priority, notes, assignedTo } = req.body;
  try {
    const updated = await prisma.case.update({
      where: { id },
      data: { status, priority, notes, assignedTo }
    });
    // Log update
    await prisma.adminActivityLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'update_case',
        target: `caseId:${id}`
      }
    });
    res.json(updated);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Failed to update case' });
  }
});

export default router;