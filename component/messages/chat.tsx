"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  Film,
  ImageIcon,
  Loader2,
  Mail,
  Paperclip,
  RotateCcw,
  Send,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRealtime, useRefreshing } from "@/lib/realtime";

// The conversation between a client and the BayShore team (backend: models/message.model.ts),
// as both portals show it: the messages, oldest at the top, live as they come; and the box to
// write in. Comments made elsewhere — on a piece of content, a report, the onboarding form — are
// in it too, each tagged with where it was made and a link back there.
//
// The same file is in both portals (client-portal and company-portal: component/messages/chat.tsx).

// ── What a message is ────────────────────────────────────────────────────────

export type MessageSide = "client" | "team";
export type ChatMedia = "image" | "video" | "doc";

export interface ChatFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  media: ChatMedia;
}

export interface ChatMessage {
  _id: string;
  client: string;
  kind: "text" | "revision_requested" | "revision_submitted" | "meeting";
  side: MessageSide;
  sender?: string;
  senderName?: string;
  text: string;
  attachments: ChatFile[];
  content?: string;
  contentTitle?: string;
  revision?: number;
  report?: string;
  reportTitle?: string;
  onboardingStep?: string;
  onboardingStepTitle?: string;
  meeting?: {
    title: string;
    startsAt: string;
    endsAt?: string;
    location?: string;
    link?: string;
  };
  // Sent to the client by email too.
  emailed?: boolean;
  createdAt: string;
}

export interface MessagePage {
  items: ChatMessage[];
  hasMore: boolean;
  readAt: string | null;
  unread: number;
  // For the team: whether the client's message emails are on, and the logins an email reaches.
  email?: { on: boolean; to: string[] };
}

// Where the page a message is about lives, in this portal.
export interface ChatLinks {
  content: (id: string) => string;
  report: (id: string) => string;
  onboarding: (message: ChatMessage) => string;
}

// ── Times ────────────────────────────────────────────────────────────────────

// Times are shown in the visitor's own time zone, so only once the page is in the browser.
const subscribeNever = () => () => {};
export const useInBrowser = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
const dayKey = (iso: string) => new Date(iso).toDateString();
const dayLabel = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
};

