import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import casesRouter from './cases';
import respondersRouter from './responders';
import assignmentsRouter from './assignments';
import alertsRouter from './alerts';
import mapsRouter from './maps';
import reportsRouter from './reports';

// All dashboard routes require a logged‑in admin with an allowed role
const allowedRoles = [
  'SuperAdmin',
  'DistrictAdmin',
  'GBVOfficer',
  'PoliceVSUOfficer',
  'HospitalClinicOfficer',
  'NGO_CBOResponder',
  'CommunityVolunteer',
  'MentalHealthCounsellor',
  'DataReviewer',
  'Developer'
];

const router = Router();
router.use(authenticateJWT, authorizeRoles(...allowedRoles));

// Sub‑routers – each will implement its own CRUD & business logic
router.use('/cases', casesRouter);
router.use('/responders', respondersRouter);
router.use('/assignments', assignmentsRouter);
router.use('/alerts', alertsRouter);
router.use('/maps', mapsRouter);
router.use('/reports', reportsRouter);

export default router;