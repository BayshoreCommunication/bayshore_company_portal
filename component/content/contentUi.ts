import {
  FileText,
  GalleryHorizontalEnd,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Megaphone,
  Play,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import type {
  ContentComment,
  ContentFile,
  ContentItem,
  ContentMedia,
  ContentPiece,
  ContentRevision,
  ContentStatus,
  ContentType,
} from "@/app/actions/content";
import { BADGE_COLORS, DOTS, badge } from "@/component/shared/ui";

// ── What each kind of content needs ──────────────────────────────────────────

// Everything the team can prepare for a client — the same list as the backend's
// content types (models/content.model.ts), with how each one looks and behaves here.
export type ContentKind = ContentType;

export type Media = ContentMedia;

// Fields some kinds need on top of title + upload + caption.
export type KindField = "pageName" | "pageUrl" | "subject" | "headline" | "cta";

// Any piece can carry several files — a post with a few photos, a set of short videos…
export const MAX_FILES = 10;

// The backend's per-file caps and the most files one save can carry. Checked here
// first so a too-big file is caught before it's uploaded.
export const MEDIA_MAX_BYTES: Record<Media, number> = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  doc: 20 * 1024 * 1024,
};
export const MAX_FILES_PER_SAVE = 40;

// The exact file types the backend stores (models/content.model.ts) — the file
// picker's "image/*" would otherwise let through HEIC, SVG and the like.
const UPLOADABLE_MIME_TYPES: Record<Media, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  doc: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "application/rtf",
    "text/rtf",
    "text/plain",
  ],
};

// Why a file can't be uploaded, or null when it's fine.
export const uploadProblem = (file: File): string | null => {
  const media = mediaOf(file);
  if (!UPLOADABLE_MIME_TYPES[media].includes(file.type)) return `"${file.name}" isn't a supported file type`;
  if (file.size > MEDIA_MAX_BYTES[media])
    return `"${file.name}" is over the ${MEDIA_MAX_BYTES[media] / (1024 * 1024)}MB limit for ${media}s`;
  return null;
};

export type KindSpec = {
  label: string;
  sub: string;
  icon: LucideIcon;
  color: string;
  background: string;
  // What can be uploaded, how many, and whether a pasted link can stand in for the files.
  media: Media[];
  minFiles: number;
  maxFiles: number;
  linkPlaceholder?: string;
  captionLabel: string;
  captionPlaceholder: string;
  fields: KindField[];
};

