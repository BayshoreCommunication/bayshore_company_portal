export type CalendarDay = { dow: string; date: string; available: boolean };

export type Specialist = {
  key: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  category: string;
  desc: string;
  days: CalendarDay[];
};

export const specialists: Specialist[] = [
  {
    key: "jewel",
    name: "Md. Jewel",
    role: "SEO Specialist",
    avatar: "MJ",
    color: "#c8973a",
    category: "SEO & Website Optimization",
    desc: "Keyword strategy, technical SEO fixes, and ranking reports.",
    days: [
      { dow: "Wed", date: "16", available: true },
      { dow: "Thu", date: "17", available: true },
      { dow: "Fri", date: "18", available: false },
      { dow: "Sat", date: "19", available: false },
      { dow: "Sun", date: "20", available: false },
      { dow: "Mon", date: "21", available: true },
      { dow: "Tue", date: "22", available: true },
    ],
  },
  {
    key: "shafikur",
    name: "Shafikur Rahman",
    role: "Local SEO Specialist",
    avatar: "SR",
    color: "#2f8f6f",
    category: "Google Business Profile Management",
    desc: "GMB listings, reviews, map-pack visibility, and local search.",
    days: [
      { dow: "Wed", date: "16", available: false },
      { dow: "Thu", date: "17", available: true },
      { dow: "Fri", date: "18", available: true },
      { dow: "Sat", date: "19", available: false },
      { dow: "Sun", date: "20", available: false },
      { dow: "Mon", date: "21", available: true },
      { dow: "Tue", date: "22", available: false },
    ],
  },
  {
    key: "tahira",
    name: "Tahira",
    role: "Social Media Manager",
    avatar: "T",
    color: "#3457c9",
    category: "Social Media Management",
    desc: "Content calendars, posting strategy, and platform growth.",
    days: [
      { dow: "Wed", date: "16", available: true },
      { dow: "Thu", date: "17", available: false },
      { dow: "Fri", date: "18", available: true },
      { dow: "Sat", date: "19", available: false },
      { dow: "Sun", date: "20", available: false },
      { dow: "Mon", date: "21", available: false },
      { dow: "Tue", date: "22", available: true },
    ],
  },
  {
    key: "rakibul",
    name: "Rakibul Islam",
    role: "Website Care Specialist",
    avatar: "RI",
    color: "#0b1522",
    category: "Website Care & Hosting",
    desc: "Hosting, security, maintenance, and site performance.",
    days: [
      { dow: "Wed", date: "16", available: false },
      { dow: "Thu", date: "17", available: true },
      { dow: "Fri", date: "18", available: false },
      { dow: "Sat", date: "19", available: false },
      { dow: "Sun", date: "20", available: false },
      { dow: "Mon", date: "21", available: true },
      { dow: "Tue", date: "22", available: true },
    ],
  },
  {
    key: "faria",
    name: "Faria Laiba",
    role: "Project Manager / Business Analyst",
    avatar: "FL",
    color: "#0b4d4a",
    category: "General / Account Questions",
    desc: "Timelines, scope, billing, or anything else on the account.",
    days: [
      { dow: "Wed", date: "16", available: true },
      { dow: "Thu", date: "17", available: true },
      { dow: "Fri", date: "18", available: true },
      { dow: "Sat", date: "19", available: false },
      { dow: "Sun", date: "20", available: false },
      { dow: "Mon", date: "21", available: true },
      { dow: "Tue", date: "22", available: false },
    ],
  },
];

export type Meeting = {
  id: string;
  clientName: string;
  day: string;
  date: string;
  status: "pending" | "approved";
};

export const sampleMeetings: Record<string, Meeting[]> = {
  faria: [
    { id: "req_sample_1", clientName: "Carter Injury Law", day: "Wed", date: "16", status: "pending" },
  ],
};
