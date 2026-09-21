export const leadStats = [
  { label: "TOTAL LEADS", value: "84", trendValue: "12.0%", subLabel: "vs Aug" },
  { label: "NEW THIS WEEK", value: "19", trendValue: "4.2%", subLabel: "vs last wk" },
  { label: "QUALIFIED", value: "31", trendValue: "6.9%", subLabel: "vs Aug" },
  {
    label: "CONVERTED TO CLIENT",
    value: "22",
    valueSuffix: "· 26%",
    trendValue: "3.1pt",
    subLabel: "vs Aug",
  },
];

export type Lead = {
  initials: string;
  avatarBg: string;
  name: string;
  reason: string;
  source: string;
  sourceColor: string;
  received: string;
  status: string;
  statusBg: string;
  statusColor: string;
  assigned: string;
};

export const leads: Lead[] = [
  {
    initials: "MA",
    avatarBg: "#2563eb",
    name: "Maria Alvarez",
    reason: "Car Accident",
    source: "GMB Call",
    sourceColor: "#16a34a",
    received: "Sep 13",
    status: "Consultation Set",
    statusBg: "#dcf3e2",
    statusColor: "#15803d",
    assigned: "Jordan R.",
  },
  {
    initials: "TJ",
    avatarBg: "#c8973a",
    name: "Tyrell Jenkins",
    reason: "Slip & Fall",
    source: "Website Form",
    sourceColor: "#c8973a",
    received: "Sep 13",
    status: "New",
    statusBg: "#e0e7ff",
    statusColor: "#4338ca",
    assigned: "Jordan R.",
  },
  {
    initials: "DW",
    avatarBg: "#9333ea",
    name: "Denise Whitfield",
    reason: "Car Accident",
    source: "Facebook Message",
    sourceColor: "#3457c9",
    received: "Sep 12",
    status: "Contacted",
    statusBg: "#fdf1de",
    statusColor: "#a35a12",
    assigned: "Jordan R.",
  },
  {
    initials: "ML",
    avatarBg: "#dc2626",
    name: "Marcus Lee",
    reason: "Product Liability",
    source: "Blog CTA",
    sourceColor: "#c8973a",
    received: "Sep 12",
    status: "Qualified",
    statusBg: "#fdf1de",
    statusColor: "#a35a12",
    assigned: "Jordan R.",
  },
  {
    initials: "AR",
    avatarBg: "#16a34a",
    name: "Angela Ruiz",
    reason: "Motorcycle Accident",
    source: "GMB Call",
    sourceColor: "#16a34a",
    received: "Sep 11",
    status: "Converted",
    statusBg: "#16a34a",
    statusColor: "#fff",
    assigned: "Jordan R.",
  },
  {
    initials: "KO",
    avatarBg: "#0b1522",
    name: "Kevin O'Brien",
    reason: "Car Accident",
    source: "GMB Direction+Call",
    sourceColor: "#16a34a",
    received: "Sep 10",
    status: "Contacted",
    statusBg: "#fdf1de",
    statusColor: "#a35a12",
    assigned: "Jordan R.",
  },
  {
    initials: "PN",
    avatarBg: "#b8365f",
    name: "Priya Natarajan",
    reason: "Slip & Fall",
    source: "Website Form",
    sourceColor: "#c8973a",
    received: "Sep 9",
    status: "Lost",
    statusBg: "#fbdada",
    statusColor: "#b91c1c",
    assigned: "Jordan R.",
  },
  {
    initials: "SD",
    avatarBg: "#2f8f6f",
    name: "Samuel Dixon",
    reason: "Car Accident",
    source: "GMB Call",
    sourceColor: "#16a34a",
    received: "Sep 9",
    status: "Consultation Set",
    statusBg: "#dcf3e2",
    statusColor: "#15803d",
    assigned: "Jordan R.",
  },
  {
    initials: "LF",
    avatarBg: "#8b5cf6",
    name: "Latoya Freeman",
    reason: "Dog Bite",
    source: "Instagram DM",
    sourceColor: "#3457c9",
    received: "Sep 8",
    status: "New",
    statusBg: "#e0e7ff",
    statusColor: "#4338ca",
    assigned: "Jordan R.",
  },
  {
    initials: "RC",
    avatarBg: "#374151",
    name: "Robert Chen",
    reason: "Car Accident",
    source: "Website Form",
    sourceColor: "#c8973a",
    received: "Sep 7",
    status: "Converted",
    statusBg: "#16a34a",
    statusColor: "#fff",
    assigned: "Jordan R.",
  },
];

export const leadSources = [
  { label: "GMB", count: 37, width: "100%", color: "#16a34a" },
  { label: "Website", count: 31, width: "84%", color: "#c8973a" },
  { label: "Social", count: 16, width: "43%", color: "#3457c9" },
];
