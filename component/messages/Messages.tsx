"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  ClipboardList,
  FileText,
  ImageIcon,
  Inbox,
  Layers,
  Mail,
  MailX,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { getClientAction, type Client } from "@/app/actions/clients";
import {
  listClientMessagesAction,
  listConversationsAction,
  markClientMessagesReadAction,
  type Conversation,
} from "@/app/actions/messages";
import {
  CLIENT_STATUS_OPTIONS,
  statusClassName,
} from "@/component/clients/clientUi";
import { useRealtime, useRefreshing } from "@/lib/realtime";
import {
  ChatPane,
  announceRead,
  previewOf,
  shortWhen,
  useInBrowser,
  useThread,
  type ChatLinks,
  type ChatMessage,
  type MessagePage,
} from "./chat";

// The team's inbox: every client they can see on the left — whoever wrote last at the top, with
// what is unread — the conversation picked in the middle, and beside it what there is to know
// about that client: who they are, what was talked about, the files shared. Each message from the
// team goes to the client's portal, and by email too when the team leaves "Also send by email" on.
// Comments on content, reports and the onboarding form are in the conversation as well, tagged
// with where they were made.

export const TEAM_LINKS: ChatLinks = {
  content: (id) => `/content/${id}`,
  report: (id) => `/monthly-reports/${id}/edit`,
  onboarding: (message) => `/clients/${message.client}/onboarding`,
};

// A click puts one in the box, ready to send or change.
const QUICK_REPLIES = [
  "Thanks! We'll take a look and get back to you.",
  "Could you share a few more details?",
  "All done — please have a look.",
  "Let's jump on a quick call to go over this.",
];

type ClientOption = { _id: string; companyName: string; contactName?: string };

const COLORS = [
  "#2f5fd8",
  "#7c3aed",
  "#0891b2",
  "#d97706",
  "#16a34a",
  "#db2777",
  "#4f46e5",
];
const colorOf = (id: string) =>
  COLORS[
    [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % COLORS.length
  ];
const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "C";

const Avatar = ({
  id,
  name,
  size = 40,
}: {
  id: string;
  name?: string;
  size?: number;
}) => (
  <span
    className="grid shrink-0 place-items-center rounded-full font-bold text-white"
    style={{
      background: colorOf(id),
      width: size,
      height: size,
      fontSize: Math.round(size * 0.34),
    }}
  >
    {initialsOf(name)}
  </span>
);

const markRead = (clientId: string) =>
  void markClientMessagesReadAction(clientId).then((ok) => {
    if (ok) announceRead();
  });

// ── Beside the conversation ──────────────────────────────────────────────────

const AsideBlock = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="border-b border-[#eceef1] px-5 py-4 last:border-b-0">
    <div className="mb-2.5 text-[10.5px] font-semibold tracking-wide text-[#9ca3af] uppercase">
      {title}
    </div>
    {children}
  </div>
);

const QuickLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) => (
  <Link
    href={href}
    className="flex flex-col items-center gap-1.5 rounded-xl border border-[#eceef1] bg-white px-2 py-2.5 text-[11.5px] font-medium text-[#374151] no-underline hover:border-[#2f5fd8] hover:text-[#2f5fd8]"
  >
    <Icon size={16} strokeWidth={2} />
    {label}
  </Link>
);

