"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Verify JWT and attach user to request
const authenticateJWT = async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Missing authentication token' });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('JWT_SECRET not set');
            return res.status(500).json({ message: 'Server misconfiguration: JWT secret missing' });
        }
        const payload = jsonwebtoken_1.default.verify(token, secret);
        // Attach user info
        req.user = { id: payload.sub, role: payload.role, email: payload.email };
        // Log activity (optional – handled by separate logger)
        next();
    }
    catch (err) {
        console.error('JWT verification error', err);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateJWT = authenticateJWT;
// Role‑based authorization middleware
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthenticated' });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=auth.js.map