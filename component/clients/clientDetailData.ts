import {
  Search,
  Share2,
  Megaphone,
  FileText,
  Calendar,
  Package,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export const detailTabs = ["Overview", "Reports", "Content", "Meetings", "Messages", "Payments"];

export const miniStats: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string;
  trendValue?: string;
  label: string;
  note: string;
  noteColor?: string;
}[] = [
  {
    icon: FileText,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    value: "12",
    trendValue: "▲ 20%",
    label: "Total Reports",
    note: "3 pending approval",
    noteColor: "#a35a12",
  },
  {
    icon: Calendar,
    iconBg: "#e0e7ff",
    iconColor: "#4338ca",
    value: "4",
    label: "Upcoming Meetings",
    note: "Next: Sep 10, 2026",
  },
  {
    icon: Package,
    iconBg: "#dcf3e2",
    iconColor: "#16a34a",
    value: "3",
    label: "Active Services",
    note: "SEO, Social Media, Marketing",
  },
  {
    icon: MessageSquare,
    iconBg: "#f3e8ff",
    iconColor: "#9333ea",
    value: "8",
    label: "Unread Messages",
    note: "Last message: 2 hours ago",
  },
];

export const recentReports = [
  {
    icon: FileText,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    name: "SEO Monthly Report",
    period: "Aug 2026",
    status: "Sent",
    generatedOn: "Sep 7, 2026",
    linked: true,
  },
  {
    icon: FileText,
    iconBg: "#f3e8ff",
    iconColor: "#9333ea",
    name: "Social Media Report",
    period: "Aug 2026",
    status: "Pending",
    generatedOn: "Sep 5, 2026",
    linked: false,
  },
  {
    icon: FileText,
    iconBg: "#fbdada",
    iconColor: "#b91c1c",
    name: "Marketing Report",
    period: "Jul 2026",
    status: "Sent",
    generatedOn: "Sep 1, 2026",
    linked: false,
  },
  {
    icon: FileText,
    iconBg: "#dcf3e2",
    iconColor: "#16a34a",
    name: "Website Performance",
    period: "Jul 2026",
    status: "Published",
    generatedOn: "Aug 28, 2026",
    linked: false,
  },
  {
    icon: FileText,
    iconBg: "#fdf1de",
    iconColor: "#c8973a",
    name: "Google Ads Report",
    period: "Jul 2026",
    status: "Draft",
    generatedOn: "Aug 25, 2026",
    linked: false,
  },
];

export const activeServices: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  startedOn: string;
}[] = [
  {
    icon: Search,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    title: "SEO Services",
    startedOn: "Started Jan 15, 2026",
  },
  {
    icon: Share2,
    iconBg: "#f3e8ff",
    iconColor: "#9333ea",
    title: "Social Media Management",
    startedOn: "Started Jan 15, 2026",
  },
  {
    icon: Megaphone,
    iconBg: "#fbdada",
    iconColor: "#dc2626",
    title: "Digital Marketing",
    startedOn: "Started Feb 1, 2026",
  },
];

export const upcomingMeetings = [
  {
    month: "SEP",
    day: "10",
    title: "Monthly Review Meeting",
    detail: "10:00 AM – 11:00 AM · Online (Google Meet)",
  },
  {
    month: "SEP",
    day: "18",
    title: "Marketing Strategy Discussion",
    detail: "2:00 PM – 3:00 PM · Office Meeting",
  },
  {
    month: "SEP",
    day: "25",
    title: "Content Planning",
    detail: "11:00 AM – 12:00 PM · Online (Zoom)",
  },
];

/** Demo copy shown for every client until this is wired to real backend data. */
export const detailExtras = {
  tagline: "Innovative Solutions for a Better Tomorrow",
  address: "123 Business Street, Dhaka, Bangladesh",
  city: "Dhaka, Bangladesh",
  website: "www.example.com",
  phone: "+1 987 654 3210",
  accountManager: "Jordan Reyes",
  notes: "Key client. Monthly reporting and regular meetings. Focus on growth and brand awareness.",
};
