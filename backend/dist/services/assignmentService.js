"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignResponders = exports.suggestResponders = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Suggest responders for a given case based on district, incident type and availability.
 * Returns an array of responder objects ordered by relevance.
 */
const suggestResponders = async (caseId) => {
    const caseObj = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseObj)
        throw new Error('Case not found');
    // Map incident to likely roles
    const roleMap = {
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
exports.suggestResponders = suggestResponders;
/**
 * Bulk assign responders to a case and log the assignment.
 */
const assignResponders = async (caseId, responderIds, assignerId) => {
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
exports.assignResponders = assignResponders;
//# sourceMappingURL=assignmentService.js.map