// "Just now", "5 min", "3:40 PM", "Yesterday", "Mar 4" — for a conversation list.
export const shortWhen = (iso: string) => {
  const date = new Date(iso);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;
  if (date.toDateString() === new Date().toDateString()) return clock(iso);
  if (date.toDateString() === new Date(Date.now() - 86_400_000).toDateString())
    return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// One line about a message, for a conversation list or a notification.
export const previewOf = (message: ChatMessage) => {
  if (message.kind === "meeting" && message.meeting)
    return `Meeting: ${message.meeting.title}`;
  if (message.kind === "revision_requested")
    return `Asked for changes${message.contentTitle ? ` on ${message.contentTitle}` : ""}`;
  if (message.kind === "revision_submitted")
    return `Sent back a revision${message.contentTitle ? ` of ${message.contentTitle}` : ""}`;
  if (message.text.trim()) return message.text.trim().replace(/\s+/g, " ");
  const count = message.attachments.length;
  return count ? `${count} ${count === 1 ? "file" : "files"}` : "Message";
};

// ── Files ────────────────────────────────────────────────────────────────────

// The backend's rules for attached files (models/content.model.ts: MEDIA_MAX_FILE_SIZE).
const MAX_FILES = 5;
export const MESSAGE_MAX_LENGTH = 2000;
const MAX_BYTES: Record<ChatMedia, number> = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  doc: 20 * 1024 * 1024,
};
const TYPES: Record<ChatMedia, string[]> = {
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
const ACCEPT = "image/*,video/*,.pdf,.doc,.docx,.txt,.rtf,.odt";
// How tall the message field grows by itself before it scrolls (it can be dragged taller).
const MAX_FIELD_HEIGHT = 220;
const mediaOf = (file: { type: string }): ChatMedia =>
  file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : "doc";
const problemOf = (file: File) => {
  const media = mediaOf(file);
  if (!TYPES[media].includes(file.type))
    return `"${file.name}" isn't a supported file type`;
  if (file.size > MAX_BYTES[media])
    return `"${file.name}" is over the ${MAX_BYTES[media] / (1024 * 1024)}MB limit`;
  return null;
};
const sizeOf = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const FileOut = ({ file, mine }: { file: ChatFile; mine: boolean }) => {
  if (file.media === "image") {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.url}
          alt={file.name}
          className="block max-h-56 w-auto max-w-full object-cover"
        />
      </a>
    );
  }
  if (file.media === "video")
    return (
      <video
        src={file.url}
        controls
        preload="metadata"
        className="block max-h-60 w-full max-w-80 rounded-xl bg-black"
      />
    );
  return (
    <a
      href={file.url}
      download={file.name}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex max-w-72 items-center gap-2.5 rounded-xl px-3 py-2 no-underline ${mine ? "bg-white/10 text-white hover:bg-white/15" : "bg-[#f3f4f6] text-[#1f2530] hover:bg-[#eceef1]"}`}
    >
      <FileText size={16} strokeWidth={2} className="shrink-0 opacity-80" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium">
          {file.name}
        </span>
        {file.size ? (
          <span className="block text-[10.5px] opacity-70">
            {sizeOf(file.size)}
          </span>
        ) : null}
      </span>
      <Download size={14} strokeWidth={2} className="shrink-0 opacity-70" />
    </a>
  );
};

// ── One message ──────────────────────────────────────────────────────────────

// Where it was written, when not here: a tag above the words, linking back there.
const tagOf = (
  message: ChatMessage,
  links: ChatLinks,
): {
  icon: LucideIcon;
  label: string;
  href?: string;
  color: string;
  background: string;
} | null => {
  if (message.report)
    return {
      icon: BarChart3,
      label: `Report · ${message.reportTitle ?? "Report"}`,
      href: links.report(message.report),
      color: "#6d28d9",
      background: "#ede9fe",
    };
  if (message.onboardingStepTitle)
    return {
      icon: ClipboardList,
      label: `Onboarding · ${message.onboardingStepTitle}`,
      href: links.onboarding(message),
      color: "#0e7490",
      background: "#cffafe",
    };
  if (message.kind === "revision_requested")
    return {
      icon: RotateCcw,
      label: `Asked for changes${message.revision ? ` · Revision ${message.revision}` : ""}${message.contentTitle ? ` · ${message.contentTitle}` : ""}`,
      href: message.content ? links.content(message.content) : undefined,
      color: "#b45309",
      background: "#fef3c7",
    };
  if (message.kind === "revision_submitted")
    return {
      icon: RotateCcw,
      label: `Revision ${message.revision ?? ""} sent back${message.contentTitle ? ` · ${message.contentTitle}` : ""}`,
      href: message.content ? links.content(message.content) : undefined,
      color: "#15803d",
      background: "#dcfce7",
    };
  if (message.content)
    return {
      icon: ImageIcon,
      label: `Content · ${message.contentTitle ?? "A piece"}`,
      href: links.content(message.content),
      color: "#1d4ed8",
      background: "#dbeafe",
    };
  return null;
};

const Tag = ({ tag }: { tag: NonNullable<ReturnType<typeof tagOf>> }) => {
  const Icon = tag.icon;
  const body = (
    <>
      <Icon size={11.5} strokeWidth={2.25} className="shrink-0" />
      <span className="truncate">{tag.label}</span>
    </>
  );
  const className =
    "inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold no-underline";
  return tag.href ? (
    <Link
      href={tag.href}
      className={`${className} hover:underline`}
      style={{ color: tag.color, background: tag.background }}
    >
      {body}
    </Link>
  ) : (
    <span
      className={className}
      style={{ color: tag.color, background: tag.background }}
    >
      {body}
    </span>
  );
};

const MeetingCard = ({
  meeting,
}: {
  meeting: NonNullable<ChatMessage["meeting"]>;
}) => {
  const start = new Date(meeting.startsAt);
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e6e8eb] bg-white p-3 text-[#1f2530]">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fef9c3] text-[#854d0e]">
        <CalendarDays size={17} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold">{meeting.title}</span>
        <span className="block text-[12px] text-[#6b7280]">
          {start.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          · {clock(meeting.startsAt)}
          {meeting.endsAt ? ` – ${clock(meeting.endsAt)}` : ""}
          {meeting.location ? ` · ${meeting.location}` : ""}
        </span>
        {meeting.link ? (
          <a
            href={meeting.link}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-3 py-1.5 text-[12px] font-semibold text-white no-underline hover:bg-[#15803d]"
          >
            <Video size={13} strokeWidth={2.25} /> Join
          </a>
        ) : null}
      </span>
    </div>
  );
};

const Bubble = ({
  message,
  mine,
  first,
  links,
}: {
  message: ChatMessage;
  mine: boolean;
  first: boolean;
  links: ChatLinks;
}) => {
  const tag = tagOf(message, links);
  const text = message.text.trim();
  return (
    <div
      className={`flex flex-col ${mine ? "items-end" : "items-start"} ${first ? "mt-3" : "mt-1"}`}
    >
      {first ? (
        <div
          className={`mb-1 flex items-baseline gap-2 px-1 text-[11px] ${mine ? "flex-row-reverse" : ""}`}
        >
          <span className="font-semibold text-[#374151]">
            {mine
              ? "You"
              : (message.senderName ??
                (message.side === "team" ? "BayShore" : "Client"))}
          </span>
          <span className="text-[#9ca3af]">{clock(message.createdAt)}</span>
        </div>
      ) : null}
      <div
        className={`flex max-w-[min(560px,85%)] flex-col gap-1.5 ${mine ? "items-end" : "items-start"}`}
      >
        {tag ? <Tag tag={tag} /> : null}
        {message.kind === "meeting" && message.meeting ? (
          <MeetingCard meeting={message.meeting} />
        ) : null}
        {text ? (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap wrap-anywhere ${
              mine
                ? "rounded-br-md bg-[#0b1522] text-white"
                : "rounded-bl-md border border-[#e6e8eb] bg-white text-[#1f2530]"
            }`}
            title={first ? undefined : clock(message.createdAt)}
          >
            {text}
          </div>
        ) : null}
        {message.attachments.length ? (
          <div
            className={`flex flex-col gap-1.5 ${mine ? "items-end" : "items-start"}`}
          >
            {message.attachments.map((file) => (
              <FileOut key={file.url} file={file} mine={mine} />
            ))}
          </div>
        ) : null}
        {mine && message.emailed ? (
          <span className="inline-flex items-center gap-1 px-1 text-[10.5px] font-medium text-[#6b7280]">
            <Mail size={11} strokeWidth={2.25} /> Also sent by email
          </span>
        ) : null}
      </div>
    </div>
  );
};

