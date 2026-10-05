"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import {
  listNotificationsAction,
  markNotificationsReadAction,
  type NotificationItem,
  type NotificationListData,
} from "@/app/actions/notifications";
import { announceNotificationsChanged, kindOf, onNotificationsChanged, timeAgo } from "@/component/notifications/notificationUi";

// The bell in the top bar. Its badge is the number of unread notifications; pressing it
// opens the latest ones, and showing them is what marks them read — the ones that were
// new stay highlighted until the panel is closed, so it is clear what just came in.
// It asks for news every half minute (and whenever the tab is looked at again, or the
// Notifications page says something was read), and announces anything new with a toast.

const POLL_MS = 30_000;

// White, lightly-bordered pill shared by every topbar control.
const boxClass = "h-10 rounded-[10px] border border-[#e2e5e9] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

// The bell before its notifications have arrived from the server: the same button, not yet pressable.
export const BellPlaceholder = () => (
  <span className={`${boxClass} relative flex w-10 shrink-0 items-center justify-center text-[#17242f]`} aria-hidden="true">
    <Bell size={16} strokeWidth={2} />
  </span>
);

// `limit` is how many the panel lists (the Notifications page has the rest). `initial` is the
// first load, when the server has already done it — without it the bell fetches as it appears.
const NotificationBell = ({ limit, initial }: { limit: number; initial?: NotificationListData }) => {
  const [items, setItems] = useState<NotificationItem[]>(initial?.items ?? []);
  const [unread, setUnread] = useState(initial?.unread ?? 0);
  const [loaded, setLoaded] = useState(Boolean(initial));
  const [open, setOpen] = useState(false);
  // The ones that were unread when the panel showed them — highlighted until it closes.
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  const root = useRef<HTMLDivElement>(null);
  const isOpen = useRef(false);
  // Every notification seen so far, to tell a new arrival from an old one; null until the first load.
  const known = useRef<Set<string> | null>(initial ? new Set(initial.items.map((item) => item._id)) : null);

  // Showing them is reading them: mark the unread ones in `list` as read, here and on the server.
  // Answers whether there was anything to mark.
  const markSeen = async (list: NotificationItem[]) => {
    const ids = list.filter((item) => !item.readAt).map((item) => item._id);
    if (!ids.length) return false;

    const now = new Date().toISOString();
    setFresh((current) => new Set([...current, ...ids]));
    setItems((current) => current.map((item) => (ids.includes(item._id) ? { ...item, readAt: now } : item)));
    setUnread((current) => Math.max(0, current - ids.length));

    const result = await markNotificationsReadAction(ids);
    if (result.ok && result.data) setUnread(result.data.unread);
    // The Notifications page, if it is open, should show them as read too. (This bell hears
    // it as well and re-checks; with nothing left unread, that is where it ends.)
    announceNotificationsChanged();
    return true;
  };

  // Ask the server for the latest, announce anything new, and — if the panel is open — count it as seen.
  const load = async () => {
    const result = await listNotificationsAction({ limit });
    if (!result.ok || !result.data) return;
    const { items: latest, unread: count } = result.data;

    const arrivals = known.current ? latest.filter((item) => !item.readAt && !known.current!.has(item._id)) : [];
    known.current = new Set([...(known.current ?? []), ...latest.map((item) => item._id)]);

    setItems(latest);
    setUnread(count);
    setLoaded(true);

    if (isOpen.current) {
      await markSeen(latest);
    } else if (arrivals.length) {
      const [first] = arrivals;
      toast(arrivals.length === 1 ? first.title : `${arrivals.length} new notifications`, {
        icon: <BellRing size={16} strokeWidth={2.25} className="shrink-0 text-[#d99136]" />,
      });
    }
  };

  // Keep the latest `load` reachable from the timer and listeners below.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  // News: now (unless the server already sent it), every half minute, and when the tab is looked at again.
  useEffect(() => {
    const check = () => {
      if (!document.hidden) void loadRef.current();
    };
    if (!known.current) check();
    const timer = setInterval(check, POLL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    const stopListening = onNotificationsChanged(check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      stopListening();
    };
  }, []);

  const close = () => {
    isOpen.current = false;
    setOpen(false);
    setFresh(new Set());
  };

  const toggle = () => {
    if (open) return close();
    isOpen.current = true;
    setOpen(true);
    // What is already here counts as seen at once — which also brings in the latest. With
    // nothing new to mark, fetch the latest directly.
    void markSeen(items).then((marked) => (marked ? undefined : load()));
  };

  // A click anywhere else, or Escape, closes the panel.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className={`${boxClass} relative flex w-10 cursor-pointer items-center justify-center text-[#17242f] hover:bg-[#f9fafb] ${
          open ? "border-[#9aa3af] bg-[#f9fafb]" : ""
        }`}
      >
        <Bell size={16} strokeWidth={2} />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-white bg-[#dc2626] px-1 text-[10px] leading-none font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 z-50 mt-2 w-95 overflow-hidden rounded-xl border border-[#e2e5e9] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
        >
          <div className="flex items-center justify-between border-b border-[#eef0f2] px-4 py-3">
            <div className="text-[14px] font-bold text-[#0d1e2c]">Notifications</div>
            {fresh.size ? (
              <span className="rounded-full bg-[#fde8e8] px-2 py-0.5 text-[11px] font-bold text-[#b42318]">{fresh.size} new</span>
            ) : loaded && items.length ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7a8e9b]">
                <CheckCheck size={13} strokeWidth={2.25} /> All caught up
              </span>
            ) : null}
          </div>

          {!loaded ? (
            <div className="flex flex-col gap-3.5 px-4 py-4" aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-[#eceef1]" />
                  <div className="flex-1">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-[#eceef1]" />
                    <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-[#eceef1]" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-9 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3ef] text-[#7a8e9b]">
                <Bell size={20} strokeWidth={1.9} />
              </span>
              <div className="text-[13px] font-bold text-[#17242f]">No notifications yet</div>
              <div className="mt-1 text-[12px] leading-normal text-[#7a8e9b]">
                When a client approves content, asks for changes or edits a caption, you&apos;ll see it here.
              </div>
            </div>
          ) : (
            <ul className="max-h-105 list-none overflow-y-auto py-1">
              {items.map((item) => {
                const kind = kindOf(item.type);
                const isNew = fresh.has(item._id);
                return (
                  <li key={item._id}>
                    <Link
                      href={item.link}
                      onClick={close}
                      className={`flex items-start gap-3 px-4 py-3 text-inherit no-underline hover:bg-[#f6f8fa] ${isNew ? "bg-[#f5f9ff]" : ""}`}
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: kind.background, color: kind.color }}
                      >
                        <kind.icon size={17} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[12.5px] leading-snug text-[#17242f] ${isNew ? "font-bold" : "font-semibold"}`}>{item.title}</span>
                        {item.body ? <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-[#64748b]">{item.body}</span> : null}
                        <span className="mt-1 block text-[11px] text-[#94a3b8]">{timeAgo(item.createdAt)}</span>
                      </span>
                      {isNew ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#2563eb]" aria-label="New" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={close}
            className="block border-t border-[#eef0f2] py-3 text-center text-[12.5px] font-bold text-[#2563eb] no-underline hover:bg-[#f6f8fa]"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
