"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
const csurf_1 = __importDefault(require("csurf"));
// Export the standard csurf middleware with cookie options only.
// The custom token generator and manual verification were invalid and caused type errors.
exports.csrfProtection = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true
    }
});
//# sourceMappingURL=csrf.js.map