// The messages, by day; a new run starts when the writer changes or some minutes pass.
export const MessageList = ({
  items,
  mySide,
  links,
}: {
  items: ChatMessage[];
  mySide: MessageSide;
  links: ChatLinks;
}) => (
  <div>
    {items.map((message, index) => {
      const before = items[index - 1];
      const newDay =
        !before || dayKey(before.createdAt) !== dayKey(message.createdAt);
      const first =
        newDay ||
        before.sender !== message.sender ||
        before.side !== message.side ||
        new Date(message.createdAt).getTime() -
          new Date(before.createdAt).getTime() >
          5 * 60_000;
      return (
        <Fragment key={message._id}>
          {newDay ? (
            <div className="my-4 flex items-center gap-3 text-[11px] font-semibold text-[#9ca3af]">
              <span className="h-px flex-1 bg-[#eceef1]" />
              {dayLabel(message.createdAt)}
              <span className="h-px flex-1 bg-[#eceef1]" />
            </div>
          ) : null}
          <Bubble
            message={message}
            mine={message.side === mySide}
            first={first}
            links={links}
          />
        </Fragment>
      );
    })}
  </div>
);

// ── Loading and sending ──────────────────────────────────────────────────────

// Posts a message (words, files, what it is about) to this portal's upload route, reporting
// how far the files have gone up. XMLHttpRequest, because fetch can't report upload progress.
const post = (
  url: string,
  form: FormData,
  onProgress: (percent: number) => void,
) =>
  new Promise<{
    status: number;
    body: { success?: boolean; message?: string; data?: ChatMessage };
  }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve({
        status: request.status,
        body: request.response ?? {
          message: "The server sent an unexpected response.",
        },
      });
    request.onerror = () => reject(new Error("Network error"));
    request.send(form);
  });

const merge = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const byId = new Map(current.map((message) => [message._id, message]));
  for (const message of incoming) byId.set(message._id, message);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

