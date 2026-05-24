import raw from "./facilities.json";

export type Facility = {
  province: string;
  district: string;
  code: string;
  name: string;
  type: string;
  owner: string;
};

export const facilities: Facility[] = raw as Facility[];

// All 10 Zambian provinces with their districts (canonical list).
// Districts with data parsed from the official 2012 Health Facilities list
// appear in `facilities`; other districts render the empty-state.
export const ZAMBIA: Record<string, string[]> = {
  Central: ["Chibombo", "Chitambo", "Itezhi-Tezhi", "Kabwe", "Kapiri Mposhi", "Luano", "Mkushi", "Mumbwa", "Ngabwe", "Serenje", "Shibuyunji"],
  Copperbelt: ["Chililabombwe", "Chingola", "Kalulushi", "Kitwe", "Luanshya", "Lufwanyama", "Masaiti", "Mpongwe", "Mufulira", "Ndola"],
  Eastern: ["Chadiza", "Chasefu", "Chipangali", "Chipata", "Kasenengwa", "Katete", "Lumezi", "Lundazi", "Lusangazi", "Mambwe", "Nyimba", "Petauke", "Sinda", "Vubwi"],
  Luapula: ["Chembe", "Chiengi", "Chifunabuli", "Chipili", "Kawambwa", "Lunga", "Mansa", "Milenge", "Mwansabombwe", "Mwense", "Nchelenge", "Samfya"],
  Lusaka: ["Chilanga", "Chongwe", "Kafue", "Luangwa", "Lusaka", "Rufunsa", "Shibuyunji"],
  Muchinga: ["Chama", "Chinsali", "Isoka", "Kanchibiya", "Lavushimanda", "Mafinga", "Mpika", "Nakonde", "Shiwang'andu"],
  Northern: ["Chilubi", "Kaputa", "Kasama", "Lunte", "Lupososhi", "Luwingu", "Mbala", "Mporokoso", "Mpulungu", "Mungwi", "Nsama", "Senga Hill"],
  "North-Western": ["Chavuma", "Ikelenge", "Kabompo", "Kalumbila", "Kasempa", "Manyinga", "Mufumbwe", "Mushindamo", "Mwinilunga", "Solwezi", "Zambezi"],
  Southern: ["Chikankata", "Chirundu", "Choma", "Gwembe", "Itezhi-Tezhi", "Kalomo", "Kazungula", "Livingstone", "Mazabuka", "Monze", "Namwala", "Pemba", "Siavonga", "Sinazongwe", "Zimba"],
  Western: ["Kalabo", "Kaoma", "Limulunga", "Luampa", "Lukulu", "Mitete", "Mongu", "Mulobezi", "Mwandi", "Nalolo", "Nkeyema", "Senanga", "Sesheke", "Shang'ombo", "Sikongo", "Sioma"],
};

export const PROVINCES = Object.keys(ZAMBIA);

// Inferred standard service offerings by facility type (used until per-facility
// service data is digitised). Keeps the UX consistent across all facilities.
export function servicesFor(type: string): string[] {
  const base = ["Outpatient", "Counseling"];
  if (type.includes("Hospital")) {
    return ["Outpatient", "Inpatient", "Maternity & Delivery", "Lab", "Emergency", "HIV / ART", "PMTCT", "Family Planning", "Referral", "Pharmacy"];
  }
  if (type === "Urban Health Centre" || type === "Rural Health Centre" || type === "Hospital Affiliated Health Centre") {
    return [...base, "Maternity & Delivery", "HIV / ART", "PMTCT", "Family Planning", "Antenatal Care", "Immunisation", "Referral"];
  }
  if (type === "Health Post") {
    return [...base, "Antenatal Care", "Immunisation", "HIV Testing", "Referral"];
  }
  return base;
}

export const SERVICE_FILTERS: { id: string; label: string; match: (s: string[]) => boolean }[] = [
  { id: "hiv", label: "HIV / ART", match: (s) => s.some((x) => x.includes("HIV")) },
  { id: "srh", label: "Family planning", match: (s) => s.includes("Family Planning") },
  { id: "maternal", label: "Maternal & antenatal", match: (s) => s.includes("Antenatal Care") || s.includes("Maternity & Delivery") },
  { id: "delivery", label: "Delivery", match: (s) => s.includes("Maternity & Delivery") },
  { id: "emergency", label: "Emergency", match: (s) => s.includes("Emergency") },
  { id: "lab", label: "Lab services", match: (s) => s.includes("Lab") },
  { id: "referral", label: "Referral capable", match: (s) => s.includes("Referral") },
];
