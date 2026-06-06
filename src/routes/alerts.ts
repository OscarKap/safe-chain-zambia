import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { PrismaClient, CommunicationChannel } from '@prisma/client';
import { sendAlertEmail, sendAlertSMS, buildAlertPayload } from '../services/alertService';
import { PrismaClient, CommunicationChannel } from '@prisma/client';
import { validateBody } from '../middleware/validate';
import { uuidSchema } from '../schemas/uuidSchema';

const router = Router();
const prisma = new PrismaClient();

/**
 * Send alerts (email + SMS) for a specific case.
 * Used by manual triggers, SOS flow, or after bulk assignment.
 */
router.post('/case/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const caseObj = await prisma.case.findUnique({ where: { id } });
    if (!caseObj) return res.status(404).json({ message: 'Case not found' });
    const payload = buildAlertPayload(caseObj);
    // Determine recipients – all active responders in the case district (or fall back to all responders)
    const responders = await prisma.responder.findMany({
      where: { district: caseObj.district, active: true, availability: true }
    });
    // Dispatch alerts in parallel
    await Promise.all([
      ...responders.map(r => sendAlertEmail(r.email, payload.subject, payload.html)),
      ...responders.map(r => sendAlertSMS(r.phone, payload.sms))
    ]);
    // Log communication entries
    await Promise.all([
      ...responders.map(r => prisma.communicationLog.create({
        data: { channel: CommunicationChannel.Email, destination: r.email, message: payload.html, status: 'sent', caseId: id }
      })),
      ...responders.map(r => prisma.communicationLog.create({
        data: { channel: CommunicationChannel.SMS, destination: r.phone, message: payload.sms, status: 'sent', caseId: id }
      }))
    ]);
    res.json({ message: 'Alerts dispatched to responders' });
  } catch (err) {
    console.error('Alert dispatch error', err);
    res.status(500).json({ message: 'Failed to send alerts', error: err.message });
  }
});

export default router;