import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../services/encryptionService';
import { validateBody } from '../middleware/validate';
import { caseCreateSchema, caseUpdateSchema } from '../schemas/caseSchemas';
import { requireRole } from '../middleware/requireRole';
import logger from '../logger';

const router = Router();
const prisma = new PrismaClient();

// Create a new case
router.post(
  '/',
  requireRole([
    'DistrictAdmin',
    'SuperAdmin',
    'NGO_CBOResponder',
    'CommunityVolunteer',
    'MentalHealthCounsellor',
    'DataReviewer',
  ]),
  validateBody(caseCreateSchema),
  async (req: Request, res: Response) => {
    const encryptIfPresent = (data: any) => (data ? encrypt(data) : undefined);

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
      notes,
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
          notes: notes || {},
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          userId: (req as any).user.id,
          action: 'create_case',
          target: `caseId:${newCase.id}`,
        },
      });

      res.status(201).json(newCase);
    } catch (err) {
      logger.error(err);
      res.status(500).json({ message: 'Failed to create case' });
    }
  }
);

// helper
const decryptIfPresent = (data: any) => (data ? decrypt(data) : undefined);

// Get cases
router.get('/', async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '20',
    status,
    priority,
    district,
    incidentType,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query as any;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    deletedAt: null,
  };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (district) where.district = district;
  if (incidentType) where.incidentType = incidentType;

  try {
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: order },
      }),
      prisma.case.count({ where }),
    ]);

    res.json({
      data: cases,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Failed to fetch cases' });
  }
});

// Get single case
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const caseDetail = await prisma.case.findUnique({
      where: { id, deletedAt: null },
    });

    if (!caseDetail) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const decryptedCase = {
      ...caseDetail,
      reporterInfo: decryptIfPresent(caseDetail.reporterInfo),
      victimInfo: decryptIfPresent(caseDetail.victimInfo),
    };

    res.json(decryptedCase);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Error retrieving case' });
  }
});

// Update case
router.patch(
  '/:id',
  validateBody(caseUpdateSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, priority, notes, assignedTo } = req.body;

    try {
      const updated = await prisma.case.update({
        where: { id },
        data: {
          status,
          priority,
          notes,
          assignedTo,
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          userId: (req as any).user.id,
          action: 'update_case',
          target: `caseId:${id}`,
        },
      });

      res.json(updated);
    } catch (err) {
      logger.error(err);
      res.status(500).json({ message: 'Failed to update case' });
    }
  }
);

export default router;