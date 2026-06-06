"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cases_1 = __importDefault(require("./cases"));
const responders_1 = __importDefault(require("./responders"));
const assignments_1 = __importDefault(require("./assignments"));
const alerts_1 = __importDefault(require("./alerts"));
const maps_1 = __importDefault(require("./maps"));
const reports_1 = __importDefault(require("./reports"));
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
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT, (0, auth_1.authorizeRoles)(...allowedRoles));
// Sub‑routers – each will implement its own CRUD & business logic
router.use('/cases', cases_1.default);
router.use('/responders', responders_1.default);
router.use('/assignments', assignments_1.default);
router.use('/alerts', alerts_1.default);
router.use('/maps', maps_1.default);
router.use('/reports', reports_1.default);
exports.default = router;
//# sourceMappingURL=dashboard.js.map