// One conversation (or the part of it about one report): what has been loaded, older pages on
// request, new ones live, and sending.
export const useThread = ({
  initial,
  load,
  matches,
  postUrl,
  extra,
  onIncoming,
}: {
  initial: MessagePage | null;
  // A page of it: the newest, or the one before `before`.
  load: (before?: string) => Promise<MessagePage | null>;
  // Whether a live message belongs here.
  matches: (message: ChatMessage) => boolean;
  postUrl: string;
  // Sent with every message: what it is about ({ report: id }).
  extra?: Record<string, string>;
  // The other side wrote while this was open.
  onIncoming?: (message: ChatMessage) => void;
}) => {
  const [items, setItems] = useState<ChatMessage[]>(initial?.items ?? []);
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? false);
  const [loaded, setLoaded] = useState(Boolean(initial));
  const [olderLoading, setOlderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(initial?.email);
  // The latest of what the caller passed, so a new function each render changes nothing.
  const latest = useRef({ load, matches, onIncoming });
  useEffect(() => {
    latest.current = { load, matches, onIncoming };
  });
  const known = useRef(new Set(items.map((message) => message._id)));
  const firstLoad = useRef(!initial);

  const take = useCallback((incoming: ChatMessage[]) => {
    for (const message of incoming) known.current.add(message._id);
    setItems((current) => merge(current, incoming));
  }, []);

  const refresh = useCallback(async () => {
    const page = await latest.current.load();
    if (!page) {
      setError(
        (shown) =>
          shown ?? "Couldn't load the messages. Please refresh the page.",
      );
      return;
    }
    setError(null);
    take(page.items);
    setEmail(page.email);
    if (firstLoad.current) {
      firstLoad.current = false;
      setHasMore(page.hasMore);
    }
    setLoaded(true);
  }, [take]);

  useEffect(() => {
    if (!initial) void refresh();
  }, [initial, refresh]);
  useRefreshing(() => void refresh());

  useRealtime<ChatMessage>("messages:new", (message) => {
    if (!latest.current.matches(message) || known.current.has(message._id))
      return;
    take([message]);
    latest.current.onIncoming?.(message);
  });

  const older = async () => {
    if (!items[0] || olderLoading) return;
    setOlderLoading(true);
    const page = await latest.current.load(items[0].createdAt);
    setOlderLoading(false);
    if (!page) return setError("Couldn't load earlier messages.");
    take(page.items);
    setHasMore(page.hasMore);
  };

  const send = async (
    text: string,
    files: File[],
    onProgress: (percent: number) => void,
  ) => {
    const form = new FormData();
    form.append("text", text);
    for (const [key, value] of Object.entries(extra ?? {}))
      form.append(key, value);
    for (const file of files) form.append("files", file);
    try {
      const { status, body } = await post(postUrl, form, onProgress);
      if (status >= 300 || !body.data)
        return body.message ?? "Couldn't send your message. Please try again.";
      take([body.data]);
      return null;
    } catch {
      return "Couldn't reach the server. Please check your connection and try again.";
    }
  };

  return { items, hasMore, loaded, olderLoading, error, email, older, send };
};

// ── Writing ──────────────────────────────────────────────────────────────────

type Picked = { id: string; file: File; media: ChatMedia; url: string };
const MEDIA_ICON: Record<ChatMedia, LucideIcon> = {
  image: ImageIcon,
  video: Film,
  doc: FileText,
};

