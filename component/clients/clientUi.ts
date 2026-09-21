import type { Client, ClientStatus } from "@/app/actions/clients";

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "on_hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
];

export const SERVICE_TYPES = ["SEO", "Social Media", "Google Ads", "Website", "Content", "Marketing"];

export const NOTES_LIMIT = 500;
export const CLIENTS_PER_PAGE = 9;

export const isClientStatus = (value: unknown): value is ClientStatus =>
  CLIENT_STATUS_OPTIONS.some((option) => option.value === value);

export const statusLabel = (status: ClientStatus) =>
  CLIENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

export const statusClassName = (status: ClientStatus) => {
  if (status === "active") return "status-pill-lg status-approved";
  if (status === "pending") return "status-pill-lg status-waiting";
  return "status-pill-lg";
};

export const statusStyle = (status: ClientStatus) => {
  if (status === "closed") return { background: "#f1f5f3", color: "#64748b" };
  if (status === "on_hold") return { background: "#e8eefc", color: "#3457c9" };
  return undefined;
};

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_COLORS = ["#2563eb", "#374151", "#b8365f", "#c8973a", "#2f8f6f", "#16a34a", "#3457c9", "#8b5cf6", "#dc2626"];

// Same client, same colour every time.
export const avatarColorFor = (seed: string) => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// Start dates are stored as UTC midnight, so format in UTC to avoid showing the day before.
export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "—";

// Today's date in the visitor's own timezone, as an <input type="date"> value (yyyy-mm-dd).
export const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "Never";

// Populated references come back as objects, unpopulated ones as plain ids.
export const staffName = (staff: Client["accountManager"]) =>
  staff && typeof staff === "object" ? staff.fullName : undefined;

export const clientsHref = ({ status, q, page }: { status?: string; q?: string; page?: number }) => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (q?.trim()) params.set("q", q.trim());
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/clients?${query}` : "/clients";
};

// These only decide what the UI shows — the backend enforces the real permissions.
export const canManageClients = (role?: string) =>
  ["assistant_manager", "manager", "admin", "superadmin"].includes(role ?? "");

export const canDeleteClients = (role?: string) => ["admin", "superadmin"].includes(role ?? "");
