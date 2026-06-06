"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Create a new case (used by SOS endpoint etc.)
router.post('/', async (req, res) => {
    const { incidentType, province, district, coordinates, reporterPhone, reporterInfo, victimInfo, severity, priority, mediaUrls, notes } = req.body;
    try {
        const newCase = await prisma.case.create({
            data: {
                incidentType,
                province,
                district,
                coordinates,
                reporterPhone,
                reporterInfo,
                victimInfo,
                severity,
                priority,
                mediaUrls: mediaUrls || [],
                notes: notes || {}
            }
        });
        // Log creation
        await prisma.adminActivityLog.create({
            data: {
                userId: req.user.id,
                action: 'create_case',
                target: `caseId:${newCase.id}`
            }
        });
        res.status(201).json(newCase);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create case' });
    }
});
// Get cases with pagination, filtering, sorting
router.get('/', async (req, res) => {
    const { page = '1', limit = '20', status, priority, district, incidentType, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (district)
        where.district = district;
    if (incidentType)
        where.incidentType = incidentType;
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch cases' });
    }
});
// Get single case details
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const caseDetail = await prisma.case.findUnique({ where: { id } });
        if (!caseDetail)
            return res.status(404).json({ message: 'Case not found' });
        res.json(caseDetail);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving case' });
    }
});
// Update case (status, priority, notes, assignment, etc.)
router.patch('/:id', async (req, res) => {
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
                userId: req.user.id,
                action: 'update_case',
                target: `caseId:${id}`
            }
        });
        res.json(updated);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update case' });
    }
});
exports.default = router;
//# sourceMappingURL=cases.js.map