"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Bell, BellOff, Check, CheckCheck, ChevronLeft, ChevronRight, Clock3, Loader2 } from "lucide-react";
import {
  markNotificationReadAction,
  markNotificationsReadAction,
  type NotificationItem,
  type NotificationListData,
} from "@/app/actions/notifications";
import { pageItems } from "@/component/shared/pageItems";
import {
  NOTIFICATION_RETENTION_DAYS,
  STAFF_NOTIFICATIONS,
  announceNotificationsChanged,
  exactTime,
  kindOf,
  notificationsHref,
  onNotificationsChanged,
  timeAgo,
  type NotificationFilter,
} from "./notificationUi";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const pageButtonClass = "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] font-medium no-underline";

// ── One notification ─────────────────────────────────────────────────────────

// The whole row opens what it is about (which also marks it read). An unread one stands
// out — tinted, bold, with a dot — and offers "Mark as read" for when opening isn't wanted.
const Row = ({ item, unread, onOpen, onMarkRead }: { item: NotificationItem; unread: boolean; onOpen: () => void; onMarkRead: () => void }) => {
  const kind = kindOf(item.type);

  return (
    <li className={`group relative flex items-start gap-3.5 rounded-xl px-3.5 py-3.5 transition-colors hover:bg-[#f3f5f8] ${unread ? "bg-[#f4f8ff]" : ""}`}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: kind.background, color: kind.color }}>
        <kind.icon size={19} strokeWidth={1.9} />
      </span>

      <div className="min-w-0 flex-1">
        {/* The link is stretched over the row, so a click anywhere on it opens the piece. */}
        <Link href={item.link} onClick={onOpen} className="text-inherit no-underline after:absolute after:inset-0 after:rounded-xl">
          <span className={`text-[13px] leading-snug text-[#0b0c24] ${unread ? "font-bold" : "font-semibold"}`}>{item.title}</span>
        </Link>
        {item.body ? <div className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-[#4b5563]">{item.body}</div> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#6b7280]">
          <span className="rounded px-1.5 py-px text-[10px] font-semibold" style={{ background: kind.background, color: kind.color }}>
            {kind.label}
          </span>
          {item.actorName ? <span>{item.actorName}</span> : null}
          <span className="text-[#c4c8ce]">•</span>
          {/* Worked out in the reader's own time zone, so the server's guess is replaced without complaint. */}
          <span title={exactTime(item.createdAt)} suppressHydrationWarning>
            {timeAgo(item.createdAt)}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-2 self-center">
        {unread ? (
          <>
            <button
              type="button"
              onClick={onMarkRead}
              className="hidden h-7.5 cursor-pointer items-center gap-1 rounded-md border border-[#d5dbe5] bg-white px-2.5 text-[11px] font-medium text-[#1f2530] group-hover:inline-flex hover:border-[#2563eb] hover:text-[#2563eb] focus-visible:inline-flex"
            >
              <Check size={12} strokeWidth={2.5} /> Mark as read
            </button>
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" aria-label="Unread" />
          </>
        ) : null}
        <ChevronRight size={16} strokeWidth={2.25} className="text-[#c4c8ce] group-hover:text-[#6b7280]" />
      </div>
    </li>
  );
};

// ── Page numbers ─────────────────────────────────────────────────────────────

