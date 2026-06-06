"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwtService_1 = require("../services/jwtService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Login - expects email and password
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }
    try {
        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const passwordMatch = bcryptjs_1.default.compareSync(password, admin.hashedPassword);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Create tokens
        const accessToken = (0, jwtService_1.signAccessToken)({ sub: admin.id, role: admin.role, email: admin.email });
        const refreshToken = (0, jwtService_1.signRefreshToken)({ sub: admin.id });
        // Set HttpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000, // 1h
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
        });
        // Log login activity
        await prisma.adminActivityLog.create({
            data: {
                userId: admin.id,
                action: 'login',
                target: `email:${email}`,
            },
        });
        res.json({ message: 'Login successful' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        return res.status(401).json({ message: 'Refresh token missing' });
    }
    try {
        const payload = jwtService_1.signRefreshToken ? require('../services/jwtService').verifyRefreshToken(token) : null;
        const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        const newAccess = (0, jwtService_1.signAccessToken)({ sub: admin.id, role: admin.role, email: admin.email });
        res.cookie('accessToken', newAccess, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });
        res.json({ message: 'Token refreshed' });
    }
    catch (err) {
        console.error(err);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
});
// Logout – clear cookies and log activity
router.post('/logout', auth_1.authenticateJWT, async (req, res) => {
    const user = req.user;
    await prisma.adminActivityLog.create({
        data: {
            userId: user.id,
            action: 'logout',
            target: `email:${user.email}`,
        },
    });
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map