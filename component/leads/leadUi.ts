import type { Lead, LeadChannel, LeadSource, LeadStatus } from "@/app/actions/leads";

export const LEADS_PER_PAGE = 10;
export const LEAD_NOTES_LIMIT = 500;
export const LEAD_CASE_TYPE_LIMIT = 100;

// Pill colors for each step a lead moves through — no two steps share a color.
export const LEAD_STATUSES: Record<LeadStatus, { label: string; color: string; background: string; dot: string }> = {
  new: { label: "New", color: "#3730a3", background: "#e3e7fb", dot: "#4f46e5" },
  contacted: { label: "Contacted", color: "#a35a12", background: "#fbecd3", dot: "#d99136" },
  qualified: { label: "Qualified", color: "#6d28d9", background: "#ece4fb", dot: "#7c3aed" },
  consultation_set: { label: "Consultation Set", color: "#0e7490", background: "#d3eff5", dot: "#0891b2" },
  converted: { label: "Converted", color: "#15803d", background: "#d6eadb", dot: "#16a34a" },
  lost: { label: "Lost", color: "#475569", background: "#e8ecf1", dot: "#64748b" },
};
export const LEAD_STATUS_KEYS = Object.keys(LEAD_STATUSES) as LeadStatus[];

// The channels a lead can arrive through; each source rolls up into one.
export const LEAD_CHANNELS: Record<LeadChannel, { label: string; color: string }> = {
  gmb: { label: "Google Business", color: "#16a34a" },
  website: { label: "Website", color: "#c8973a" },
  social: { label: "Social", color: "#3457c9" },
  referral: { label: "Referral", color: "#db2777" },
  direct: { label: "Direct", color: "#64748b" },
};
export const LEAD_CHANNEL_KEYS = Object.keys(LEAD_CHANNELS) as LeadChannel[];

// Mirrors LEAD_SOURCE_CHANNELS in backend/models/lead.model.ts.
export const LEAD_SOURCES: Record<LeadSource, { label: string; channel: LeadChannel }> = {
  gmb_call: { label: "GMB Call", channel: "gmb" },
  gmb_message: { label: "GMB Message", channel: "gmb" },
  website_form: { label: "Website Form", channel: "website" },
  website_chat: { label: "Website Chat", channel: "website" },
  blog_cta: { label: "Blog CTA", channel: "website" },
  facebook: { label: "Facebook", channel: "social" },
  instagram: { label: "Instagram", channel: "social" },
  referral: { label: "Referral", channel: "referral" },
  walk_in: { label: "Walk-in", channel: "direct" },
  office_call: { label: "Call to the Office", channel: "direct" },
  other: { label: "Other", channel: "direct" },
};
export const LEAD_SOURCE_KEYS = Object.keys(LEAD_SOURCES) as LeadSource[];


export const isLeadStatus = (value?: string): value is LeadStatus => LEAD_STATUS_KEYS.includes(value as LeadStatus);
export const isLeadChannel = (value?: string): value is LeadChannel => LEAD_CHANNEL_KEYS.includes(value as LeadChannel);

// ── Which stretch of time the page covers ────────────────────────────────────

export const LEAD_PERIODS = {
  this_month: "This Month",
  last_month: "Last Month",
  last_90: "Last 90 Days",
  all: "All Time",
} as const;
export type LeadPeriod = keyof typeof LEAD_PERIODS;
export const isLeadPeriod = (value?: string): value is LeadPeriod => Boolean(value && value in LEAD_PERIODS);

const day = (date: Date) => date.toISOString().slice(0, 10);
const utcDate = (year: number, month: number, date: number) => new Date(Date.UTC(year, month, date));

export interface PeriodRange {
  from?: string;
  to?: string;
  // The stretch just before, of the same length, for the ▲/▼ on the stat tiles.
  previous?: { from: string; to: string };
  compareLabel?: string;
}

// Bare UTC dates; the backend reads a bare `to` as the whole of that day.
export const periodRange = (period: LeadPeriod, now = new Date()): PeriodRange => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const today = now.getUTCDate();

  if (period === "this_month") {
    // Month to date, against the same days of last month.
    const lastMonthDays = utcDate(year, month, 0).getUTCDate();
    return {
      from: day(utcDate(year, month, 1)),
      to: day(now),
      previous: { from: day(utcDate(year, month - 1, 1)), to: day(utcDate(year, month - 1, Math.min(today, lastMonthDays))) },
      compareLabel: "vs last month",
    };
  }
  if (period === "last_month") {
    return {
      from: day(utcDate(year, month - 1, 1)),
      to: day(utcDate(year, month, 0)),
      previous: { from: day(utcDate(year, month - 2, 1)), to: day(utcDate(year, month - 1, 0)) },
      compareLabel: "vs the month before",
    };
  }
  if (period === "last_90") {
    return {
      from: day(utcDate(year, month, today - 89)),
      to: day(now),
      previous: { from: day(utcDate(year, month, today - 179)), to: day(utcDate(year, month, today - 90)) },
      compareLabel: "vs previous 90 days",
    };
  }
  return {};
};

// ── Links and permissions ────────────────────────────────────────────────────

export interface LeadFilters {
  period: LeadPeriod;
  client: string;
  status: LeadStatus | "all";
  channel: LeadChannel | "all";
  // "all", or an exact case type from the list's `caseTypes`.
  caseType: string;
  q: string;
  page?: number;
}

export const DEFAULT_PERIOD: LeadPeriod = "this_month";

export const leadsHref = (filters: Partial<LeadFilters>) => {
  const params = new URLSearchParams();
  if (filters.period && filters.period !== DEFAULT_PERIOD) params.set("period", filters.period);
  if (filters.client && filters.client !== "all") params.set("client", filters.client);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.channel && filters.channel !== "all") params.set("channel", filters.channel);
  if (filters.caseType && filters.caseType !== "all") params.set("caseType", filters.caseType);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/leads?${query}` : "/leads";
};

// These only decide what the UI shows — the backend enforces the real permissions
// (backend/utils/leadAccess.ts).
export const canWriteLeads = (role?: string) =>
  ["employee", "executive", "assistant_manager", "manager", "admin", "superadmin"].includes(role ?? "");

export const canDeleteLeads = (role?: string) => ["manager", "admin", "superadmin"].includes(role ?? "");

// ── Small display helpers ────────────────────────────────────────────────────

const AVATAR_COLORS = ["#2563eb", "#c8973a", "#9333ea", "#dc2626", "#16a34a", "#2f8f6f", "#0891b2", "#db2777"];

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// The same name always gets the same avatar color.
export const avatarColorOf = (name: string) =>
  AVATAR_COLORS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

export const clientNameOf = (client: Lead["client"]) => (typeof client === "object" ? client.companyName : "");
export const personNameOf = (person: unknown) =>
  person && typeof person === "object" && "fullName" in person ? String((person as { fullName: string }).fullName) : undefined;
