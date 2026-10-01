import contraceptionMd from "@/content/articles/contraception.md?raw";
import menstrualMd from "@/content/articles/menstrual.md?raw";
import hivMd from "@/content/articles/hiv.md?raw";
import consentMd from "@/content/articles/consent.md?raw";
import gbvMd from "@/content/articles/gbv.md?raw";
import mentalMd from "@/content/articles/mental.md?raw";
import relationshipsMd from "@/content/articles/relationships.md?raw";
import rightsMd from "@/content/articles/rights.md?raw";
import emergencyMd from "@/content/articles/emergency.md?raw";

import contraceptionImg from "@/assets/youth/contraception-youth.jpg.asset.json";
import menstrualImg from "@/assets/youth/menstrual-youth.jpg.asset.json";
import hivImg from "@/assets/youth/hiv-youth.webp.asset.json";
import consentImg from "@/assets/youth/consent-youth.jpg.asset.json";
import gbvImg from "@/assets/topics/gbv.jpg";
import mentalImg from "@/assets/youth/mental-youth.jpg.asset.json";
import relationshipsImg from "@/assets/youth/relationships-youth.jpg.asset.json";
import rightsImg from "@/assets/youth/rights-youth.jpg.asset.json";
import emergencyImg from "@/assets/topics/emergency.jpg";

export type Category =
  | "Health"
  | "Relationships"
  | "Wellbeing"
  | "Rights"
  | "Safety";

export type Article = {
  slug: string;
  title: string;
  category: Category;
  summary: string;
  image: string;
  content: string;
  tags: string[];
  showEmergency?: boolean;
};

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(2, Math.round(words / 200));
  return `${mins} min read`;
}

export const articles: Article[] = [
  {
    slug: "contraception",
    title: "Contraception",
    category: "Health",
    summary:
      "Birth control methods, how they work, where to get them, and what to expect — explained without judgement.",
    image: contraceptionImg.url,
    content: contraceptionMd,
    tags: ["pregnancy", "condoms", "family planning", "pills", "implant", "IUD", "emergency contraception"],
  },
  {
    slug: "menstrual",
    title: "Menstrual Health",
    category: "Health",
    summary:
      "Your cycle, hygiene, period pain, and managing periods with dignity — at school, at home, anywhere.",
    image: menstrualImg.url,
    content: menstrualMd,
    tags: ["period", "period pain", "menstruation", "hygiene", "pads", "cycle"],
  },
  {
    slug: "hiv",
    title: "HIV & STIs",
    category: "Health",
    summary:
      "Prevention, testing, treatment, and busting common myths — knowing your status is strength, not shame.",
    image: hivImg.url,
    content: hivMd,
    tags: ["HIV", "HIV testing", "STI", "condoms", "PEP", "ART", "AIDS"],
    showEmergency: true,
  },
  {
    slug: "consent",
    title: "Consent & Boundaries",
    category: "Relationships",
    summary:
      "What real consent looks like, your right to say no, and how to protect yourself online and offline.",
    image: consentImg.url,
    content: consentMd,
    tags: ["consent", "boundaries", "no", "respect", "online safety"],
  },
  {
    slug: "gbv",
    title: "Gender-Based Violence",
    category: "Safety",
    summary:
      "How to recognise GBV, support a friend, find confidential help, and protect yourself.",
    image: gbvImg,
    content: gbvMd,
    tags: ["GBV", "abuse", "violence", "report", "survivor", "safety"],
    showEmergency: true,
  },
  {
    slug: "mental",
    title: "Mental Wellbeing",
    category: "Wellbeing",
    summary:
      "Coping with stress, anxiety and depression — and where to find youth counselling support.",
    image: mentalImg.url,
    content: mentalMd,
    tags: ["depression", "anxiety", "stress", "mental health", "suicide", "counselling"],
    showEmergency: true,
  },
  {
    slug: "relationships",
    title: "Healthy Relationships",
    category: "Relationships",
    summary:
      "What healthy love looks like, warning signs to watch for, and how to communicate with respect.",
    image: relationshipsImg.url,
    content: relationshipsMd,
    tags: ["relationships", "love", "trust", "communication", "boundaries"],
  },
  {
    slug: "rights",
    title: "Youth Rights",
    category: "Rights",
    summary:
      "Your rights at home, school, in healthcare, and online — and how to act when they are violated.",
    image: rightsImg.url,
    content: rightsMd,
    tags: ["rights", "law", "school", "disability", "privacy"],
  },
  {
    slug: "emergency",
    title: "Emergency Support",
    category: "Safety",
    summary:
      "What to do right now if you or someone you know is in danger, and time-sensitive care that can save a life.",
    image: emergencyImg,
    content: emergencyMd,
    tags: ["emergency", "help", "suicide", "PEP", "crisis"],
    showEmergency: true,
  },
];



export const articleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.slug === slug);

export const articleReadingTime = (a: Article): string => readingTime(a.content);

export const articleWordCount = (a: Article): number =>
  a.content.trim().split(/\s+/).length;

export const categories: Category[] = [
  "Health",
  "Safety",
  "Wellbeing",
  "Relationships",
  "Rights",
];
