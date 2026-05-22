export type Clinic = {
  id: number;
  name: string;
  district: string;
  phone: string;
  address: string;
  services: string[];
  distance: string;
  youthFriendly: boolean;
  accessible?: boolean;
};

export const clinics: Clinic[] = [
  { id: 1, name: "Lusaka Youth Health Center", district: "Lusaka", phone: "0955 123456", address: "Kabulonga Road, Lusaka", services: ["STI Testing", "Contraception", "Counseling"], distance: "2.5 km", youthFriendly: true, accessible: true },
  { id: 2, name: "Copperbelt Medical Trust", district: "Kitwe", phone: "0977 234567", address: "Chamboli Road, Kitwe", services: ["HIV Testing", "Family Planning", "GBV Support"], distance: "3.1 km", youthFriendly: true, accessible: true },
  { id: 3, name: "Livingstone Youth Clinic", district: "Livingstone", phone: "0966 345678", address: "Maramba Road, Livingstone", services: ["STI Treatment", "Counseling", "Emergency Care"], distance: "1.8 km", youthFriendly: true, accessible: false },
  { id: 4, name: "Ndola District Hospital", district: "Ndola", phone: "0955 456789", address: "Copperbelt Avenue, Ndola", services: ["General Health", "Maternal Health", "Vaccination"], distance: "4.2 km", youthFriendly: false, accessible: true },
  { id: 5, name: "Kabwe Health Post", district: "Kabwe", phone: "0977 567890", address: "Kabwe Town Center", services: ["Primary Care", "Health Education", "Referrals"], distance: "5.0 km", youthFriendly: true, accessible: false },
  { id: 6, name: "Chipata Youth Friendly Services", district: "Chipata", phone: "0966 678901", address: "Chipata Boma", services: ["STI Prevention", "Contraception", "Health Counseling"], distance: "2.3 km", youthFriendly: true, accessible: true },
  { id: 7, name: "Solwezi Community Clinic", district: "Solwezi", phone: "0955 789012", address: "Independence Way, Solwezi", services: ["HIV Testing", "Counseling", "Referrals"], distance: "3.7 km", youthFriendly: true, accessible: true },
  { id: 8, name: "Mongu Wellness Hub", district: "Mongu", phone: "0966 890123", address: "Limulunga Road, Mongu", services: ["Family Planning", "GBV Support", "Mental Health"], distance: "2.9 km", youthFriendly: true, accessible: false },
];