const Pagination = ({ pagination, filter }: { pagination: NotificationListData["pagination"]; filter: NotificationFilter }) => {
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const href = (target: number) => notificationsHref({ filter, page: target });
  const idle = "border-[#e2e5e9] bg-white text-[#1f2530] hover:bg-[#f3f4f6]";
  const disabled = `${pageButtonClass} border-[#e2e5e9] bg-white text-[#0b0c24] opacity-35`;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f2] px-2 pt-4 text-[12px] text-[#1f2530]">
      <span>
        Showing {from}–{to} of {total} {total === 1 ? "notification" : "notifications"}
      </span>
      {/* One page of results needs no page buttons. */}
      {totalPages > 1 ? (
        <nav className="flex items-center gap-1.5" aria-label="Notifications pagination">
          {hasPreviousPage ? (
            <Link className={`${pageButtonClass} ${idle}`} href={href(page - 1)} rel="prev" aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2.25} />
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true" aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2.25} />
            </span>
          )}
          {pageItems(page, totalPages).map((item) =>
            typeof item === "string" ? (
              <span key={item} className="px-1 text-[#6b7280]" aria-hidden="true">
                …
              </span>
            ) : (
              <Link
                key={item}
                className={`${pageButtonClass} ${item === page ? "border-[#0b0c24] bg-[#0b0c24] text-white" : idle}`}
                href={href(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Link>
            ),
          )}
          {hasNextPage ? (
            <Link className={`${pageButtonClass} ${idle}`} href={href(page + 1)} rel="next" aria-label="Next page">
              <ChevronRight size={16} strokeWidth={2.25} />
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true" aria-label="Next page">
              <ChevronRight size={16} strokeWidth={2.25} />
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
};

// ── The Notifications page ───────────────────────────────────────────────────

// Everything the signed-in person has been told about, a page at a time, unread first.
// Unlike the bell — where being shown is being read — a notification here stays unread
// until it is opened or marked, so this is the place to work through a backlog.
// `data` is missing when the list couldn't be loaded; `error` says why.
const NotificationsList = ({ data, error, filter }: { data?: NotificationListData; error?: string; filter: NotificationFilter }) => {
  const router = useRouter();
  const [markingAll, setMarkingAll] = useState(false);
  // Marked read here but not yet confirmed by a fresh list from the server.
  const [justRead, setJustRead] = useState<Set<string>>(new Set());

  // Whenever notifications are read — here, or in the bell — show the list as it now stands.
  useEffect(() => onNotificationsChanged(() => router.refresh()), [router]);

  const items = data?.items ?? [];
  const isUnread = (item: NotificationItem) => !item.readAt && !justRead.has(item._id);
  const fresh = items.filter(isUnread);
  const earlier = items.filter((item) => !isUnread(item));
  // The server's count, less what has just been read on this page.
  const unread = Math.max(0, (data?.unread ?? 0) - items.filter((item) => !item.readAt && justRead.has(item._id)).length);

  const markRead = async (item: NotificationItem) => {
    if (!isUnread(item)) return;
    setJustRead((current) => new Set([...current, item._id]));
    const result = await markNotificationReadAction(item._id);
    if (!result.ok) {
      setJustRead((current) => new Set([...current].filter((id) => id !== item._id)));
      toast.error(result.error ?? "Couldn't mark it as read.");
      return;
    }
    announceNotificationsChanged();
  };

  const markAll = async () => {
    setMarkingAll(true);
    const result = await markNotificationsReadAction();
    setMarkingAll(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Couldn't mark them as read.");
      return;
    }
    toast.success(result.data.updated === 1 ? "1 notification marked as read" : `${result.data.updated} notifications marked as read`);
    announceNotificationsChanged();
  };

  const tab = (value: NotificationFilter, label: string, count?: number) => (
    <Link
      href={notificationsHref({ filter: value })}
      aria-current={filter === value ? "page" : undefined}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-[12px] font-medium no-underline ${
        filter === value ? "bg-[#0b0c24] text-white" : "text-[#4b5260] hover:bg-[#f3f4f6]"
      }`}
    >
      {label}
      {count ? (
        <span className={`rounded-full px-1.5 text-[10.5px] font-semibold ${filter === value ? "bg-white/20 text-white" : "bg-[#fde8e8] text-[#b42318]"}`}>
          {count}
        </span>
      ) : null}
    </Link>
  );

  const section = (title: string, list: NotificationItem[]) =>
    list.length ? (
      <section>
        <div className="mb-1 flex items-center gap-2 px-3.5 pt-1 text-[11px] font-semibold tracking-[0.5px] text-[#6b7280] uppercase">
          {title}
          <span className="rounded-full bg-[#f3f4f6] px-1.5 py-px text-[10.5px] text-[#4b5260]">{list.length}</span>
        </div>
        <ul className="flex list-none flex-col gap-0.5">
          {list.map((item) => (
            <Row key={item._id} item={item} unread={isUnread(item)} onOpen={() => void markRead(item)} onMarkRead={() => void markRead(item)} />
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Notifications</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            {unread > 0
              ? `You have ${unread} unread ${unread === 1 ? "notification" : "notifications"} — what your clients did on the content you prepared.`
              : "What your clients did on the content you prepared. You're all caught up."}
          </div>
        </div>
        <button
          type="button"
          onClick={markAll}
          disabled={!unread || markingAll}
          aria-busy={markingAll}
          className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-white"
        >
          {markingAll ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : <CheckCheck size={14} strokeWidth={2} />}
          Mark all as read
        </button>
      </div>

      {!data ? (
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {error ?? "Could not load notifications."} Please refresh the page to try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className={`${cardClass} p-3.5`}>
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-1 rounded-lg border border-[#e6e8eb] bg-white p-1">
                {tab("all", "All")}
                {tab("unread", "Unread", unread)}
              </div>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef1f6] text-[#6b7280]">
                  {filter === "unread" ? <CheckCheck size={24} strokeWidth={1.8} /> : <BellOff size={24} strokeWidth={1.8} />}
                </div>
                <div className="text-lg font-semibold text-[#0b0c24]">{filter === "unread" ? "You're all caught up" : "No notifications yet"}</div>
                <div className="mt-2 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                  {filter === "unread"
                    ? "Nothing is waiting to be read."
                    : "When a client approves content, asks for changes or edits a caption, it will show up here."}
                </div>
                {filter === "unread" ? (
                  <Link
                    href={notificationsHref({})}
                    className="mt-4.5 rounded-lg bg-[#0b0c24] px-4.5 py-2.25 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
                  >
                    See all notifications
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {section("New", fresh)}
                {section(fresh.length ? "Earlier" : "Read", earlier)}
              </div>
            )}

            {items.length > 0 ? <Pagination pagination={data.pagination} filter={filter} /> : null}
          </div>

          <div className={`${cardClass} p-4.5`}>
            <div className="mb-3.5 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef1f6] text-[#4b5260]">
                <Bell size={17} strokeWidth={2} />
              </span>
              <div>
                <div className="text-[12.5px] font-semibold text-[#0b0c24] uppercase">What you&apos;re told about</div>
                <div className="text-[11px] text-[#6b7280]">For the clients you work on</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {STAFF_NOTIFICATIONS.map(({ type, description }) => {
                const kind = kindOf(type);
                return (
                  <div key={type} className="flex items-start gap-2.5">
                    <span className="mt-px flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg" style={{ background: kind.background, color: kind.color }}>
                      <kind.icon size={14} strokeWidth={2} />
                    </span>
                    <div>
                      <div className="text-[12px] font-semibold text-[#0b0c24]">{kind.label}</div>
                      <div className="text-[11.5px] leading-snug text-[#6b7280]">{description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-2 border-t border-[#eef0f2] pt-3.5 text-[11px] leading-snug text-[#6b7280]">
              <Clock3 size={13} strokeWidth={2} className="mt-px shrink-0" />
              Notifications are kept for {NOTIFICATION_RETENTION_DAYS} days. The bell in the top bar shows the latest and marks them read when opened.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
