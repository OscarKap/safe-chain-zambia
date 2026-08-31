// Responder departments / sectors and the case types each can typically handle.
// Used by the responder sign-up page and by admins when allocating cases.

export type Department = {
  id: string;
  label: string;
  description: string;
  /** Case types this department usually handles (ids match report categories + support types). */
  caseTypes: string[];
};

export const CASE_TYPES: { id: string; label: string }[] = [
  { id: "GBV", label: "Gender-based violence" },
  { id: "Assault", label: "Sexual assault" },
  { id: "Child", label: "Child protection" },
  { id: "Counselling", label: "Counselling & psychosocial support" },
  { id: "Mental", label: "Mental health crisis" },
  { id: "Medical", label: "Medical & emergency care" },
  { id: "STI", label: "STI / HIV & health concern" },
  { id: "Legal", label: "Legal aid & prosecution" },
  { id: "Police", label: "Police response & safety" },
  { id: "Shelter", label: "Shelter & safe housing" },
  { id: "Service", label: "Service complaint" },
  { id: "Information", label: "Health information & referral" },
  { id: "Other", label: "Other" },
];

export const CASE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  CASE_TYPES.map((c) => [c.id, c.label]),
);

export const DEPARTMENTS: Department[] = [
  {
    id: "police_vsu",
    label: "Police — Victim Support Unit (VSU)",
    description: "Criminal response, protection orders, arrests and case referral.",
    caseTypes: ["GBV", "Assault", "Child", "Police", "Legal", "Shelter"],
  },
  {
    id: "police",
    label: "Police — General duty",
    description: "Emergency response, safety escort and incident recording.",
    caseTypes: ["Police", "GBV", "Assault", "Other"],
  },
  {
    id: "health_facility",
    label: "Health centre / Clinic",
    description: "Post-rape care, medical examination, PEP, HIV and SRH services.",
    caseTypes: ["Medical", "Assault", "STI", "Information", "GBV"],
  },
  {
    id: "hospital",
    label: "Hospital — Emergency & One-Stop Centre",
    description: "Emergency medical care, forensic services and inpatient support.",
    caseTypes: ["Medical", "Assault", "GBV", "Mental", "STI"],
  },
  {
    id: "mental_health",
    label: "Mental health services",
    description: "Psychiatric assessment, crisis stabilisation and follow-up therapy.",
    caseTypes: ["Mental", "Counselling", "GBV"],
  },
  {
    id: "counselling",
    label: "Counselling & psychosocial support",
    description: "Trauma counselling, survivor support groups and follow-up care.",
    caseTypes: ["Counselling", "Mental", "GBV", "Child"],
  },
  {
    id: "church",
    label: "Church / Faith-based organisation",
    description: "Pastoral care, family mediation, shelter and community outreach.",
    caseTypes: ["Counselling", "Shelter", "Information", "Other"],
  },
  {
    id: "community_volunteer",
    label: "Community-based volunteer",
    description: "First contact in the community, escort to services and follow-up.",
    caseTypes: ["Information", "GBV", "Counselling", "Other"],
  },
  {
    id: "social_welfare",
    label: "Social welfare / Child protection",
    description: "Child protection, family tracing, placement and welfare support.",
    caseTypes: ["Child", "Shelter", "Counselling", "GBV"],
  },
  {
    id: "legal_aid",
    label: "Legal aid organisation",
    description: "Legal advice, court representation and protection orders.",
    caseTypes: ["Legal", "GBV", "Assault", "Child"],
  },
  {
    id: "ngo",
    label: "NGO / Civil society organisation",
    description: "Case management, safe houses, advocacy and survivor empowerment.",
    caseTypes: ["GBV", "Shelter", "Counselling", "Information", "Legal"],
  },
  {
    id: "shelter",
    label: "Shelter / Safe house",
    description: "Emergency accommodation and protection for survivors at risk.",
    caseTypes: ["Shelter", "GBV", "Child"],
  },
  {
    id: "other",
    label: "Other support service",
    description: "Any other service that assists survivors.",
    caseTypes: ["Other", "Information"],
  },
];

export const DEPARTMENT_LABEL: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.id, d.label]),
);

export function caseTypesFor(departmentId: string): string[] {
  return DEPARTMENTS.find((d) => d.id === departmentId)?.caseTypes ?? [];
}