export const CONTENT_KINDS: Record<ContentKind, KindSpec> = {
  image: {
    label: "Image Post",
    sub: "Social graphics or photos — one or several",
    icon: ImageIcon,
    color: "#2563eb",
    background: "#dbeafe",
    media: ["image"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "Caption",
    captionPlaceholder: "Write the post caption...",
    fields: [],
  },
  carousel: {
    label: "Carousel",
    sub: "2–10 images people swipe through",
    icon: GalleryHorizontalEnd,
    color: "#0891b2",
    background: "#cffafe",
    media: ["image"],
    minFiles: 2,
    maxFiles: MAX_FILES,
    captionLabel: "Caption",
    captionPlaceholder: "Write the post caption...",
    fields: [],
  },
  story: {
    label: "Story",
    sub: "A 24-hour vertical story (9:16)",
    icon: Smartphone,
    color: "#db2777",
    background: "#fce7f3",
    media: ["image", "video"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "On-screen text",
    captionPlaceholder: "Any text, sticker or link to add to the story...",
    fields: [],
  },
  video: {
    label: "Video / Reel",
    sub: "One or more reels, shorts or videos",
    icon: Play,
    color: "#dc2626",
    background: "#fbdada",
    media: ["video"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste a video link (YouTube, Google Drive)",
    captionLabel: "Caption",
    captionPlaceholder: "Write the video caption...",
    fields: [],
  },
  blog: {
    label: "Blog Article",
    sub: "An SEO article for the client's blog",
    icon: FileText,
    color: "#c8973a",
    background: "#fdf1de",
    media: ["doc"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste the Google Doc link",
    captionLabel: "Summary",
    captionPlaceholder: "A line or two about what the article covers...",
    fields: [],
  },
  website: {
    label: "Website Content",
    sub: "Copy for a page — Home, Services, About…",
    icon: Globe,
    color: "#16a34a",
    background: "#dcf3e2",
    media: ["doc"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste the Google Doc link",
    captionLabel: "What changed",
    captionPlaceholder: "New page, updated sections, anything the client should check...",
    fields: ["pageName", "pageUrl"],
  },
  email: {
    label: "Email Newsletter",
    sub: "An email campaign to the client's list",
    icon: Mail,
    color: "#7c3aed",
    background: "#ede9fe",
    media: ["doc", "image"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste a Google Doc or Mailchimp preview link",
    captionLabel: "Preview text",
    captionPlaceholder: "The short line shown after the subject in the inbox...",
    fields: ["subject"],
  },
  gmb: {
    label: "Google Business Post",
    sub: "An update or offer on the Google profile",
    icon: MapPin,
    color: "#ea580c",
    background: "#ffedd5",
    media: ["image"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "Post text",
    captionPlaceholder: "What's new — an offer, event or update...",
    fields: ["cta"],
  },
  ad: {
    label: "Ad Creative",
    sub: "A paid social or Google ad",
    icon: Megaphone,
    color: "#334155",
    background: "#e2e8f0",
    media: ["image", "video"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "Ad copy",
    captionPlaceholder: "The main text of the ad...",
    fields: ["headline", "cta"],
  },
};

export const KIND_ORDER: ContentKind[] = ["image", "carousel", "story", "video", "blog", "website", "email", "gmb", "ad"];

export const CTA_OPTIONS = ["Learn more", "Call now", "Book", "Get offer", "Sign up", "Contact us"];

const ACCEPT: Record<Media, string> = {
  image: "image/*",
  video: "video/*",
  doc: ".doc,.docx,.pdf,.txt,.rtf,.odt",
};

const MEDIA_HINT: Record<Media, string> = {
  image: "PNG, JPG or WebP",
  video: "MP4 or MOV",
  doc: "Word, PDF or text",
};

const MEDIA_NOUN: Record<Media, string> = { image: "image", video: "video", doc: "document" };

export const acceptFor = (kind: ContentKind) => CONTENT_KINDS[kind].media.map((media) => ACCEPT[media]).join(",");

export const uploadHint = (kind: ContentKind) => {
  const spec = CONTENT_KINDS[kind];
  const count = spec.minFiles > 1 ? `${spec.minFiles}–${spec.maxFiles} files` : `Up to ${spec.maxFiles} files`;
  return `${spec.media.map((media) => MEDIA_HINT[media]).join(" or ")} · ${count}`;
};

// "images", "images or videos", "documents"
export const uploadNoun = (kind: ContentKind) => CONTENT_KINDS[kind].media.map((media) => `${MEDIA_NOUN[media]}s`).join(" or ");

export const mediaOf = (file: { type: string }): Media =>
  file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "doc";

// ── Statuses, batches, files and dates ───────────────────────────────────────

export const STATUS_BADGES: Record<ContentStatus, { label: string; badge: string; dot: string }> = {
  draft: { label: "Draft", badge: `${badge} ${BADGE_COLORS.draft}`, dot: DOTS.gray },
  pending_approval: { label: "Pending Approval", badge: `${badge} ${BADGE_COLORS.review}`, dot: DOTS.amber },
  revision_requested: { label: "Revision Requested", badge: `${badge} ${BADGE_COLORS.review}`, dot: DOTS.red },
  approved: { label: "Approved", badge: `${badge} ${BADGE_COLORS.approved}`, dot: DOTS.green },
};

// The pieces saved together with this one (itself included). A piece saved alone is a group of one.
export const piecesOf = (item: ContentItem): ContentPiece[] =>
  item.pieces?.length
    ? item.pieces
    : [{ _id: item._id, type: item.type, title: item.title, status: item.status, revisionCount: item.revisionCount, revisions: item.revisions }];

// One message in a group's conversation: which piece it was written on (`at`: where that
// piece sits in the group), and whether it is the one that asked for its revision — the
// first on its piece to carry that revision's number.
export type ThreadEntry = ContentComment & { piece: ContentPiece; at: number; asks: boolean };

// The conversation on a piece's page: its own messages (`comments`) and those written on the
// pieces sent with it, all in one, oldest first.
export const threadOf = (pieces: ContentPiece[], currentId: string, comments: ContentComment[]): ThreadEntry[] =>
  pieces
    .flatMap((piece, at) => {
      const own = piece._id === currentId ? comments : (piece.comments ?? []);
      return own.map((entry, index) => ({
        ...entry,
        piece,
        at,
        asks: Boolean(entry.revision) && own.findIndex((other) => other.revision === entry.revision) === index,
      }));
    })
    .sort((first, second) => (Date.parse(first.createdAt) || 0) - (Date.parse(second.createdAt) || 0));

// A piece's revisions, newest first. They come with the piece; one revised before they were
// kept is read from its comments instead (`comments`: the requests that carry a round number),
// and a round nobody left a note on is still listed, with nothing asked.
export const revisionsOf = (piece: Pick<ContentPiece, "revisions" | "revisionCount">, comments: ContentComment[] = []): ContentRevision[] => {
  if (piece.revisions?.length) return [...piece.revisions].sort((first, second) => second.number - first.number);

  const tagged = comments.filter((entry) => entry.revision);
  const rounds = Math.max(piece.revisionCount ?? 0, ...tagged.map((entry) => entry.revision ?? 0));
  return Array.from({ length: rounds }, (_, index) => rounds - index).map((number) => {
    const requests = tagged
      .filter((entry) => entry.revision === number)
      .map(({ text, attachments, name, createdAt }) => ({ text, attachments, name, createdAt }));
    return { number, requests, requestedAt: requests[0]?.createdAt ?? "", requestedByName: requests[0]?.name };
  });
};

// What to say about a piece's revisions beside its status: the round it is in while in
// revision ("Revision 2"), otherwise how many it has been through ("2 revisions"). Null when none.
export const revisionNoteOf = (piece: Pick<ContentPiece, "status" | "revisionCount">) => {
  const count = piece.revisionCount ?? 0;
  if (count === 0) return null;
  return piece.status === "revision_requested" ? `Revision ${count}` : `${count} revision${count === 1 ? "" : "s"}`;
};

// Where a group stands as a whole: whatever most needs attention among its pieces —
// a requested revision first, then anything waiting on the client, then drafts.
const GROUP_STATUS_ORDER: ContentStatus[] = ["revision_requested", "pending_approval", "draft", "approved"];
export const groupStatusOf = (pieces: ContentPiece[]): ContentStatus =>
  GROUP_STATUS_ORDER.find((status) => pieces.some((piece) => piece.status === status)) ?? "draft";

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

// A piece's files, by version. Everything it had when it was first sent is one version; files
// added in a later save are a newer one. `latest` is the newest version — what to show first
// — and `earlier` the files still in the piece from before it, newest first. A file from
// before upload times were kept counts as there from the start.
export const versionsOf = (item: ContentItem): { latest: ContentFile[]; earlier: ContentFile[] } => {
  const files = filesOf(item);
  // Not sent yet (a draft): nothing in it is a later version.
  const sentAt = item.submittedAt ? Date.parse(item.submittedAt) : Infinity;
  const versionOf = (file: ContentFile) => {
    const at = file.uploadedAt ? Date.parse(file.uploadedAt) : 0;
    return at <= sentAt ? 0 : at;
  };
  const newest = Math.max(0, ...files.map(versionOf));
  return {
    latest: files.filter((file) => versionOf(file) === newest),
    earlier: files.filter((file) => versionOf(file) < newest).sort((first, second) => versionOf(second) - versionOf(first)),
  };
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
export const BATCH_TYPE_LABELS = { monthly: "Monthly", weekly: "Weekly", event: "Event", individual: "Individual" } as const;

export const isContentStatus = (value: unknown): value is ContentStatus => CONTENT_STATUS_VALUES.includes(value as ContentStatus);
export const isContentType = (value: unknown): value is ContentKind => KIND_ORDER.includes(value as ContentKind);
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
