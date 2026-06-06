"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Helper to convert records to GeoJSON Feature
const toFeature = (obj, type) => ({
    type: 'Feature',
    geometry: obj.coordinates ? {
        type: 'Point',
        coordinates: obj.coordinates.split(',').map((c) => parseFloat(c))
    } : null,
    properties: { ...obj, featureType: type }
});
// Get cases as GeoJSON – filterable via query params
router.get('/cases', async (req, res) => {
    const { status, priority, district, incidentType } = req.query;
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
        const cases = await prisma.case.findMany({ where });
        const features = cases.map(c => toFeature(c, 'case'));
        res.json({ type: 'FeatureCollection', features });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch case geo data' });
    }
});
// Get responder locations as GeoJSON
router.get('/responders', async (req, res) => {
    const { role, district, active } = req.query;
    const where = {};
    if (role)
        where.role = role;
    if (district)
        where.district = district;
    if (active !== undefined)
        where.active = active === 'true';
    try {
        const responders = await prisma.responder.findMany({ where });
        const features = responders.map(r => toFeature(r, 'responder'));
        res.json({ type: 'FeatureCollection', features });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch responder geo data' });
    }
});
exports.default = router;
//# sourceMappingURL=maps.js.map