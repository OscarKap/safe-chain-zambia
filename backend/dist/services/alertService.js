"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAlertPayload = exports.sendAlertSMS = exports.sendAlertEmail = void 0;
const resend_1 = __importDefault(require("resend"));
const twilio_1 = require("twilio");
// Initialise Resend client
const resendClient = (0, resend_1.default)(process.env.RESEND_API_KEY);
// Initialise Twilio client
const twilioClient = (0, twilio_1.twilio)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// Send email via Resend – templateId must exist in Resend dashboard
const sendAlertEmail = async (to, subject, html) => {
    try {
        const response = await resendClient.emails.send({
            from: process.env.EMAIL_FROM || 'no-reply@safechain.org',
            to,
            subject,
            html
        });
        return response;
    }
    catch (err) {
        console.error('Resend email error', err);
        throw err;
    }
};
exports.sendAlertEmail = sendAlertEmail;
// Send SMS via Twilio
const sendAlertSMS = async (to, body) => {
    try {
        const message = await twilioClient.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
        return message;
    }
    catch (err) {
        console.error('Twilio SMS error', err);
        throw err;
    }
};
exports.sendAlertSMS = sendAlertSMS;
// Helper to build a standard alert payload
const buildAlertPayload = (caseObj) => {
    const link = `${process.env.FRONTEND_URL}/dashboard/cases/${caseObj.id}`;
    return {
        subject: `New ${caseObj.incidentType} case – ${caseObj.priority} priority`,
        html: `<p>Case ID: <strong>${caseObj.id}</strong></p>
           <p>Type: ${caseObj.incidentType}</p>
           <p>District: ${caseObj.district}</p>
           <p>Priority: ${caseObj.priority}</p>
           <p><a href="${link}">View in dashboard</a></p>`,
        sms: `New ${caseObj.incidentType} case ${caseObj.id} – ${caseObj.priority} priority. ${link}`
    };
};
exports.buildAlertPayload = buildAlertPayload;
//# sourceMappingURL=alertService.js.map