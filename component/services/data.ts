export const serviceStats = [
  { label: "ACTIVE SERVICES", value: "4", note: "Across SEO, GMB, social & web care" },
  { label: "MONTHLY RETAINER", value: "$3,700", note: "Billed on the 1st of each month" },
  { label: "CONTRACT RENEWS", value: "Jan 15, 2027", note: "12-month term, auto-renewing", small: true },
  { label: "ADD-ON OPPORTUNITIES", value: "2", note: "Paid Search & Reputation Mgmt+" },
];

export type ServiceItem = { text: string; price: string };

export type ServiceCategory = {
  key: string;
  iconBg: string;
  title: string;
  plan: string;
  desc: string;
  price: string;
  items: ServiceItem[];
  specialist: string;
};

export const serviceCategories: ServiceCategory[] = [
  {
    key: "seo",
    iconBg: "#c8973a",
    title: "SEO & Website Optimization",
    plan: "GROWTH PLAN",
    desc: "Ongoing organic search strategy to keep you ranking for high-intent local search terms.",
    price: "1,400",
    items: [
      { text: "Monthly keyword rank tracking & reporting", price: "$250/mo" },
      { text: "On-page & technical SEO fixes", price: "$300/mo" },
      { text: "Backlink outreach (4–6 placements/mo)", price: "$300/mo" },
      { text: "Quarterly content strategy review", price: "$150/mo" },
      { text: "Local citation building", price: "$100/mo" },
      { text: "Competitor gap analysis", price: "$100/mo" },
    ],
    specialist: "Priya Shah, SEO Strategist",
  },
  {
    key: "gmb",
    iconBg: "#2f8f6f",
    title: "Google Business Profile Management",
    plan: "CORE PLAN",
    desc: "Keeps your GMB listing active, accurate, and responsive so it keeps converting map-pack traffic.",
    price: "700",
    items: [
      { text: "Weekly posts & photo updates", price: "$150/mo" },
      { text: "Review monitoring & response", price: "$150/mo" },
      { text: "Q&A section management", price: "$150/mo" },
      { text: "Monthly map-pack ranking snapshot", price: "$150/mo" },
      { text: "GMB post scheduling automation", price: "$50/mo" },
      { text: "Duplicate listing cleanup", price: "$50/mo" },
    ],
    specialist: "Marcus Webb, Local SEO Specialist",
  },
  {
    key: "social",
    iconBg: "#3457c9",
    title: "Social Media Management",
    plan: "GROWTH PLAN",
    desc: "Content, community management, and light paid boosting across Facebook & Instagram.",
    price: "1,000",
    items: [
      { text: "12 posts/month across Facebook & Instagram", price: "$300/mo" },
      { text: "Comment & DM monitoring", price: "$150/mo" },
      { text: "Monthly content calendar for your approval", price: "$150/mo" },
      { text: "Paid boost on top posts", price: "$200/mo" },
      { text: "Instagram Reels production", price: "$100/mo" },
      { text: "Influencer outreach coordination", price: "$100/mo" },
    ],
    specialist: "Dana Kim, Social Media Manager",
  },
  {
    key: "web",
    iconBg: "#0b1522",
    title: "Website Care & Hosting",
    plan: "CORE PLAN",
    desc: "Keeps your site fast, secure, and online — hosting, backups, and routine maintenance.",
    price: "600",
    items: [
      { text: "Hosting, SSL & uptime monitoring", price: "$200/mo" },
      { text: "Monthly plugin & security updates", price: "$150/mo" },
      { text: "Site speed checks", price: "$100/mo" },
      { text: "Same-business-day emergency fixes", price: "$100/mo" },
      { text: "Monthly backup verification", price: "$25/mo" },
      { text: "Uptime SLA reporting", price: "$25/mo" },
    ],
    specialist: "BayShore Dev Team",
  },
];

export const contractOverview = [
  { label: "Client since", value: "Jan 15, 2025" },
  { label: "Current term", value: "12 months" },
  { label: "Next renewal", value: "Jan 15, 2027" },
  { label: "Billing cycle", value: "Monthly, on the 1st" },
];
