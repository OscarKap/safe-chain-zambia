export type Topic = {
  id: string;
  title: string;
  description: string;
  category: "Health" | "Rights" | "Wellbeing";
  readTime: string;
  learnMore: string;
  video?: string;
};

export const topics: Topic[] = [
  { id: "contraception", title: "Contraception", description: "Birth control methods, how they work, where to get them, and your options.", category: "Health", readTime: "5 min", learnMore: "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception" },
  { id: "menstruation", title: "Menstrual Health", description: "Understanding your cycle, hygiene, and managing periods with dignity.", category: "Health", readTime: "4 min", learnMore: "https://www.who.int/health-topics/menstrual-health" },
  { id: "hiv", title: "HIV & STIs", description: "Prevention, testing, treatment, and busting common myths.", category: "Health", readTime: "6 min", learnMore: "https://www.who.int/news-room/fact-sheets/detail/hiv-aids" },
  { id: "consent", title: "Consent & Boundaries", description: "Your right to say no — what consent means in relationships.", category: "Rights", readTime: "3 min", learnMore: "https://www.who.int/health-topics/violence-against-women" },
  { id: "gbv", title: "Gender-Based Violence", description: "How to recognise GBV, where to find help, and confidential reporting.", category: "Rights", readTime: "5 min", learnMore: "https://www.unwomen.org/en/what-we-do/ending-violence-against-women" },
  { id: "mental", title: "Mental Wellbeing", description: "Coping with stress, anxiety, and where to find youth counselling support.", category: "Wellbeing", readTime: "4 min", learnMore: "https://www.who.int/health-topics/mental-health" },
];

export const languages = [
  { code: "en", name: "English" },
  { code: "bem", name: "Bemba" },
  { code: "ton", name: "Tonga" },
  { code: "nya", name: "Nyanja" },
  { code: "loz", name: "Lozi" },
];
