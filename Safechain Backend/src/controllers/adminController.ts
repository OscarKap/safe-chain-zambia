import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Send email using nodemailer
const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = nodemailer.createTransport({
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
const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
};

// Create admin request
export const createAdminRequest = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    fullName,
    jobTitle,
    organisation,
    province,
    district,
    phone,
    email,
    reason,
    accessType,
  } = req.body;

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Approve admin request
export const approveAdminRequest = async (req: Request, res: Response) => {
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
    const verificationToken = jwt.sign(
      { userId: adminUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reject admin request
export const rejectAdminRequest = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get pending requests
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const requests = await prisma.adminAccessRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all admin users
export const getAllAdminUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Suspend admin user
export const suspendAdminUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.adminUser.update({
      where: { id },
      data: { status: 'suspended' },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Reactivate admin user
export const reactivateAdminUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.adminUser.update({
      where: { id },
      data: { status: 'active' },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get activity logs
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.adminActivityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};