const Details = ({
  client,
  details,
  items,
}: {
  client: ClientOption;
  details: Client | null;
  items: ChatMessage[];
}) => {
  // What was talked about: the reports, pieces and onboarding steps the messages were on.
  const topics = useMemo(() => {
    const seen = new Map<
      string,
      { icon: LucideIcon; label: string; href: string }
    >();
    for (const message of [...items].reverse()) {
      if (message.report)
        seen.set(`r${message.report}`, {
          icon: BarChart3,
          label: message.reportTitle ?? "Report",
          href: TEAM_LINKS.report(message.report),
        });
      else if (message.content)
        seen.set(`c${message.content}`, {
          icon: ImageIcon,
          label: message.contentTitle ?? "Content",
          href: TEAM_LINKS.content(message.content),
        });
      else if (message.onboardingStepTitle)
        seen.set(`o${message.onboardingStep}`, {
          icon: ClipboardList,
          label: `Onboarding · ${message.onboardingStepTitle}`,
          href: TEAM_LINKS.onboarding(message),
        });
    }
    return [...seen.values()].slice(0, 6);
  }, [items]);
  const files = useMemo(
    () => items.flatMap((message) => message.attachments).reverse(),
    [items],
  );
  const images = files.filter((file) => file.media === "image").slice(0, 9);
  const others = files.filter((file) => file.media !== "image").slice(0, 5);
  const status = details
    ? CLIENT_STATUS_OPTIONS.find((option) => option.value === details.status)
    : undefined;

  return (
    <aside className="hidden w-76 shrink-0 overflow-y-auto border-l border-[#eceef1] bg-[#fcfcfd] xl:block">
      <div className="flex flex-col items-center px-5 pt-6 pb-5 text-center">
        <Avatar id={client._id} name={client.companyName} size={64} />
        <div className="mt-3 text-[15px] font-semibold text-[#0b0c24]">
          {client.companyName}
        </div>
        {client.contactName ? (
          <div className="text-[12.5px] text-[#6b7280]">
            {client.contactName}
          </div>
        ) : null}
        {details && status ? (
          <span className={`mt-2 ${statusClassName(details.status)}`}>
            {status.label}
          </span>
        ) : null}
      </div>

      {details ? (
        <AsideBlock title="Contact">
          <div className="flex flex-col gap-2 text-[12.5px] text-[#374151]">
            <a
              href={`mailto:${details.email}`}
              className="flex items-center gap-2 truncate text-inherit no-underline hover:text-[#2f5fd8]"
            >
              <Mail size={14} className="shrink-0 text-[#9ca3af]" />{" "}
              <span className="truncate">{details.email}</span>
            </a>
            {details.phone ? (
              <a
                href={`tel:${details.phone}`}
                className="flex items-center gap-2 text-inherit no-underline hover:text-[#2f5fd8]"
              >
                <Phone size={14} className="shrink-0 text-[#9ca3af]" />{" "}
                {details.phone}
              </a>
            ) : null}
          </div>
        </AsideBlock>
      ) : null}

      <AsideBlock title="Open">
        <div className="grid grid-cols-3 gap-2">
          <QuickLink
            href={`/clients/${client._id}`}
            icon={UserRound}
            label="Profile"
          />
          <QuickLink
            href={`/clients/${client._id}/onboarding`}
            icon={ClipboardList}
            label="Onboarding"
          />
          <QuickLink
            href={`/monthly-reports?client=${client._id}`}
            icon={FileText}
            label="Reports"
          />
          <QuickLink
            href={`/content?client=${client._id}`}
            icon={Layers}
            label="Content"
          />
          <QuickLink
            href={`/projects?client=${client._id}`}
            icon={Briefcase}
            label="Projects"
          />
          <QuickLink
            href={`/services?client=${client._id}`}
            icon={BarChart3}
            label="Services"
          />
        </div>
      </AsideBlock>

      {topics.length ? (
        <AsideBlock title="Talked about">
          <div className="flex flex-col gap-1">
            {topics.map((topic) => (
              <Link
                key={topic.href}
                href={topic.href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-[#374151] no-underline hover:bg-[#f3f4f6]"
              >
                <topic.icon size={14} className="shrink-0 text-[#9ca3af]" />
                <span className="truncate">{topic.label}</span>
              </Link>
            ))}
          </div>
        </AsideBlock>
      ) : null}

      {files.length ? (
        <AsideBlock title={`Shared files · ${files.length}`}>
          {images.length ? (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((file) => (
                <a
                  key={file.url}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg bg-[#f3f4f6]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.name}
                    className="size-full object-cover"
                  />
                </a>
              ))}
            </div>
          ) : null}
          {others.length ? (
            <div
              className={`flex flex-col gap-1 ${images.length ? "mt-2.5" : ""}`}
            >
              {others.map((file) => (
                <a
                  key={file.url}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-[#374151] no-underline hover:bg-[#f3f4f6]"
                >
                  <FileText size={14} className="shrink-0 text-[#9ca3af]" />
                  <span className="truncate">{file.name}</span>
                </a>
              ))}
            </div>
          ) : null}
        </AsideBlock>
      ) : null}
    </aside>
  );
};

// ── One conversation ─────────────────────────────────────────────────────────

const Thread = ({
  client,
  initial,
  onBack,
}: {
  client: ClientOption;
  initial: MessagePage | null;
  onBack: () => void;
}) => {
  const [byEmail, setByEmail] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [details, setDetails] = useState<Client | null>(null);
  const load = useCallback(
    (before?: string) => listClientMessagesAction(client._id, { before }),
    [client._id],
  );

  const thread = useThread({
    initial,
    load,
    matches: (message) => message.client === client._id,
    postUrl: `/api/messages/${client._id}`,
    // The backend sends no email anyway when the client's are off or there is no login to send to.
    extra: { email: String(byEmail) },
    onIncoming: (message) => {
      if (message.side === "client" && document.visibilityState === "visible")
        markRead(client._id);
    },
  });
  useEffect(() => markRead(client._id), [client._id]);
  useEffect(() => {
    let live = true;
    void getClientAction(client._id).then((result) => {
      if (live && result.ok && result.data) setDetails(result.data);
    });
    return () => {
      live = false;
    };
  }, [client._id]);

  // Who an email would reach, or why it can't go.
  const email = thread.email;
  const canEmail = Boolean(email?.on && email.to.length);
  const emailNote = !email
    ? ""
    : !email.on
      ? "Message emails are switched off for this client"
      : !email.to.length
        ? "They have no portal login to email yet"
        : byEmail
          ? `To ${email.to.join(", ")}`
          : "Only in their portal (and bell)";

  return (
    <ChatPane
      thread={thread}
      mySide="team"
      links={TEAM_LINKS}
      placeholder={`Message ${client.companyName}…`}
      quickReplies={QUICK_REPLIES}
      composerTop={
        <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            type="button"
            role="switch"
            aria-checked={canEmail && byEmail}
            disabled={!canEmail}
            onClick={() => setByEmail((on) => !on)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e2e5e9] bg-white py-1 pr-3 pl-1 text-[12px] font-medium text-[#1f2530] hover:bg-[#f8f9fb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className={`relative h-4.5 w-8 rounded-full transition-colors ${canEmail && byEmail ? "bg-[#16a34a]" : "bg-[#d1d5db]"}`}
            >
              <span
                className={`absolute top-0.5 size-3.5 rounded-full bg-white shadow transition-all ${canEmail && byEmail ? "left-4" : "left-0.5"}`}
              />
            </span>
            {canEmail && byEmail ? (
              <Mail size={13.5} className="text-[#16a34a]" />
            ) : (
              <MailX size={13.5} className="text-[#9ca3af]" />
            )}
            Also send by email
          </button>
          <span className="min-w-0 truncate text-[11.5px] text-[#6b7280]">
            {emailNote}
          </span>
        </div>
      }
      header={
        <div className="flex items-center gap-3 border-b border-[#eceef1] bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#4b5563] hover:bg-[#f3f4f6] md:hidden"
          >
            <ArrowLeft size={17} />
          </button>
          <Avatar id={client._id} name={client.companyName} size={42} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-[#0b0c24]">
              {client.companyName}
            </div>
            <div className="truncate text-[12px] text-[#6b7280]">
              {[client.contactName, details?.email]
                .filter(Boolean)
                .join(" · ") || "Client"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDetails((shown) => !shown)}
            aria-pressed={showDetails}
            title={showDetails ? "Hide details" : "Show details"}
            className="hidden size-9 cursor-pointer place-items-center rounded-lg text-[#4b5563] hover:bg-[#f3f4f6] xl:grid"
          >
            {showDetails ? (
              <PanelRightClose size={18} />
            ) : (
              <PanelRightOpen size={18} />
            )}
          </button>
        </div>
      }
      aside={
        showDetails ? (
          <Details client={client} details={details} items={thread.items} />
        ) : null
      }
      empty={
        <div className="max-w-80">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8effd] text-[#2f5fd8]">
            <MessageSquare size={24} strokeWidth={1.8} />
          </span>
          <p className="mt-3 text-[14.5px] font-semibold text-[#1f2530]">
            Start the conversation with {client.companyName}
          </p>
          <p className="mt-1 text-[12.5px] text-[#6b7280]">
            They&apos;ll see it in their portal — and by email, if you leave
            that on. Try a quick reply below.
          </p>
        </div>
      }
    />
  );
};

// ── The inbox ────────────────────────────────────────────────────────────────

const Messages = ({
  conversations: firstConversations,
  clients,
  selected,
  initial,
}: {
  conversations: Conversation[];
  clients: ClientOption[];
  selected: string | null;
  initial: MessagePage | null;
}) => {
  const router = useRouter();
  const inBrowser = useInBrowser();
  const [conversations, setConversations] = useState(firstConversations);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [active, setActive] = useState(selected);
  // Seen again from the server (a refresh, a new ?client=): what it says wins.
  const [seen, setSeen] = useState({ firstConversations, selected });
  if (
    seen.firstConversations !== firstConversations ||
    seen.selected !== selected
  ) {
    setSeen({ firstConversations, selected });
    setConversations(firstConversations);
    setActive(selected);
  }

  const refresh = useCallback(
    () =>
      void listConversationsAction().then(
        (data) => data && setConversations(data.items),
      ),
    [],
  );
  useRefreshing(refresh);

  // A new message anywhere: its conversation goes to the top, with its count.
  useRealtime<ChatMessage>("messages:new", (message) => {
    setConversations((current) => {
      const existing = current.find(
        (each) => each.client._id === message.client,
      );
      if (!existing) {
        refresh();
        return current;
      }
      const unread =
        message.client === active
          ? 0
          : message.side === "client"
            ? existing.unread + 1
            : existing.unread;
      return [
        { ...existing, last: message, unread },
        ...current.filter((each) => each !== existing),
      ];
    });
  });

  const open = (id: string | null) => {
    setActive(id);
    if (id)
      setConversations((current) =>
        current.map((each) =>
          each.client._id === id ? { ...each, unread: 0 } : each,
        ),
      );
    router.replace(id ? `/messages?client=${id}` : "/messages", {
      scroll: false,
    });
  };

  const query = search.trim().toLowerCase();
  const matches = (client: { companyName?: string; contactName?: string }) =>
    !query ||
    `${client.companyName ?? ""} ${client.contactName ?? ""}`
      .toLowerCase()
      .includes(query);
  const unreadTotal = conversations.reduce((sum, each) => sum + each.unread, 0);
  const talking = conversations.filter(
    (each) => matches(each.client) && (filter === "all" || each.unread > 0),
  );
  const others = useMemo(() => {
    const withMessages = new Set(conversations.map((each) => each.client._id));
    return clients.filter((client) => !withMessages.has(client._id));
  }, [clients, conversations]);
  const othersShown =
    filter === "unread" ? [] : others.filter(matches).slice(0, query ? 50 : 12);

  const activeClient: ClientOption | undefined = active
    ? (clients.find((client) => client._id === active) ??
      (() => {
        const found = conversations.find(
          (each) => each.client._id === active,
        )?.client;
        return found
          ? {
              _id: found._id,
              companyName: found.companyName ?? "Client",
              contactName: found.contactName,
            }
          : undefined;
      })())
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">
            Messages
          </div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            Talk to your clients — in their portal, and by email when you
            choose. Comments on content, reports and onboarding land here too.
          </div>
        </div>
        {unreadTotal ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8effd] px-3 py-1.5 text-[12px] font-semibold text-[#2f5fd8]">
            <Inbox size={14} /> {unreadTotal} unread
          </span>
        ) : null}
      </div>

      <section className="flex h-[calc(100dvh-190px)] min-h-140 overflow-hidden rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
        {/* The conversations. */}
        <aside
          className={`flex w-80 shrink-0 flex-col border-r border-[#eceef1] bg-[#fcfcfd] max-md:w-full ${activeClient ? "max-md:hidden" : ""}`}
        >
          <div className="flex flex-col gap-2.5 border-b border-[#eceef1] p-3">
            <label className="flex h-9.5 items-center gap-2 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af]">
              <Search size={15} className="shrink-0 text-[#9ca3af]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clients…"
                aria-label="Search clients"
                className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[#9ca3af]"
              />
            </label>
            <div className="flex rounded-lg bg-[#eef0f3] p-0.5">
              {(
                [
                  ["all", "All"],
                  ["unread", `Unread${unreadTotal ? ` · ${unreadTotal}` : ""}`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={`flex-1 cursor-pointer rounded-md py-1.5 text-[12px] font-semibold transition-colors ${filter === key ? "bg-white text-[#0b0c24] shadow-[0_1px_2px_rgba(15,23,42,0.12)]" : "text-[#6b7280] hover:text-[#0b0c24]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {talking.map((each) => {
              const isActive = each.client._id === active;
              return (
                <button
                  key={each.client._id}
                  type="button"
                  onClick={() => open(each.client._id)}
                  className={`mx-1.5 flex w-[calc(100%-12px)] cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${isActive ? "bg-[#e8effd]" : "hover:bg-[#f3f4f6]"}`}
                >
                  <span className="relative">
                    <Avatar
                      id={each.client._id}
                      name={each.client.companyName}
                      size={42}
                    />
                    {each.unread ? (
                      <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-[#2f5fd8]" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span
                        className={`truncate text-[13.5px] ${each.unread ? "font-bold text-[#0b0c24]" : "font-semibold text-[#1f2530]"}`}
                      >
                        {each.client.companyName ?? "Client"}
                      </span>
                      <span
                        className={`ml-auto shrink-0 text-[11px] ${each.unread ? "font-semibold text-[#2f5fd8]" : "text-[#9ca3af]"}`}
                      >
                        {inBrowser ? shortWhen(each.last.createdAt) : ""}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`truncate text-[12px] ${each.unread ? "font-medium text-[#1f2530]" : "text-[#6b7280]"}`}
                      >
                        {each.last.side === "team" ? (
                          <span className="text-[#9ca3af]">You: </span>
                        ) : null}
                        {previewOf(each.last)}
                      </span>
                      {each.unread ? (
                        <span className="ml-auto grid h-4.5 min-w-4.5 shrink-0 place-items-center rounded-full bg-[#2f5fd8] px-1 text-[10.5px] font-bold text-white">
                          {each.unread > 99 ? "99+" : each.unread}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })}

            {othersShown.length ? (
              <>
                <div className="px-4 pt-4 pb-1.5 text-[10.5px] font-semibold tracking-wide text-[#9ca3af] uppercase">
                  Start a conversation
                </div>
                {othersShown.map((client) => (
                  <button
                    key={client._id}
                    type="button"
                    onClick={() => open(client._id)}
                    className={`mx-1.5 flex w-[calc(100%-12px)] cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left ${client._id === active ? "bg-[#e8effd]" : "hover:bg-[#f3f4f6]"}`}
                  >
                    <Avatar
                      id={client._id}
                      name={client.companyName}
                      size={32}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-[#1f2530]">
                        {client.companyName}
                      </span>
                      {client.contactName ? (
                        <span className="block truncate text-[11.5px] text-[#9ca3af]">
                          {client.contactName}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
                {!query && others.length > othersShown.length ? (
                  <p className="px-4 py-2 text-[11.5px] text-[#9ca3af]">
                    Search to find the other{" "}
                    {others.length - othersShown.length} clients.
                  </p>
                ) : null}
              </>
            ) : null}

            {!talking.length && !othersShown.length ? (
              <p className="px-4 py-10 text-center text-[12.5px] text-[#9ca3af]">
                {filter === "unread"
                  ? "You're all caught up."
                  : query
                    ? "No client matches that."
                    : "No clients yet."}
              </p>
            ) : null}
          </div>
        </aside>

        {/* The one picked, and what to know about it. */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${activeClient ? "" : "max-md:hidden"}`}
        >
          {activeClient ? (
            <Thread
              key={activeClient._id}
              client={activeClient}
              initial={activeClient._id === selected ? initial : null}
              onBack={() => open(null)}
            />
          ) : (
            <div className="grid flex-1 place-items-center bg-[#f8f9fb] p-6 text-center">
              <div className="max-w-80">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-[#2f5fd8] shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
                  <MessageSquare size={28} strokeWidth={1.7} />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-[#1f2530]">
                  Pick a conversation
                </p>
                <p className="mt-1 text-[12.5px] text-[#6b7280]">
                  Choose a client on the left to read and reply. Unread ones
                  have a blue dot.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Messages;
