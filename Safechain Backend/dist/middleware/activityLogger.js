"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogger = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Middleware to log admin activity
const activityLogger = async (req, res, next) => {
    const start = Date.now();
    // capture original send to log after response
    const originalSend = res.send;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.send = async function (body) {
        // after response is sent, log activity
        try {
            const user = req.user; // set by auth middleware if present
            if (user) {
                await prisma.adminActivityLog.create({
                    data: {
                        userId: user.id,
                        action: `${req.method} ${req.originalUrl}`,
                        target: JSON.stringify({ params: req.params, query: req.query, body: req.body }),
                    },
                });
            }
        }
        catch (e) {
            console.error('Failed to log activity', e);
        }
        // call original send
        // eslint-disable-next-line prefer-rest-params
        return originalSend.apply(this, arguments);
    };
    // Continue to next middleware/handler
    next();
};
exports.activityLogger = activityLogger;
//# sourceMappingURL=activityLogger.js.map