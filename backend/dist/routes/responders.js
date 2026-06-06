"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// List responders (filter by role, district, availability)
router.get('/', async (req, res) => {
    const { role, district, active, availability } = req.query;
    const where = {};
    if (role)
        where.role = role;
    if (district)
        where.district = district;
    if (active !== undefined)
        where.active = active === 'true';
    if (availability !== undefined)
        where.availability = availability === 'true';
    try {
        const responders = await prisma.responder.findMany({ where });
        res.json(responders);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch responders' });
    }
});
// Update responder availability / active status
router.patch('/:id', async (req, res) => {
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
                userId: req.user.id,
                action: 'update_responder',
                target: `responderId:${id}`
            }
        });
        res.json(updated);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update responder' });
    }
});
exports.default = router;
//# sourceMappingURL=responders.js.map