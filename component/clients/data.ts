import { Users, UserCheck, Hourglass, UserX } from "lucide-react";

export const clientStats = [
  {
    icon: Users,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    label: "TOTAL CLIENTS",
    value: 48,
    trend: "up" as const,
    trendValue: "12%",
    subLabel: "+5 this month",
  },
  {
    icon: UserCheck,
    iconBg: "#dcf3e2",
    iconColor: "#16a34a",
    label: "ACTIVE CLIENTS",
    value: 38,
    trend: "up" as const,
    trendValue: "8%",
    subLabel: "79% of total",
  },
  {
    icon: Hourglass,
    iconBg: "#fdf1de",
    iconColor: "#c8973a",
    label: "PENDING ONBOARDING",
    value: 4,
    trend: "down" as const,
    trendValue: "20%",
    subLabel: "Need action",
  },
  {
    icon: UserX,
    iconBg: "#fbdada",
    iconColor: "#dc2626",
    label: "INACTIVE CLIENTS",
    value: 6,
    trend: "down" as const,
    trendValue: "14%",
    subLabel: "No activity in 30+ days",
  },
];

export const clientTabs = [
  { label: "All Clients (48)", active: true },
  { label: "Active (38)", active: false },
  { label: "Pending (4)", active: false },
  { label: "Inactive (6)", active: false },
];

export type ClientStatus = "Active" | "Pending" | "Inactive";

export type Client = {
  id: string;
  initials: string;
  avatarBg: string;
  name: string;
  company: string;
  email: string;
  tags: string[];
  since: string;
  status: ClientStatus;
};

export const clients: Client[] = [
  {
    id: "abc-restaurant",
    initials: "ABC",
    avatarBg: "#2563eb",
    name: "ABC Restaurant",
    company: "ABC Restaurant Ltd.",
    email: "info@abcrestaurant.com",
    tags: ["SEO", "Social Media", "Google Ads"],
    since: "Jan 26, 2026",
    status: "Active",
  },
  {
    id: "tech-solutions",
    initials: "TS",
    avatarBg: "#374151",
    name: "Tech Solutions",
    company: "Tech Solutions Inc.",
    email: "contact@techsolutions.com",
    tags: ["Social Media", "Content"],
    since: "Feb 3, 2026",
    status: "Active",
  },
  {
    id: "fashion-corner",
    initials: "FC",
    avatarBg: "#b8365f",
    name: "Fashion Corner",
    company: "Fashion Corner",
    email: "hello@fashioncorner.com",
    tags: ["SEO", "Social Media", "Google Ads"],
    since: "Mar 18, 2026",
    status: "Active",
  },
  {
    id: "johns-decor",
    initials: "JD",
    avatarBg: "#c8973a",
    name: "John's Decor",
    company: "John's Decor Ltd.",
    email: "info@johnsdecor.com",
    tags: ["Website", "Google Ads", "Content"],
    since: "Jan 28, 2026",
    status: "Active",
  },
  {
    id: "blunel",
    initials: "B",
    avatarBg: "#2f8f6f",
    name: "Blunel",
    company: "Blunel",
    email: "support@blunel.com",
    tags: ["SEO", "Marketing", "Social Media"],
    since: "Feb 10, 2026",
    status: "Pending",
  },
  {
    id: "greenleaf-agency",
    initials: "GR",
    avatarBg: "#16a34a",
    name: "GreenLeaf Agency",
    company: "GreenLeaf Agency",
    email: "hello@greenleaf.com",
    tags: ["Social Media", "Content"],
    since: "Mar 5, 2026",
    status: "Active",
  },
  {
    id: "spark-media",
    initials: "SP",
    avatarBg: "#3457c9",
    name: "Spark Media",
    company: "Spark Media Ltd.",
    email: "hi@sparkmedia.com",
    tags: ["Social Media", "Marketing"],
    since: "Jan 12, 2026",
    status: "Active",
  },
  {
    id: "skyline-builders",
    initials: "SL",
    avatarBg: "#8b5cf6",
    name: "Skyline Builders",
    company: "Skyline Builders Ltd.",
    email: "contact@skylinebuild.com",
    tags: ["Website", "Content"],
    since: "Apr 1, 2026",
    status: "Active",
  },
  {
    id: "nova-health",
    initials: "NH",
    avatarBg: "#dc2626",
    name: "Nova Health",
    company: "Nova Health",
    email: "info@novahealth.com",
    tags: ["Marketing", "Social Media", "Content"],
    since: "Mar 18, 2026",
    status: "Inactive",
  },
];
