import { Resend } from 'resend';
import twilio from 'twilio';

// Initialise Resend client – if API key missing, use a mock client
let resendClient: any;
if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
} else {
  // Mock client with same interface for development/testing
  resendClient = {
    emails: {
      send: async () => ({ id: 'mock-email-id' })
    }
  };
}

// Initialise Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send email via Resend – templateId must exist in Resend dashboard
export const sendAlertEmail = async (to: string, subject: string, html: string) => {
  try {
    const response = await resendClient.emails.send({
      from: process.env.EMAIL_FROM || 'no-reply@safechain.org',
      to,
      subject,
      html
    });
    return response;
  } catch (err) {
    logger.error('Resend email error', err);
    throw err;
  }
};

// Send SMS via Twilio
export const sendAlertSMS = async (to: string, body: string) => {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    return message;
  } catch (err) {
    console.error('Twilio SMS error', err);
    throw err;
  }
};

// Helper to build a standard alert payload
export const buildAlertPayload = (caseObj: any) => {
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