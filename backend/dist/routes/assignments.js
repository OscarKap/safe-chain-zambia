"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignmentService_1 = require("../services/assignmentService");
const alertService_1 = require("../services/alertService");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Suggest responders for a case (GET /assignments/:caseId/suggest)
router.get('/:caseId/suggest', async (req, res) => {
    const { caseId } = req.params;
    try {
        const responders = await (0, assignmentService_1.suggestResponders)(caseId);
        res.json(responders);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to suggest responders' });
    }
});
// Bulk assign responders (POST /assignments/:caseId/assign)
router.post('/:caseId/assign', async (req, res) => {
    const { caseId } = req.params;
    const { responderIds } = req.body;
    const assigner = req.user.id;
    if (!Array.isArray(responderIds) || responderIds.length === 0) {
        return res.status(400).json({ message: 'Responder IDs are required' });
    }
    try {
        // Assign in DB and log activity
        await (0, assignmentService_1.assignResponders)(caseId, responderIds, assigner);
        // Fetch full case details
        const caseObj = await prisma.case.findUnique({ where: { id: caseId } });
        if (!caseObj)
            throw new Error('Case not found after assignment');
        // Build alert payload based on case
        const payload = (0, alertService_1.buildAlertPayload)(caseObj);
        // Retrieve responder contact info
        const responders = await prisma.responder.findMany({ where: { id: { in: responderIds } } });
        // Send email & SMS to each responder
        await Promise.all([
            ...responders.map(r => (0, alertService_1.sendAlertEmail)(r.email, payload.subject, payload.html)),
            ...responders.map(r => (0, alertService_1.sendAlertSMS)(r.phone, payload.sms))
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Assignment failed', error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=assignments.js.map