import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateBody } from '../middleware/validate';
import { responderUpdateSchema } from '../schemas/responderSchemas';

const router = Router();
const prisma = new PrismaClient();

// List responders (filter by role, district, availability)
router.get('/', async (req: Request, res: Response) => {
  const { role, district, active, availability } = req.query as any;
  const where: any = {};
  if (role) where.role = role;
  if (district) where.district = district;
  if (active !== undefined) where.active = active === 'true';
  if (availability !== undefined) where.availability = availability === 'true';
  try {
    const responders = await prisma.responder.findMany({ where });
    res.json(responders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch responders' });
  }
});

// Update responder availability / active status
router.patch('/:id', validateBody(responderUpdateSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { availability, active, specialty } = req.body;
  try {
    const updated = await prisma.responder.update({
      where: { id },
      data: { availability, active, specialty }
    });
    // Log activity
    await prisma.adminActivityLog.create({
      data: {
        userId: (req as any).user.id,
        action: 'update_responder',
        target: `responderId:${id}`
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update responder' });
  }
});

export default router;