import { Users, FileText, Calendar, Trophy } from "lucide-react";

export const metricCards = [
  {
    icon: Users,
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
    value: 48,
    trend: "up" as const,
    trendValue: "12%",
    subLabel: "+5 this month",
    title: "Total Clients",
  },
  {
    icon: FileText,
    iconBg: "#f3e8ff",
    iconColor: "#9333ea",
    value: 124,
    trend: "up" as const,
    trendValue: "8%",
    subLabel: "+10 this month",
    title: "Reports Generated",
  },
  {
    icon: Calendar,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    value: 6,
    trend: "up" as const,
    trendValue: "17%",
    subLabel: "2 today",
    title: "Upcoming Meetings",
  },
  {
    icon: Trophy,
    iconBg: "#fdf1de",
    iconColor: "#c8973a",
    value: 8,
    trend: "down" as const,
    trendValue: "20%",
    subLabel: "",
    title: "Pending Approvals",
  },
];

export const supportTickets = [
  {
    id: "#TCK-1048",
    client: "Laiba",
    subject: "Document upload error",
    status: "Open",
    selected: true,
  },
  {
    id: "#TCK-1047",
    client: "ABC Restaurant",
    subject: "Missing SEO summary",
    status: "In Review",
    selected: false,
  },
  {
    id: "#TCK-1049",
    client: "Fashion Corner",
    subject: "Invoice payment clarification",
    status: "Open",
    selected: false,
  },
  {
    id: "#TCK-1042",
    client: "Tech Solutions",
    subject: "Campaign launch schedule",
    status: "Resolved",
    selected: false,
  },
];

export const ticketInspector = {
  ticketId: "#TCK-1048",
  subject: "Blog document re-upload failing",
  message:
    "I'm trying to re-upload the revised blog document, but every time I attach the PDF the system gives an upload timeout error. Could you check if there's a file size limit or something blocking it? I need this live before Friday.",
};

export const upcomingMeetings = [
  {
    month: "SEP",
    day: "07",
    client: "ABC Restaurant",
    detail: "Monthly SEO Discussion · 10:00 AM",
    status: "Today",
  },
  {
    month: "SEP",
    day: "08",
    client: "Tech Solutions",
    detail: "Social Media Review · 2:00 PM",
    status: "Tomorrow",
  },
  {
    month: "SEP",
    day: "10",
    client: "Fashion Corner",
    detail: "Marketing Strategy Call · 11:00 AM",
    status: null,
  },
  {
    month: "SEP",
    day: "12",
    client: "John's Decor",
    detail: "Website Redesign Review · 4:00 PM",
    status: null,
  },
];

export const recentReports = [
  {
    icon: FileText,
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    title: "SEO Monthly Report",
    detail: "Carter Injury Law · Generated Sep 7, 2026",
  },
  {
    icon: FileText,
    iconBg: "#f3e8ff",
    iconColor: "#9333ea",
    title: "Social Media Report",
    detail: "Carter Injury Law · Generated Sep 5, 2026",
  },
];

export const growthBars = [
  { month: "Apr", height: 38 },
  { month: "May", height: 50 },
  { month: "Jun", height: 58 },
  { month: "Jul", height: 70 },
  { month: "Aug", height: 84 },
  { month: "Sep", height: 100, active: true, tooltip: "12 clients" },
];

export const reportStatus = {
  total: 124,
  legend: [
    { label: "Sent", value: "48 (39%)", color: "#16a34a" },
    { label: "Viewed", value: "36 (29%)", color: "#2563eb" },
    { label: "Draft", value: "28 (23%)", color: "#c8973a" },
    { label: "Pending", value: "12 (9%)", color: "#dc2626" },
  ],
};

export const recentPayments = [
  {
    client: "ABC Restaurant",
    invoice: "#INV-3021",
    amount: "$450.00",
    date: "Sep 12, 2026",
    status: "Paid",
  },
  {
    client: "Fashion Corner",
    invoice: "#INV-3020",
    amount: "$680.00",
    date: "Sep 10, 2026",
    status: "Paid",
  },
];
