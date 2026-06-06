"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = exports.reactivateAdminUser = exports.suspendAdminUser = exports.getAllAdminUsers = exports.getPendingRequests = exports.rejectAdminRequest = exports.approveAdminRequest = exports.createAdminRequest = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const express_validator_1 = require("express-validator");
const prisma = new client_1.PrismaClient();
// Send email using nodemailer
const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@safechain.org',
        to,
        subject,
        html,
    });
};
// Generate a temporary password
const generateTempPassword = () => {
    return Math.random().toString(36).substring(8) + Math.random().toString(36).substring(8);
};
// Hash a password
const hashPassword = async (password) => {
    const saltRounds = 10;
    return bcryptjs_1.default.hashSync(password, saltRounds);
};
// Create admin request
const createAdminRequest = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { fullName, jobTitle, organisation, province, district, phone, email, reason, accessType, } = req.body;
    try {
        // Check if email already exists in admin requests
        const existingRequest = await prisma.adminAccessRequest.findUnique({
            where: { email },
        });
        if (existingRequest) {
            return res.status(409).json({
                message: 'An admin request with this email already exists.',
            });
        }
        // Save request to database
        const newRequest = await prisma.adminAccessRequest.create({
            data: {
                fullName,
                jobTitle,
                organisation,
                province,
                district,
                phone,
                email,
                reason,
                accessType,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            },
        });
        // Send email to Oscar
        const emailHtml = `
      <h2>New Admin Access Request</h2>
      <p>A new admin access request has been submitted. Details:</p>
      <ul>
        <li><strong>Name:</strong> ${fullName}</li>
        <li><strong>Job Title:</strong> ${jobTitle}</li>
        <li><strong>Organisation:</strong> ${organisation}</li>
        <li><strong>Province:</strong> ${province}</li>
        <li><strong>District:</strong> ${district}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Reason:</strong> ${reason}</li>
        <li><strong>Access Type:</strong> ${accessType}</li>
        <li><strong>Submitted:</strong> ${new Date().toISOString()}</li>
        <li><strong>IP Address:</strong> ${req.ip}</li>
      </ul>
      <p>Please review and approve or reject this request.</p>
      <p><a href="${process.env.ADMIN_DASHBOARD_URL}/requests/${newRequest.id}/approve">Approve</a> |
         <a href="${process.env.ADMIN_DASHBOARD_URL}/requests/${newRequest.id}/reject">Reject</a></p>
    `;
        await sendEmail('oscar@iscproject.org', 'New Admin Access Request', emailHtml);
        res.status(201).json({
            message: 'Admin request submitted successfully. You will receive a confirmation email.',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.createAdminRequest = createAdminRequest;
// Approve admin request
const approveAdminRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const request = await prisma.adminAccessRequest.findUnique({
            where: { id },
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }
        // Generate temporary password
        const tempPassword = generateTempPassword();
        const hashedPassword = await hashPassword(tempPassword);
        // Create admin user
        const adminUser = await prisma.adminUser.create({
            data: {
                username: request.email,
                email: request.email,
                hashedPassword,
                role: request.accessType,
                status: 'pending',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
            },
        });
        // Update request status
        await prisma.adminAccessRequest.update({
            where: { id },
            data: { status: 'approved' },
        });
        // Send verification email to applicant
        const verificationToken = jsonwebtoken_1.default.sign({ userId: adminUser.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        const emailHtml = `
      <h2>Admin Account Approved</h2>
      <p>Your admin account has been approved. Please verify your email and set a new password.</p>
      <p><a href="${process.env.FRONTEND_URL}/admin/verify?token=${verificationToken}">Verify Email</a></p>
      <p><strong>Temporary Credentials:</strong></p>
      <ul>
        <li>Username: ${request.email}</li>
        <li>Temporary Password: ${tempPassword}</li>
      </ul>
      <p><strong>Important:</strong> You must change your password on first login and verify your email address.</p>
      <p>This link will expire in 24 hours.</p>
    `;
        await sendEmail(request.email, 'Admin Account Approved', emailHtml);
        res.status(200).json({
            message: 'Admin request approved and user account created.',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.approveAdminRequest = approveAdminRequest;
// Reject admin request
const rejectAdminRequest = async (req, res) => {
    const { id } = req.params;
    try {
        const request = await prisma.adminAccessRequest.findUnique({
            where: { id },
        });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }
        // Update request status
        await prisma.adminAccessRequest.update({
            where: { id },
            data: { status: 'rejected' },
        });
        // Send rejection email
        const emailHtml = `
      <h2>Admin Access Request Rejected</h2>
      <p>Your admin access request has been reviewed and unfortunately not approved at this time.</p>
      <p>If you believe this was an error, please contact the administrator.</p>
    `;
        await sendEmail(request.email, 'Admin Access Request Rejected', emailHtml);
        res.status(200).json({
            message: 'Admin request rejected.',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.rejectAdminRequest = rejectAdminRequest;
// Get pending requests
const getPendingRequests = async (req, res) => {
    try {
        const requests = await prisma.adminAccessRequest.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(requests);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getPendingRequests = getPendingRequests;
// Get all admin users
const getAllAdminUsers = async (req, res) => {
    try {
        const users = await prisma.adminUser.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllAdminUsers = getAllAdminUsers;
// Suspend admin user
const suspendAdminUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.adminUser.update({
            where: { id },
            data: { status: 'suspended' },
        });
        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.suspendAdminUser = suspendAdminUser;
// Reactivate admin user
const reactivateAdminUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.adminUser.update({
            where: { id },
            data: { status: 'active' },
        });
        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.reactivateAdminUser = reactivateAdminUser;
// Get activity logs
const getActivityLogs = async (req, res) => {
    try {
        const logs = await prisma.adminActivityLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100,
        });
        res.status(200).json(logs);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getActivityLogs = getActivityLogs;
//# sourceMappingURL=adminController.js.map