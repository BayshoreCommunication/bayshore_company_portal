import { Bell, CheckCircle2, MessageSquareText, PencilLine, RotateCcw, SendHorizontal, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/app/actions/notifications";

// What each kind of notification looks like — shared by the bell in the top bar and the
// Notifications page.
type Kind = { label: string; icon: LucideIcon; color: string; background: string };

const KINDS: Record<NotificationType, Kind> = {
  content_feedback: { label: "Changes requested", icon: MessageSquareText, color: "#dc2626", background: "#fde8e8" },
  content_approved: { label: "Approved", icon: CheckCircle2, color: "#16a34a", background: "#dcf3e2" },
  content_caption_edited: { label: "Caption edited", icon: PencilLine, color: "#2563eb", background: "#dbeafe" },
  // The client's side of the conversation — listed so an unexpected one still looks right.
  content_comment: { label: "Reply", icon: MessageSquareText, color: "#7c3aed", background: "#ede9fe" },
  content_sent: { label: "Sent for approval", icon: SendHorizontal, color: "#d97706", background: "#fdf1de" },
  content_resubmitted: { label: "Re-submitted", icon: RotateCcw, color: "#d97706", background: "#fdf1de" },
};
const UNKNOWN: Kind = { label: "Notification", icon: Bell, color: "#556977", background: "#eef3ef" };

export const kindOf = (type: NotificationType): Kind => KINDS[type] ?? UNKNOWN;

// What staff are told about, in the order shown on the Notifications page.
export const STAFF_NOTIFICATIONS: { type: NotificationType; description: string }[] = [
  { type: "content_feedback", description: "A client asked for changes to a piece of content." },
  { type: "content_approved", description: "A client approved a piece of content." },
  { type: "content_caption_edited", description: "A client rewrote a piece's caption or tags." },
];

// The backend keeps a notification this long (models/notification.model.ts), then deletes it.
export const NOTIFICATION_RETENTION_DAYS = 90;

// "just now", "5m ago", "3h ago", "2d ago" — after a week, the date.
export const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// The full date and time, for a tooltip on the short form.
export const exactTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

// ── The Notifications page's filter, kept in the URL ─────────────────────────

export const NOTIFICATIONS_PER_PAGE = 20;

export type NotificationFilter = "all" | "unread";

export const isNotificationFilter = (value: unknown): value is NotificationFilter => value === "all" || value === "unread";

export const notificationsHref = ({ filter, page }: { filter?: NotificationFilter; page?: number }) => {
  const params = new URLSearchParams();
  if (filter === "unread") params.set("filter", "unread");
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/notifications?${query}` : "/notifications";
};

// ── Keeping the bell and the page in step ────────────────────────────────────

// Reading a notification in one place should be reflected in the other at once, not at the
// bell's next check. Whoever changes something says so; whoever shows a count listens.
const CHANGED = "notifications:changed";

export const announceNotificationsChanged = () => window.dispatchEvent(new Event(CHANGED));

// Returns the function that stops listening.
export const onNotificationsChanged = (listener: () => void) => {
  window.addEventListener(CHANGED, listener);
  return () => window.removeEventListener(CHANGED, listener);
};
