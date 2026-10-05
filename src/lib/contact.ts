// Survivor contact helpers. Device links only (wa.me / sms: / tel:) — swap the
// `sendVia*` builders for a real SMS/WhatsApp gateway later without touching the UI.

export type ContactMethod = "sms" | "whatsapp" | "call" | "message" | "none";

export const CONTACT_METHODS: { id: ContactMethod; label: string; needsPhone: boolean }[] = [
  { id: "sms", label: "SMS", needsPhone: true },
  { id: "whatsapp", label: "WhatsApp", needsPhone: true },
  { id: "call", label: "Phone call", needsPhone: true },
  { id: "message", label: "SafeChain message", needsPhone: false },
  { id: "none", label: "I do not want to be contacted", needsPhone: false },
];

export const CONTACT_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  CONTACT_METHODS.map((m) => [m.id, m.label]),
);

export const CONTACT_OUTCOMES = [
  "Contacted — assistance provided",
  "Contacted — referral required",
  "Contacted — follow-up required",
  "Unable to reach",
  "Survivor requested no further contact",
] as const;

export const CONTACT_ACTIONS = [
  "Advice provided",
  "Hospital/health facility referral",
  "Counselling referral",
  "Legal assistance referral",
  "Police/GBV referral",
  "SRHR service referral",
  "Other",
] as const;

export const REFERRAL_TYPES = [
  "Hospital/Health Facility",
  "Counselling",
  "Legal Aid",
  "Police/GBV service",
  "SRHR service",
  "Shelter/Safe House",
  "Other",
] as const;

export const FOLLOW_UP_OPTIONS = [
  { id: "none", label: "No follow-up required", days: null },
  { id: "24h", label: "Follow up in 24 hours", days: 1 },
  { id: "48h", label: "Follow up in 48 hours", days: 2 },
  { id: "7d", label: "Follow up in 7 days", days: 7 },
  { id: "custom", label: "Custom date", days: null },
] as const;

/** Short human case reference, e.g. SC-2026-1A2B3C4D. */
export function caseRef(id: string, createdAt?: string): string {
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  return `SC-${year}-${id.slice(0, 8).toUpperCase()}`;
}

/** Normalise a Zambian number to international digits (no +). 0975… → 260975… */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("260")) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `260${digits.slice(1)}`;
  if (digits.length === 9) return `260${digits}`;
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw);
  return n.length >= 11 && n.length <= 15;
}

export function followUpDate(option: string, custom: string, from = new Date()): string | null {
  if (option === "custom") return custom || null;
  const o = FOLLOW_UP_OPTIONS.find((f) => f.id === option);
  if (!o || o.days == null) return null;
  const d = new Date(from);
  d.setDate(d.getDate() + o.days);
  return d.toISOString().slice(0, 10);
}

export function firstContactMessage(ref: string, channel: "whatsapp" | "sms"): string {
  return channel === "whatsapp"
    ? `Hello. This is a SafeChain responder following up on your report ${ref}. Is it safe for us to communicate with you here?`
    : `Hello. This is a SafeChain responder following up on your report ${ref}. Is it safe for us to communicate with you?`;
}

export interface ReferralInput {
  type: string; facility: string; location: string; contact: string; service: string; instructions: string;
}

export function referralMessage(ref: string, r: ReferralInput): string {
  const lines = [
    "SafeChain Referral",
    "",
    `Case: ${ref}`,
    `Service: ${r.service || r.type}`,
    `Facility: ${r.facility}`,
    r.location && `Location: ${r.location}`,
    r.contact && `Contact: ${r.contact}`,
    r.instructions && `Note: ${r.instructions}`,
    "",
    "Please contact the facility for assistance. If you need further support, you may contact SafeChain again using your case reference.",
  ].filter((l) => l !== false && l !== undefined && l !== null) as string[];
  return lines.join("\n");
}

export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function smsLink(phone: string, text: string): string {
  return `sms:+${normalizePhone(phone)}?body=${encodeURIComponent(text)}`;
}

export function telLink(phone: string): string {
  return `tel:+${normalizePhone(phone)}`;
}
