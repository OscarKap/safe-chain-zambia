import { PrismaClient, ResponderRole, IncidentCategory } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Suggest responders for a given case based on district, incident type and availability.
 * Returns an array of responder objects ordered by relevance.
 */
export const suggestResponders = async (caseId: string) => {
  const caseObj = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseObj) throw new Error('Case not found');
  // Map incident to likely roles
  const roleMap: Record<IncidentCategory, ResponderRole[]> = {
    GBV: ['PoliceVSUOfficer', 'NGO_CBOResponder', 'HospitalClinicOfficer', 'Counsellor'],
    SexualAssault: ['PoliceVSUOfficer', 'NGO_CBOResponder', 'HospitalClinicOfficer', 'Counsellor'],
    ChildAbuse: ['PoliceVSUOfficer', 'NGO_CBOResponder', 'HospitalClinicOfficer'],
    SuicideRisk: ['MentalHealthCounsellor', 'Counsellor', 'HospitalClinicOfficer'],
    MentalHealthCrisis: ['MentalHealthCounsellor', 'Counsellor'],
    ForcedMarriage: ['PoliceVSUOfficer', 'NGO_CBOResponder'],
    PhysicalViolence: ['PoliceVSUOfficer', 'HospitalClinicOfficer'],
    STI_HIV_Emergency: ['HospitalClinicOfficer', 'NGO_CBOResponder'],
    UnsafeAbortion: ['HospitalClinicOfficer', 'NGO_CBOResponder'],
    Harassment: ['PoliceVSUOfficer', 'NGO_CBOResponder'],
    HumanTrafficking: ['PoliceVSUOfficer', 'NGO_CBOResponder'],
    EmergencyMedicalNeed: ['HospitalClinicOfficer'],
    MissingPerson: ['PoliceVSUOfficer', 'NGO_CBOResponder'],
    Other: []
  };
  const possibleRoles = roleMap[caseObj.incidentType] || [];
  // Query responders matching district, active, availability and role
  const responders = await prisma.responder.findMany({
    where: {
      district: caseObj.district,
      active: true,
      availability: true,
      role: { in: possibleRoles }
    },
    orderBy: { createdAt: 'desc' }
  });
  return responders;
};

/**
 * Bulk assign responders to a case and log the assignment.
 */
export const assignResponders = async (caseId: string, responderIds: string[], assignerId: string) => {
  const assignments = responderIds.map(rId => ({
    caseId,
    responderId: rId,
    assignedAt: new Date()
  }));
  await prisma.assignment.createMany({ data: assignments });
  // Log assignment activity
  await prisma.adminActivityLog.create({
    data: {
      userId: assignerId,
      action: 'assign_responders',
      target: `caseId:${caseId} responders:${responderIds.join(',')}`
    }
  });
};