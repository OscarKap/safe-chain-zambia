import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';

const router = Router();
const prisma = new PrismaClient();

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
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const total = await prisma.case.count();
    const byDistrict = await prisma.case.groupBy({ by: ['district'], _count: { _all: true } });
    const byCategory = await prisma.case.groupBy({ by: ['incidentType'], _count: { _all: true } });
    const responseTimes = await computeResponseTimes();
    res.json({ total, byDistrict, byCategory, responseTimes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

// Export CSV of cases
router.get('/cases/csv', async (req: Request, res: Response) => {
  try {
    const cases = await prisma.case.findMany();
    const fields = ['id', 'incidentType', 'province', 'district', 'severity', 'status', 'priority', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(cases);
    res.header('Content-Type', 'text/csv');
    res.attachment('cases_report.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'CSV export failed' });
  }
});

export default router;