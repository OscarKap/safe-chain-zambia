"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const json2csv_1 = require("json2csv");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Helper to compute response time (createdAt -> first status change to InProgress)
const computeResponseTimes = async () => {
    const cases = await prisma.case.findMany({});
    // Simplified: assume updatedAt marks response time for demo purposes
    return cases.map(c => ({
        caseId: c.id,
        incidentType: c.incidentType,
        district: c.district,
        responseTimeHours: Math.round((c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60))
    }));
};
// Endpoint: GET /reports/summary – returns JSON summary
router.get('/summary', async (req, res) => {
    try {
        const total = await prisma.case.count();
        const byDistrict = await prisma.case.groupBy({ by: ['district'], _count: { _all: true } });
        const byCategory = await prisma.case.groupBy({ by: ['incidentType'], _count: { _all: true } });
        const responseTimes = await computeResponseTimes();
        res.json({ total, byDistrict, byCategory, responseTimes });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to generate report' });
    }
});
// Export CSV of cases
router.get('/cases/csv', async (req, res) => {
    try {
        const cases = await prisma.case.findMany();
        const fields = ['id', 'incidentType', 'province', 'district', 'severity', 'status', 'priority', 'createdAt'];
        const parser = new json2csv_1.Parser({ fields });
        const csv = parser.parse(cases);
        res.header('Content-Type', 'text/csv');
        res.attachment('cases_report.csv');
        res.send(csv);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'CSV export failed' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map