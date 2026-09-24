import type { ContentFile, ContentItem, ContentStatus } from "@/app/actions/content";
import { BADGE_COLORS, DOTS, badge } from "@/component/shared/ui";

export const STATUS_BADGES: Record<ContentStatus, { label: string; badge: string; dot: string }> = {
  draft: { label: "Draft", badge: `${badge} ${BADGE_COLORS.draft}`, dot: DOTS.gray },
  pending_approval: { label: "Pending Approval", badge: `${badge} ${BADGE_COLORS.review}`, dot: DOTS.amber },
  revision_requested: { label: "Revision Requested", badge: `${badge} ${BADGE_COLORS.review}`, dot: DOTS.red },
  approved: { label: "Approved", badge: `${badge} ${BADGE_COLORS.approved}`, dot: DOTS.green },
};

// Which batch a piece belongs to, for lists: "September 2026", "Week of Sep 21",
// the event's name, or "Individual". Older records only carry isIndividual.
export const batchLabelOf = (item: Pick<ContentItem, "batchType" | "isIndividual" | "batchMonth" | "weekStart" | "eventName">) => {
  const batchType = item.batchType ?? (item.isIndividual ? "individual" : "monthly");
  if (batchType === "weekly" && item.weekStart) {
    return `Week of ${new Date(item.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
  }
  if (batchType === "event") return item.eventName || "Event";
  if (batchType === "individual") return "Individual";
  return item.batchMonth;
};

// A piece's files. Older records kept a single file in imageUrl / videoUrl / docUrl.
export const filesOf = (item: ContentItem): ContentFile[] => {
  if (item.files?.length) return item.files;
  const legacy: ContentFile[] = [];
  if (item.imageUrl) legacy.push({ url: item.imageUrl, name: item.imageAlt || item.title, size: 0, mimeType: "", media: "image" });
  if (item.videoUrl && item.videoUrl !== item.link)
    legacy.push({ url: item.videoUrl, name: item.title, size: 0, mimeType: "", media: "video" });
  if (item.docUrl && item.docUrl !== item.link)
    legacy.push({ url: item.docUrl, name: item.docName || item.title, size: 0, mimeType: "", media: "doc" });
  return legacy;
};

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

// ── Who may do what (the backend enforces the real rules; this only shapes the UI) ──

export const canWriteContent = (role?: string) =>
  ["employee", "executive", "assistant_manager", "manager", "admin", "superadmin"].includes(role ?? "");

// Deleting content (any status) is for superadmins only — the backend's DELETE route agrees.
export const canDeleteContent = (role?: string) => role === "superadmin";

// Managers and up may also edit approved pieces (backend: CONTENT_REVIEW_ROLES).
export const canReviewContent = (role?: string) => ["manager", "admin", "superadmin"].includes(role ?? "");

export const clientNameOf =(client: unknown) =>
  client && typeof client === "object" && "companyName" in client ? String((client as { companyName: string }).companyName) : "";

export const clientIdOf = (client: unknown) =>
  client && typeof client === "object" && "_id" in client ? String((client as { _id: string })._id) : String(client ?? "");

export const personNameOf = (person: unknown) =>
  person && typeof person === "object" && "fullName" in person ? String((person as { fullName: string }).fullName) : undefined;

// ── The Content list's filters, kept in the URL ──────────────────────────────

export const CONTENT_PER_PAGE = 10;

export type ContentListFilters = {
  client: string;
  type: string;
  status: string;
  month: string;
  batchType: string;
  search: string;
};

export const CONTENT_STATUS_VALUES: ContentStatus[] = ["draft", "pending_approval", "revision_requested", "approved"];
export const CONTENT_TYPE_VALUES = ["image", "carousel", "story", "video", "blog", "website", "email", "gmb", "ad"] as const;
export const BATCH_TYPE_LABELS = { monthly: "Monthly", weekly: "Weekly", event: "Event", individual: "Individual" } as const;

export const isContentStatus = (value: unknown): value is ContentStatus => CONTENT_STATUS_VALUES.includes(value as ContentStatus);
export const isContentType = (value: unknown): value is (typeof CONTENT_TYPE_VALUES)[number] =>
  (CONTENT_TYPE_VALUES as readonly string[]).includes(value as string);
export const isBatchType = (value: unknown): value is keyof typeof BATCH_TYPE_LABELS =>
  typeof value === "string" && value in BATCH_TYPE_LABELS;

// Batch months are stored as labels — "September 2026". The last 12 months, newest
// first; a month picked from an old link is kept so the select can show it.
export const monthChoices = (selected?: string) => {
  const now = new Date();
  const values = Array.from({ length: 12 }, (_, back) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  );
  if (selected && !values.includes(selected)) values.push(selected);
  return values;
};

export const contentListHref = (filters: Partial<ContentListFilters> & { page?: number }) => {
  const params = new URLSearchParams();
  if (filters.client) params.set("client", filters.client);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.month) params.set("month", filters.month);
  if (filters.batchType) params.set("batch", filters.batchType);
  if (filters.search) params.set("q", filters.search);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/content?${query}` : "/content";
};