// Somewhere to write, the way a chat does: Enter sends, Shift+Enter starts a new line, files can
// be attached or pasted in.
export const Composer = ({
  onSend,
  placeholder = "Write a message…",
  disabled,
  autoFocus,
  top,
  quickReplies,
}: {
  // Returns why it couldn't be sent, or null once it was.
  onSend: (
    text: string,
    files: File[],
    onProgress: (percent: number) => void,
  ) => Promise<string | null>;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  // Above the field: options for what is sent (the team's "by email too").
  top?: ReactNode;
  // Ready-made lines a click puts in the field, while it is empty.
  quickReplies?: string[];
}) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  // Dragged taller by hand: kept at least that tall.
  const dragged = useRef(0);

  // The field grows with what is in it (typed, pasted or a quick reply), up to a point — then it
  // scrolls — and shrinks back when it is emptied.
  useLayoutEffect(() => {
    const field = box.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.max(Math.min(field.scrollHeight, MAX_FIELD_HEIGHT), dragged.current)}px`;
  }, [text]);
  const sending = progress !== null;
  const canSend =
    (text.trim() !== "" || files.length > 0) && !sending && !disabled;

  const add = (picked: File[]) => {
    const problems = picked.map(problemOf).filter(Boolean);
    const room = MAX_FILES - files.length;
    const allowed = picked.filter((file) => !problemOf(file));
    const kept = allowed
      .slice(0, Math.max(0, room))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        media: mediaOf(file),
        url: URL.createObjectURL(file),
      }));
    setError(
      problems.length
        ? `${problems.join("; ")}.`
        : allowed.length > room
          ? `Up to ${MAX_FILES} files per message.`
          : null,
    );
    if (kept.length) setFiles((current) => [...current, ...kept]);
  };
  const remove = (id: string) =>
    setFiles((current) => {
      const gone = current.find((each) => each.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return current.filter((each) => each.id !== id);
    });

  const send = async () => {
    if (!canSend) return;
    setError(null);
    setProgress(0);
    const problem = await onSend(
      text.trim(),
      files.map((each) => each.file),
      setProgress,
    );
    setProgress(null);
    if (problem) return setError(problem);
    files.forEach((each) => URL.revokeObjectURL(each.url));
    setFiles([]);
    setText("");
    dragged.current = 0;
    box.current?.focus();
  };

  return (
    <div>
      {top}
      {quickReplies?.length && !text && !sending ? (
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => {
                setText(reply);
                box.current?.focus();
              }}
              className="shrink-0 cursor-pointer rounded-full border border-[#e2e5e9] bg-white px-3 py-1 text-[11.5px] font-medium whitespace-nowrap text-[#4b5563] hover:border-[#2f5fd8] hover:text-[#2f5fd8]"
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}
      {files.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((each) => {
            const Icon = MEDIA_ICON[each.media];
            return (
              <span
                key={each.id}
                className="inline-flex max-w-56 items-center gap-2 rounded-lg border border-[#e2e5e9] bg-white py-1 pr-1 pl-1.5 text-[12px]"
              >
                {each.media === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={each.url}
                    alt=""
                    className="size-7 rounded object-cover"
                  />
                ) : (
                  <Icon
                    size={15}
                    strokeWidth={2}
                    className="ml-0.5 shrink-0 text-[#6b7280]"
                  />
                )}
                <span className="truncate">{each.file.name}</span>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => remove(each.id)}
                  aria-label={`Remove ${each.file.name}`}
                  className="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-[#6b7280] hover:bg-[#f3f4f6]"
                >
                  <X size={13} strokeWidth={2.25} />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 items-end rounded-2xl border border-[#e2e5e9] bg-[#f5f6f8] focus-within:border-[#9aa3af] focus-within:bg-white">
          <label
            title="Attach files"
            className={`mb-1.5 ml-1.5 grid size-8 shrink-0 place-items-center rounded-lg ${files.length >= MAX_FILES || sending || disabled ? "cursor-not-allowed text-[#c4cad2]" : "cursor-pointer text-[#6b7280] hover:bg-[#e6e8eb] hover:text-[#1f2530]"}`}
          >
            <Paperclip size={16} strokeWidth={2} />
            <input
              type="file"
              multiple
              accept={ACCEPT}
              disabled={files.length >= MAX_FILES || sending || disabled}
              className="hidden"
              onChange={(event) => {
                add(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>
          <textarea
            ref={box}
            rows={1}
            autoFocus={autoFocus}
            maxLength={MESSAGE_MAX_LENGTH}
            value={text}
            readOnly={sending}
            disabled={disabled}
            aria-label="Message"
            placeholder={placeholder}
            onChange={(event) => {
              setText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void send();
              }
            }}
            onMouseUp={(event) => {
              // After a drag of the corner: remember the height it was given.
              const height = event.currentTarget.offsetHeight;
              if (Math.abs(height - parseFloat(event.currentTarget.style.height || "0")) > 2) dragged.current = height;
            }}
            onPaste={(event) => {
              const pasted = Array.from(event.clipboardData.files);
              if (pasted.length) {
                event.preventDefault();
                add(pasted);
              }
            }}
            className="block max-h-[60vh] min-h-11 min-w-0 flex-1 resize-y overflow-y-auto border-none bg-transparent py-3 pr-3.5 pl-2 text-[13px] leading-normal break-words whitespace-pre-wrap text-[#1f2530] outline-none wrap-anywhere placeholder:text-[#9ca3af]"
          />
        </div>
        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          aria-label="Send"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-2xl bg-[#16a34a] text-white transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <Loader2 size={17} strokeWidth={2.25} className="animate-spin" />
          ) : (
            <Send size={17} strokeWidth={2} />
          )}
        </button>
      </div>
      {sending && files.length && (progress ?? 0) < 100 ? (
        <p className="mt-1.5 px-1 text-[11px] text-[#6b7280]">
          Uploading {progress}%…
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-1.5 px-1 text-[11.5px] font-medium text-[#b91c1c]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
};

// ── A whole conversation, in a box of its own ────────────────────────────────

// The messages scroll inside it — kept at the bottom as new ones come, unless the reader has
// scrolled up to read earlier ones — with the box to write in under them.
export const ChatPane = ({
  thread,
  mySide,
  links,
  header,
  empty,
  placeholder,
  composerTop,
  quickReplies,
  aside,
}: {
  thread: ReturnType<typeof useThread>;
  mySide: MessageSide;
  links: ChatLinks;
  header?: ReactNode;
  empty: ReactNode;
  placeholder?: string;
  composerTop?: ReactNode;
  quickReplies?: string[];
  // Beside the messages, on wide screens: about the conversation.
  aside?: ReactNode;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const keepFrom = useRef<number | null>(null);
  const inBrowser = useInBrowser();
  const { items } = thread;
  const lastId = items.at(-1)?._id;

  // New at the bottom: follow it, when the reader was there (or wrote it).
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    if (keepFrom.current !== null) {
      // Earlier ones were added above: stay where the reader was.
      element.scrollTop = element.scrollHeight - keepFrom.current;
      keepFrom.current = null;
      return;
    }
    const last = items.at(-1);
    if (atBottom.current || last?.side === mySide)
      element.scrollTop = element.scrollHeight;
  }, [items, lastId, mySide, inBrowser]);

  const older = () => {
    if (scroller.current)
      keepFrom.current =
        scroller.current.scrollHeight - scroller.current.scrollTop;
    void thread.older();
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {header}
        <div
          ref={scroller}
          onScroll={(event) => {
            const element = event.currentTarget;
            atBottom.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              80;
          }}
          className="min-h-0 flex-1 overflow-y-auto bg-[#f8f9fb] px-4 pb-4 sm:px-6"
        >
          {!inBrowser || !thread.loaded ? (
            <div className="flex flex-col gap-3 py-6">
              {[60, 40, 72, 50].map((width, index) => (
                <div
                  key={index}
                  className={`flex ${index % 2 ? "justify-end" : ""}`}
                >
                  <div
                    className="h-11 animate-pulse rounded-2xl bg-[#eceef1]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              ))}
            </div>
          ) : items.length ? (
            <>
              {thread.hasMore ? (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={older}
                    disabled={thread.olderLoading}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#e2e5e9] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#4b5563] hover:bg-[#f3f4f6]"
                  >
                    {thread.olderLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : null}{" "}
                    Load earlier messages
                  </button>
                </div>
              ) : null}
              <MessageList items={items} mySide={mySide} links={links} />
            </>
          ) : (
            <div className="grid h-full place-items-center py-10 text-center">
              {empty}
            </div>
          )}
          {thread.error ? (
            <p
              role="alert"
              className="mt-3 text-center text-[12px] font-medium text-[#b91c1c]"
            >
              {thread.error}
            </p>
          ) : null}
        </div>
        <div className="border-t border-[#eceef1] bg-white px-4 py-3 sm:px-6">
          <Composer
            onSend={thread.send}
            placeholder={placeholder}
            top={composerTop}
            quickReplies={quickReplies}
          />
        </div>
      </div>
      {aside}
    </div>
  );
};

// Tells this tab's unread badge that a conversation was just read.
export const MESSAGES_READ_EVENT = "bayshore:messages-read";
export const announceRead = () =>
  window.dispatchEvent(new Event(MESSAGES_READ_EVENT));

// How many messages from the other side are unread — for a badge. Counted again when one comes
// in live, when a conversation is read in this tab, and every minute.
export const useUnreadMessages = (
  count: () => Promise<number>,
  mySide: MessageSide,
) => {
  const [unread, setUnread] = useState(0);
  const latest = useRef(count);
  useEffect(() => {
    latest.current = count;
  });
  const refresh = useCallback(() => void latest.current().then(setUnread), []);
  useEffect(() => {
    refresh();
    window.addEventListener(MESSAGES_READ_EVENT, refresh);
    return () => window.removeEventListener(MESSAGES_READ_EVENT, refresh);
  }, [refresh]);
  useRefreshing(refresh, 60_000);
  useRealtime<ChatMessage>("messages:new", (message) => {
    if (message.side !== mySide) refresh();
  });
  return unread;
};
