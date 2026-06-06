"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const signAccessToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'defaultsecret';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'defaultsecret';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = (token) => {
    const secret = process.env.JWT_SECRET || 'defaultsecret';
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'defaultsecret';
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=jwtService.js.map