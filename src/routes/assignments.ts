import { Router, Request, Response } from 'express';
import { suggestResponders, assignResponders } from '../services/assignmentService';
import { sendAlertEmail, sendAlertSMS, buildAlertPayload } from '../services/alertService';
import { PrismaClient } from '@prisma/client';
import { uuidSchema } from '../schemas/uuidSchema';

const router = Router();
const prisma = new PrismaClient();

// Suggest responders for a case (GET /assignments/:caseId/suggest)
router.get('/:caseId/suggest', async (req: Request, res: Response) => {
  const { caseId } = req.params;
  try {
    const responders = await suggestResponders(caseId);
    res.json(responders);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Failed to suggest responders' });
  }
});

// Bulk assign responders (POST /assignments/:caseId/assign)
router.post('/:caseId/assign', async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { responderIds } = req.body as { responderIds: string[] };
  const assigner = (req as any).user.id;
  if (!Array.isArray(responderIds) || responderIds.length === 0) {
    return res.status(400).json({ message: 'Responder IDs are required' });
  }
  try {
    // Assign in DB and log activity
    await assignResponders(caseId, responderIds, assigner);
    // Fetch full case details
    const caseObj = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseObj) throw new Error('Case not found after assignment');
    // Build alert payload based on case
    const payload = buildAlertPayload(caseObj);
    // Retrieve responder contact info
    const responders = await prisma.responder.findMany({ where: { id: { in: responderIds } } });
    // Send email & SMS to each responder
    await Promise.all([
      ...responders.map(r => sendAlertEmail(r.email, payload.subject, payload.html)),
      ...responders.map(r => sendAlertSMS(r.phone, payload.sms))
    ]);
    // Record communications
    await Promise.all([
      ...responders.map(r => prisma.communicationLog.create({
        data: { channel: 'Email', destination: r.email, message: payload.html, status: 'sent', caseId }
      })),
      ...responders.map(r => prisma.communicationLog.create({
        data: { channel: 'SMS', destination: r.phone, message: payload.sms, status: 'sent', caseId }
      }))
    ]);
    res.json({ message: 'Responders assigned and notifications sent' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: 'Assignment failed', error: err.message });
  }
});

export default router;