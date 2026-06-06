"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alertService_1 = require("../services/alertService");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Send alerts (email + SMS) for a specific case.
 * Used by manual triggers, SOS flow, or after bulk assignment.
 */
router.post('/case/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const caseObj = await prisma.case.findUnique({ where: { id } });
        if (!caseObj)
            return res.status(404).json({ message: 'Case not found' });
        const payload = (0, alertService_1.buildAlertPayload)(caseObj);
        // Determine recipients – all active responders in the case district (or fall back to all responders)
        const responders = await prisma.responder.findMany({
            where: { district: caseObj.district, active: true, availability: true }
        });
        // Dispatch alerts in parallel
        await Promise.all([
            ...responders.map(r => (0, alertService_1.sendAlertEmail)(r.email, payload.subject, payload.html)),
            ...responders.map(r => (0, alertService_1.sendAlertSMS)(r.phone, payload.sms))
        ]);
        // Log communication entries
        await Promise.all([
            ...responders.map(r => prisma.communicationLog.create({
                data: { channel: client_1.CommunicationChannel.Email, destination: r.email, message: payload.html, status: 'sent', caseId: id }
            })),
            ...responders.map(r => prisma.communicationLog.create({
                data: { channel: client_1.CommunicationChannel.SMS, destination: r.phone, message: payload.sms, status: 'sent', caseId: id }
            }))
        ]);
        res.json({ message: 'Alerts dispatched to responders' });
    }
    catch (err) {
        console.error('Alert dispatch error', err);
        res.status(500).json({ message: 'Failed to send alerts', error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=alerts.js.map