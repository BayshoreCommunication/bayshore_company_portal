import type { ReportPeriodType, ReportStatus } from "@/app/actions/reports";
import { BADGE_COLORS, DOTS, badge } from "@/component/shared/ui";

export const REPORTS_PER_PAGE = 10;

export const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
];

export const STATUS_BADGES: Record<ReportStatus, { label: string; badge: string; dot: string }> = {
  draft: { label: "Draft", badge: `${badge} ${BADGE_COLORS.draft}`, dot: DOTS.gray },
  submitted: { label: "In Review", badge: `${badge} ${BADGE_COLORS.review}`, dot: DOTS.amber },
  approved: { label: "Approved", badge: `${badge} ${BADGE_COLORS.approved}`, dot: DOTS.blue },
  published: { label: "Published", badge: `${badge} ${BADGE_COLORS.completed}`, dot: DOTS.green },
};

export const isReportStatus = (value: unknown): value is ReportStatus =>
  STATUS_OPTIONS.some((option) => option.value === value);

// Dates are stored at UTC midnight, so format in UTC to avoid showing the day before.
const utc = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

export const formatDate = (iso?: string) =>
  iso ? utc(iso, { month: "short", day: "numeric", year: "numeric" }) : "—";

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "—";

export const periodLabel = (report: { periodType: ReportPeriodType; periodStart: string; periodEnd: string }) =>
  report.periodType === "monthly"
    ? utc(report.periodStart, { month: "long", year: "numeric" })
    : `${utc(report.periodStart, { month: "short", day: "numeric" })} – ${utc(report.periodEnd, { month: "short", day: "numeric", year: "numeric" })}`;

// ── Month filter ────────────────────────────────────────────────────────────

const MONTHS_BACK = 12;

// "2026-09" → "September 2026"
export const monthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
};

export const isMonthValue = (value: unknown): value is string => typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

// The current month and the eleven before it, newest first. A month picked from an
// old link is kept in the list so the select never shows a value it doesn't offer.
export const monthOptions = (selected?: string) => {
  const now = new Date();
  const values = Array.from({ length: MONTHS_BACK }, (_, back) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  if (selected && !values.includes(selected)) values.push(selected);
  return values.map((value) => ({ value, label: monthLabel(value) }));
};

// "2026-09" → the first and last day of that month, as dates.
export const monthRange = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${value}-01`, to: `${value}-${String(last).padStart(2, "0")}` };
};

export const reportsHref = ({ client, month, status, q, page }: { client?: string; month?: string; status?: string; q?: string; page?: number }) => {
  const params = new URLSearchParams();
  if (client) params.set("client", client);
  if (month) params.set("month", month);
  if (status) params.set("status", status);
  if (q?.trim()) params.set("q", q.trim());
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/monthly-reports?${query}` : "/monthly-reports";
};

// ── Who may do what (the backend enforces the real rules; this only shapes the UI) ──

export const canWriteReports = (role?: string) =>
  ["employee", "executive", "assistant_manager", "manager", "admin", "superadmin"].includes(role ?? "");

export const canReviewReports = (role?: string) => ["manager", "admin", "superadmin"].includes(role ?? "");

export const canDeleteReports = (role?: string) => ["admin", "superadmin"].includes(role ?? "");

export const clientNameOf = (client: unknown) =>
  client && typeof client === "object" && "companyName" in client ? String((client as { companyName: string }).companyName) : "";

export const clientIdOf = (client: unknown) =>
  client && typeof client === "object" && "_id" in client ? String((client as { _id: string })._id) : String(client ?? "");
