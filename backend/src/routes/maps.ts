import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper to convert records to GeoJSON Feature
const toFeature = (obj: any, type: string) => ({
  type: 'Feature',
  geometry: obj.coordinates ? {
    type: 'Point',
    coordinates: obj.coordinates.split(',').map((c: string) => parseFloat(c))
  } : null,
  properties: { ...obj, featureType: type }
});

// Get cases as GeoJSON – filterable via query params
router.get('/cases', async (req: Request, res: Response) => {
  const { status, priority, district, incidentType } = req.query as any;
  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (district) where.district = district;
  if (incidentType) where.incidentType = incidentType;
  try {
    const cases = await prisma.case.findMany({ where });
    const features = cases.map(c => toFeature(c, 'case'));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch case geo data' });
  }
});

// Get responder locations as GeoJSON
router.get('/responders', async (req: Request, res: Response) => {
  const { role, district, active } = req.query as any;
  const where: any = {};
  if (role) where.role = role;
  if (district) where.district = district;
  if (active !== undefined) where.active = active === 'true';
  try {
    const responders = await prisma.responder.findMany({ where });
    const features = responders.map(r => toFeature(r, 'responder'));
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch responder geo data' });
  }
});

export default router;