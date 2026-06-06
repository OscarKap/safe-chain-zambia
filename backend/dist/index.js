"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const csurf_1 = __importDefault(require("csurf"));
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const activityLogger_1 = require("./middleware/activityLogger");
// Initialize environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
exports.app = app;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// CSRF protection
const csrfMiddleware = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true
    }
});
app.use(csrfMiddleware);
// Activity logging (after auth setup)
app.use(activityLogger_1.activityLogger);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// CSRF token endpoint
app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});
// Auth routes (login, refresh, logout)
app.use('/auth', auth_1.default);
// Protected dashboard routes – all routes under /dashboard require authentication
app.use('/dashboard', dashboard_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ error: 'CSRF token missing or invalid' });
    }
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map