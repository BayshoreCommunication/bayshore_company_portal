import { HeartPulse, Palmtree, Wine, Stethoscope, type LucideIcon } from "lucide-react";

export type ReportStatus = "Completed" | "Draft";

export type MonthlyReportRow = {
  client: string;
  initials: string;
  icon?: LucideIcon;
  avatarBg: string;
  reportDate: string;
  status: ReportStatus;
  lastUpdated: string;
};

export const monthlyReports: MonthlyReportRow[] = [
  {
    client: "Carter Injury Law",
    initials: "C",
    avatarBg: "#0f172a",
    reportDate: "August 2026",
    status: "Completed",
    lastUpdated: "Sep 2, 2026 10:24 AM",
  },
  {
    client: "McCulloch Law P.A.",
    initials: "M",
    avatarBg: "#1e3a8a",
    reportDate: "August 2026",
    status: "Draft",
    lastUpdated: "Sep 1, 2026 02:15 PM",
  },
  {
    client: "Apex Advisor Group",
    initials: "A",
    avatarBg: "#d99136",
    reportDate: "August 2026",
    status: "Completed",
    lastUpdated: "Aug 31, 2026 11:48 AM",
  },
  {
    client: "Trip Law, P.A.",
    initials: "T",
    avatarBg: "#334155",
    reportDate: "August 2026",
    status: "Draft",
    lastUpdated: "Aug 30, 2026 04:20 PM",
  },
  {
    client: "Prestige Medical & Physical Therapy",
    initials: "+",
    avatarBg: "#059669",
    reportDate: "August 2026",
    status: "Completed",
    lastUpdated: "Aug 29, 2026 10:12 AM",
  },
  {
    client: "Medical Weight Loss Tampa",
    initials: "MW",
    icon: HeartPulse,
    avatarBg: "#65a30d",
    reportDate: "August 2026",
    status: "Draft",
    lastUpdated: "Aug 28, 2026 03:30 PM",
  },
  {
    client: "Tiki Travel Agency",
    initials: "TT",
    icon: Palmtree,
    avatarBg: "#0284c7",
    reportDate: "August 2026",
    status: "Completed",
    lastUpdated: "Aug 27, 2026 09:18 AM",
  },
  {
    client: "Time for Wine",
    initials: "TW",
    icon: Wine,
    avatarBg: "#831843",
    reportDate: "August 2026",
    status: "Draft",
    lastUpdated: "Aug 26, 2026 01:45 PM",
  },
  {
    client: "Jachimek Chiropractic",
    initials: "JC",
    icon: Stethoscope,
    avatarBg: "#0d9488",
    reportDate: "August 2026",
    status: "Completed",
    lastUpdated: "Aug 25, 2026 05:22 PM",
  },
  {
    client: "TSG ProAdvisor",
    initials: "TSG",
    avatarBg: "#090d16",
    reportDate: "August 2026",
    status: "Draft",
    lastUpdated: "Aug 24, 2026 12:10 PM",
  },
];

export const reportClientOptions = [
  "All Clients",
  "Carter Injury Law",
  "McCulloch Law P.A.",
  "Apex Advisor Group",
];

export const reportDateOptions = ["All Dates (August 2026)", "September 2026", "July 2026"];
