"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/lib/realtime";
import { PasswordEye } from "@/component/shared/PasswordModal";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ChartBar,
  CircleCheck,
  CircleHelp,
  CircleMinus,
  Megaphone,
  SearchCheck,
  ThumbsUp,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  Layers,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  Pencil,
  PenLine,
  Phone,
  Plus,
  RefreshCw,
  Server,
  StickyNote,
  Target,
  Trash2,
  User,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { deleteClientAction, getClientPortalPasswordAction, updateClientAction, type Client, type ClientLogin, type ClientStatus } from "@/app/actions/clients";
import type { OnboardingAnswers, OnboardingComment, OnboardingFile, OnboardingRequest } from "@/app/actions/onboarding";
import {
  CLIENT_HAS,
  CLIENT_STATUS_OPTIONS,
  GOAL_BUDGETS,
  GOAL_TIMEFRAMES,
  LEAD_SOURCES,
  NONE,
  ONBOARDING_STATUS_COLORS,
  ONBOARDING_STATUS_LABELS,
  PORTAL_MENUS,
  REACH_BY,
  SERVICES,
  SOCIAL_PROFILES,
  SOCIAL_TRANSFER,
  TONES,
  TONE_ORDER,
  WEBSITE_TRANSFER,
  avatarColorFor,
  countsOf,
  formatDate,
  formatDateTime,
  groupsOf,
  initialsOf,
  isAnswered,
  linkOf,
  money,
  portalMenusOf,
  sharedOf,
  staffName,
  statusClassName,
  statusLabel,
  targetOf,
  uploadsOf,
  type Item,
  type Tone,
} from "./clientUi";
import { CALENDAR_URL } from "@/lib/booking";
import OnboardingComments from "./OnboardingComments";
import { DEFAULT_NOT_NEEDED } from "./OnboardingControls";
import {
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDanger,
  btnDangerOutline,
  btnDraft,
  dashPendingSub,
  sectionCard,
  sectionHeader,
  sectionTitle,
} from "@/component/shared/ui";

// ── Shared pieces ────────────────────────────────────────────────────────────

const iconText = "inline-flex items-center gap-1.25";

// Header actions stay deliberately compact: there can be several useful actions for one client
// without allowing them to overpower the client name and status.
const headerAction = "inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#dbe3ed] bg-white px-3 text-[12px] font-semibold text-[#475569] no-underline transition-colors hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:text-[#2563eb]";
const headerPrimaryAction = "inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#0b1522] px-3 text-[12px] font-semibold text-white no-underline transition-colors hover:bg-[#17263a]";
const headerDangerAction = "inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#fecaca] bg-white px-3 text-[12px] font-semibold text-[#dc2626] transition-colors hover:bg-[#fff7f7]";

// The pieces a client's details are laid out with, shared by every card on their page.

// Label / value rows: a fixed label column, the value beside it.
const infoTable =
  "flex flex-col gap-3 [&>div]:grid [&>div]:grid-cols-[110px_1fr] [&>div]:gap-2.5 [&>div]:text-[12.5px] [&>div>span]:font-semibold [&>div>span]:text-[#7a8e9b] [&>div>b]:font-bold [&>div>b]:text-[#17242f]";

// What a field holds — or "None", greyed, when the record has nothing in it.
const Value = ({ children }: { children?: string | null }) =>
  children?.trim() ? <b className="whitespace-pre-wrap break-words">{children}</b> : <b className="font-medium! text-[#a3b1ba]!">None</b>;

// ── What the team recorded (the add/edit form) ───────────────────────────────

// A client's record, read back the way the add/edit form asks for it (ClientAdd.tsx): the same
// five parts in the same order, every field filled in or not — "None" where nothing was given.
// A client from before the form asked, or one who signed up themselves, has little of it.

const listed = (values?: string[]) => (values?.length ? values.join(", ") : undefined);
const yesNo = (value?: boolean) => (value === undefined ? undefined : value ? "Yes" : "No");
// A date the form saved as yyyy-mm-dd.
const day = (value?: string) => (value ? formatDate(value) : undefined);

const SIGNED = { yes: "Yes, signed", sent: "Sent, waiting for signature", no: "Not sent yet" };

// A quantity or a price, as its field on the form holds it.
const fieldValue = (service: string, label: string, value: number) =>
  SERVICES.find((entry) => entry.name === service)?.fields.find((field) => field.label === label)?.money ? money(value) : String(value);

// One field as it is read back: an icon, its label, and what it holds. A `wide` one (an
// address, a list, a note) takes the whole row.
// With a `tone` the value is where the thing stands, shown as a pill; `note` is a line of detail under it.
// `content` shows in place of the value, for one that needs more than text (a password to reveal).
type Row = { icon: LucideIcon; label: string; value?: string | null; wide?: boolean; tone?: Tone; note?: string; content?: ReactNode };

const rowStyleOf = (row: Row) => {
  const value = row.value?.trim() ?? "";
  const pending = /^(not yet|not booked|unassigned|nothing ticked)/i.test(value);

  if (!value || value === NONE || row.tone === "none") {
    return {
      card: "border-[#fecaca] bg-[#fff7f7]",
      icon: "bg-[#fee2e2] text-[#dc2626]",
      label: "text-[#b45309]",
      value: "text-[#b91c1c]",
      note: "text-[#b45309]",
    };
  }
  if (pending || (row.tone && row.tone !== "ready")) {
    return {
      card: "border-[#fde68a] bg-[#fffbeb]",
      icon: "bg-[#fef3c7] text-[#b45309]",
      label: "text-[#a16207]",
      value: "text-[#92400e]",
      note: "text-[#a16207]",
    };
  }
  return {
    card: "border-[#bbf7d0] bg-[#f4fbf6]",
    icon: "bg-[#dcfce7] text-[#15803d]",
    label: "text-[#15803d]",
    value: "text-[#14532d]",
    note: "text-[#3f6212]",
  };
};

const Rows = ({ rows }: { rows: Row[] }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {rows.map((row) => {
      const style = rowStyleOf(row);
      const value = row.value?.trim();
      return (
        <div key={row.label} className={`flex min-w-0 items-start gap-3 rounded-xl border p-3.5 ${style.card} ${row.wide ? "sm:col-span-full" : ""}`}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.icon}`}>
            <row.icon size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0 pt-0.5">
            <div className={`text-[11px] font-semibold tracking-[0.01em] ${style.label}`}>{row.label}</div>
            {row.content ? (
              <div className={`mt-1 text-[13px] leading-snug font-semibold ${style.value}`}>{row.content}</div>
            ) : value && row.tone ? (
              <span className={`${pill} mt-1.5 ${TONES[row.tone].className}`}>{value}</span>
            ) : value && linkOf(value) ? (
              <a href={linkOf(value) ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-[13px] leading-snug font-semibold text-[#2563eb] hover:underline">
                <span className="truncate">{value}</span>
                <ArrowUpRight size={12} strokeWidth={2.25} className="shrink-0" />
              </a>
            ) : value ? (
              <div className={`mt-1 text-[13px] leading-snug font-semibold break-words whitespace-pre-wrap ${style.value}`}>{value}</div>
            ) : (
              <div className={`mt-1 text-[13px] leading-snug font-medium ${style.value}`}>None</div>
            )}
            {row.note ? <div className={`mt-1.5 text-[12px] leading-normal break-words whitespace-pre-wrap ${style.note}`}>{row.note}</div> : null}
          </div>
        </div>
      );
    })}
  </div>
);

// The colors of each part's icon.
const TINTS = {
  blue: "bg-[#eaf2ff] text-[#2563eb]",
  green: "bg-[#e7f6ec] text-[#15803d]",
  amber: "bg-[#fef3e2] text-[#d97706]",
  violet: "bg-[#f1ebfe] text-[#7c3aed]",
  rose: "bg-[#fde7ef] text-[#db2777]",
  slate: "bg-[#f1f5f9] text-[#475569]",
};
// Where a part stands, in its badge: done, part of the way, or money.
const BADGES = {
  done: "bg-[#dcfce7] text-[#15803d]",
  partly: "bg-[#eef2f7] text-[#475569]",
  pending: "bg-[#fef3c7] text-[#92400e]",
  money: "bg-[#dcfce7] text-[#15803d]",
};
type Badge = { label: string; tone: keyof typeof BADGES };

// How many of a part's fields hold something, as its badge says it.
const filledOf = (rows: Row[]): Badge => {
  const filled = rows.filter((row) => row.content || row.value?.trim()).length;
  return { label: `${filled} / ${rows.length} filled`, tone: filled === rows.length ? "done" : "partly" };
};
// A few of a part's values, to read it by while it is closed.
const chipsOf = (values: (string | null | undefined)[]) => values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));

// One of the form's parts, closed to a line until it is clicked: its step, icon and name, a few
// of its values, and where it stands. Open, it shows everything — and, for those who can, the
// way to the form to change it.
const Section = ({
  icon: Icon,
  title,
  sub,
  editHref,
  step,
  steps,
  tint,
  chips,
  badge,
  open,
  onToggle,
  href,
  children,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  editHref?: string;
  step: number;
  steps: number;
  tint: keyof typeof TINTS;
  chips: string[];
  badge?: Badge;
  open: boolean;
  onToggle: () => void;
  // A part with a page of its own: clicking it goes there instead of opening it here.
  href?: string;
  children?: ReactNode;
}) => {
  const bodyId = useId();
  if (href) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)] transition-shadow hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
        <h2>
          <Link href={href} className="group flex items-center gap-4 px-5 py-4 no-underline sm:px-5.5">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TINTS[tint]}`}>
              <Icon size={20} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] font-bold tracking-[0.08em] text-[#64748b] uppercase">
                Step {step} of {steps}
              </span>
              <span className="mt-0.5 block text-[17px] leading-tight font-bold text-[#0f172a]">{title}</span>
              {chips.length ? (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((chip, index) => (
                    <span key={index} className="max-w-65 truncate rounded-md bg-[#f1f5f9] px-2 py-1 text-[12px] font-medium text-[#334155]" title={chip}>
                      {chip}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="mt-1 block text-[12.5px] font-normal text-[#64748b]">{sub}</span>
              )}
            </span>
            {badge ? <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap tabular-nums ${BADGES[badge.tone]}`}>{badge.label}</span> : null}
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] transition-colors group-hover:border-[#2563eb] group-hover:text-[#2563eb]">
              <ArrowRight size={16} strokeWidth={2.25} />
            </span>
          </Link>
        </h2>
      </section>
    );
  }
  return (
    <section className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${open ? "border-[#cfdcf3] shadow-[0_8px_24px_rgba(15,23,42,0.07)]" : "border-[#e2e8f0] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]"}`}>
      <div className="flex items-center gap-3 px-5 py-4 sm:px-5.5">
        <h2 className="min-w-0 flex-1">
          <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={onToggle} className="flex w-full min-w-0 cursor-pointer items-center gap-4 text-left">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TINTS[tint]}`}>
              <Icon size={20} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] font-bold tracking-[0.08em] text-[#64748b] uppercase">
                Step {step} of {steps}
              </span>
              <span className="mt-0.5 block text-[17px] leading-tight font-bold text-[#0f172a]">{title}</span>
              {open || !chips.length ? (
                <span className="mt-1 block text-[12.5px] font-normal text-[#64748b]">{sub}</span>
              ) : (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((chip, index) => (
                    <span key={index} className="max-w-65 truncate rounded-md bg-[#f1f5f9] px-2 py-1 text-[12px] font-medium text-[#334155]" title={chip}>
                      {chip}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </button>
        </h2>
        <div className="flex shrink-0 items-center gap-2.5 max-sm:flex-col-reverse max-sm:items-end">
          {editHref && open ? (
            <Link href={editHref} className={`${btnDraft} ${iconText}`}>
              <Pencil size={12} strokeWidth={2} /> Edit
            </Link>
          ) : null}
          {badge ? <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap tabular-nums ${BADGES[badge.tone]}`}>{badge.label}</span> : null}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={onToggle}
            className="grid size-8 cursor-pointer place-items-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            <ChevronDown size={16} strokeWidth={2.25} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {/* Grows and shrinks smoothly to its own height. */}
      <div id={bodyId} className={`grid transition-[grid-template-rows] duration-250 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="border-t border-[#eef2f7] px-5 py-5 sm:px-5.5">{children}</div>
        </div>
      </div>
    </section>
  );
};

// Whether the client has booked their onboarding call with us — their own word, as the booking
// calendar doesn't tell us — and the calendar, which is where to see when it is. In Client
// information (RecordSections).
const OnboardingCall = ({ call }: { call?: NonNullable<Client["onboarding"]>["kickoffCall"] }) => (
  <div className={`rounded-xl border p-4 ${call?.booked ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#fde68a] bg-[#fffbeb]"}`}>
    <div className="flex items-center gap-3">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${call?.booked ? "bg-[#16a34a] text-white" : "bg-[#fef3c7] text-[#b45309]"}`}
      >
        {call?.booked ? <CalendarCheck size={19} strokeWidth={2} /> : <CalendarClock size={19} strokeWidth={2} />}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold tracking-[0.06em] text-[#64748b] uppercase">Onboarding call</div>
        <div className={`text-[15px] font-bold ${call?.booked ? "text-[#15803d]" : "text-[#b45309]"}`}>
          {call?.booked ? "Booked" : "Not booked yet"}
        </div>
      </div>
    </div>
    <p className="mt-2.5 text-[12.5px] leading-normal text-[#475569]">
      {call?.booked
        ? `The client says they booked it${call.bookedAt ? ` on ${formatDate(call.bookedAt)}` : ""}. The date and time are in the booking calendar.`
        : "The client hasn't said they booked it. Their onboarding emails remind them."}
    </p>
    <a
      href={CALENDAR_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-[12.5px] font-semibold text-[#334155] no-underline transition-colors hover:border-[#93c5fd] hover:text-[#2563eb]"
    >
      <Calendar size={14} strokeWidth={2} /> Open the booking calendar <ArrowUpRight size={12} strokeWidth={2.25} />
    </a>
  </div>
);

// The accounts a client says they have, as they answered when signing up (and on their
// onboarding form since): each with whether they have it, its link, and — where they don't —
// whether we are to make it. Beside Client information (RecordSections).
const SIGNUP_ACCOUNTS: [section: "google" | "social", key: string, name: string, icon: LucideIcon][] = [
  ["google", "businessProfile", "Google Business Profile", MapPin],
  ["google", "analytics", "Google Analytics", ChartBar],
  ["google", "searchConsole", "Google Search Console", SearchCheck],
  ["google", "ads", "Google Ads", Megaphone],
  ["social", "facebook", "Facebook Page", ThumbsUp],
  ["social", "instagram", "Instagram", Camera],
  ["social", "linkedin", "LinkedIn", Briefcase],
  ["social", "metaAds", "Meta Ads", Target],
];
type AccountAnswer = { has?: "yes" | "no" | "unsure"; link?: string; wantsCreated?: boolean };

const ACCOUNT_LOOKS = {
  has: { label: "Has it", icon: CircleCheck, tile: "bg-[#dcfce7] text-[#15803d]", pill: "bg-[#dcfce7] text-[#15803d]" },
  create: { label: "We'll create it", icon: Plus, tile: "bg-[#e8eefe] text-[#2f5fd8]", pill: "bg-[#e8eefe] text-[#2f5fd8]" },
  none: { label: "Doesn't have it", icon: CircleMinus, tile: "bg-[#f1f5f9] text-[#64748b]", pill: "bg-[#f1f5f9] text-[#475569]" },
  unsure: { label: "Not sure", icon: CircleHelp, tile: "bg-[#fef3c7] text-[#b45309]", pill: "bg-[#fef3c7] text-[#b45309]" },
  blank: { label: "No answer", icon: CircleHelp, tile: "bg-[#f8fafc] text-[#cbd5e1]", pill: "bg-[#f8fafc] text-[#94a3b8]" },
} as const;

const lookOf = (answer?: AccountAnswer): keyof typeof ACCOUNT_LOOKS =>
  answer?.has === "yes" ? "has" : answer?.wantsCreated ? "create" : answer?.has === "no" ? "none" : answer?.has === "unsure" ? "unsure" : "blank";

const noteOf = (answer?: AccountAnswer) =>
  answer?.has === "yes"
    ? undefined
    : answer?.has === "no"
      ? answer.wantsCreated
        ? "They asked us to set it up"
        : answer.wantsCreated === false
          ? "They'll set it up themselves"
          : "Not said whether we should create it"
      : answer?.has === "unsure"
        ? answer.wantsCreated
          ? "Check for one, and create it if there isn't"
          : "We'll check whether one exists"
        : "Not answered yet";

const ClientAccounts = ({ onboarding }: { onboarding?: Client["onboarding"] }) => {
  const rows = SIGNUP_ACCOUNTS.map(([section, key, name, icon]) => {
    const answer = (onboarding?.[section] as Record<string, AccountAnswer | undefined> | undefined)?.[key];
    return { key: `${section}.${key}`, name, icon, answer, look: lookOf(answer) };
  });
  const count = (look: keyof typeof ACCOUNT_LOOKS) => rows.filter((row) => row.look === look).length;
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["has", "create", "none", "unsure", "blank"] as const)
          .filter((look) => count(look))
          .map((look) => (
            <span key={look} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${ACCOUNT_LOOKS[look].pill}`}>
              {count(look)} · {ACCOUNT_LOOKS[look].label}
            </span>
          ))}
      </div>
      <ul className="grid list-none grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rows.map(({ key, name, icon: Icon, answer, look }) => {
          const style = ACCOUNT_LOOKS[look];
          const link = answer?.has === "yes" ? answer.link?.trim() : undefined;
          return (
            <li key={key} className={`flex items-center gap-3 rounded-xl border p-3 ${look === "blank" ? "border-dashed border-[#e2e8f0] bg-white" : "border-[#e2e8f0] bg-white"}`}>
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${style.tile}`}>
                <Icon size={17} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[#0f172a]">{name}</span>
                {link ? (
                  <a href={/^https?:\/\//i.test(link) ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="mt-0.5 flex min-w-0 items-center gap-1 text-[12px] font-medium text-[#2563eb] hover:underline">
                    <span className="truncate">{link}</span>
                    <ArrowUpRight size={11} strokeWidth={2.25} className="shrink-0" />
                  </a>
                ) : (
                  <span className="mt-0.5 block truncate text-[12px] text-[#64748b]">{answer?.has === "yes" ? "No link given" : noteOf(answer)}</span>
                )}
              </span>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${style.pill}`}>
                <style.icon size={11} strokeWidth={2.5} />
                {style.label}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
};

// What the client uploaded with their onboarding — their logo, their photos and videos — a
// tile for each file, which opens it.
const Uploads = ({ groups }: { groups: { title: string; files: OnboardingFile[] }[] }) => (
  <div className="flex flex-col gap-4.5">
    {groups.map((group) => (
      <div key={group.title}>
        <div className="mb-2 text-[11.5px] font-semibold text-[#7a8e9b]">
          {group.title} · {group.files.length} file{group.files.length === 1 ? "" : "s"}
        </div>
        <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2.5">
          {group.files.map((file) => (
            <li key={file.url}>
              <a href={file.url} target="_blank" rel="noopener noreferrer" title={file.name} className="block overflow-hidden rounded-lg border border-[#dbe3de] bg-[#f7f9f8] no-underline hover:border-[#2563eb]">
                <span className="block aspect-square">
                  {file.mimeType?.startsWith("video/") ? (
                    <video src={`${file.url}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                  ) : (
                    // The file sits on the storage's own address, which next/image isn't set up for.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt="" className="h-full w-full object-contain" />
                  )}
                </span>
                <span className="block truncate border-t border-[#eef3ef] bg-white px-1.5 py-1 text-[10.5px] font-semibold text-[#4a5c68]">{file.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

// A heading inside a part, as "Contract", "Billing" and "Account" are inside Account setup.
const Subhead = ({ first = false, children }: { first?: boolean; children: ReactNode }) => (
  <h3 className={`mb-4 text-[11px] font-bold tracking-[0.6px] text-[#8496a3] uppercase ${first ? "" : "mt-5.5 border-t border-[#eef3ef] pt-5"}`}>{children}</h3>
);

// The questions the onboarding form asks the client too. On the client's page each is shown
// once, under Business details — so these lines, where the same answer would show again, are
// left out of the onboarding answers further down: by the item's id, the labels of its fields.
const ACCOUNT_LINK = ["Link or name"];
const ASKED_TWICE: Record<string, string[]> = {
  website: ["Current website", "Example websites"],
  logo: ["Has a logo", "Style they'd like"],
  businessProfile: ACCOUNT_LINK,
  ...Object.fromEntries(SOCIAL_PROFILES.map(([key]) => [key, ACCOUNT_LINK])),
};

// The icon for each thing the onboarding form asks about, by the item's id — any Google
// account, social account or kind of media has its group's.
const ANSWER_ICONS: Record<string, LucideIcon> = { website: Globe, domain: Globe, hosting: Server, cms: Lock, email: Mail, logo: Palette };

// One thing the client was asked about on the onboarding form, as a row of their record:
// where it stands for the team, and under it what they answered — less what Business details
// already shows, and the fields they left empty or said no to.
const answerRow = (item: Item, icon: LucideIcon): Row => ({
  icon: ANSWER_ICONS[item.id] ?? icon,
  label: item.name,
  value: item.label,
  tone: item.tone,
  note: item.details
    .filter(([label, value]) => value !== NONE && value !== "No" && !ASKED_TWICE[item.id]?.includes(label))
    .map(([label, value]) => `${label}: ${value}`)
    .join(" · "),
  wide: item.id === "website",
});

// The five parts. `manager` and `team` are the names of the staff on the account.
const RecordSections = ({ client, editHref, manager, team }: { client: Client; editHref?: string; manager?: string; team: string[] }) => {
  const { communication, business, services: recorded = [], contract, billing, reportDelivery } = client.details ?? {};
  // Running now; the finished ones are their history, shown apart and not counted.
  const services = recorded.filter((plan) => plan.status !== "done");
  const finished = recorded.filter((plan) => plan.status === "done").sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
  const logoDesign = business?.logoDesign;
  // A custom service is paid once (one saved as monthly before counts as once too).
  const onceOf = (plan: { custom?: boolean; oneTime?: number; monthly: number }) => (plan.custom ? plan.oneTime || plan.monthly : 0);
  const monthly = services.reduce((sum, plan) => sum + (plan.custom ? 0 : plan.monthly), 0);
  // What both forms ask — the team's and the client's onboarding form — is kept once, and shown once.
  const shared = sharedOf(client);
  // Paid once: a logo designed for them, and the team's own services priced once.
  const oneTime = (shared.hasLogo === false && logoDesign?.add ? (logoDesign.price ?? 0) : 0) + services.reduce((sum, plan) => sum + onceOf(plan), 0);
  // What the client asked for and doesn't have yet (a service of the same name answers it).
  const taken = new Set([...recorded.map((plan) => plan.name.trim().toLowerCase()), ...client.serviceTypes.map((name) => name.trim().toLowerCase())]);
  const openRequests = (client.serviceRequests ?? []).filter((request) => request.status === "open" && !taken.has(request.name.trim().toLowerCase()));
  // Services on the client that were never priced on the form.
  const unpriced = client.serviceTypes.filter((name) => !recorded.some((plan) => plan.name === name));
  const menus = portalMenusOf(client);

  const examples = shared.competitors.map((row) => [row.url, row.note].filter(Boolean).join(" — "));
  // What the client said when signing up: about the business, its goals, the kickoff call, and
  // the one account only asked about then.
  const about = client.onboarding?.business;
  const goals = client.onboarding?.goals;
  // What the client answered on the onboarding form, by the form's own steps — for where the
  // onboarding stands. The answers themselves are on the onboarding page (OnboardingTransfer).
  const [site, domains, mail, brand, google, social, media] = groupsOf({ onboarding: client.onboarding ?? { status: "in_progress" } });

  const answered = client.onboarding;

  // ── 1. Who they are and how to reach them ──
  // Where they are: the address the team recorded; else what the client gave when signing up.
  const areasLine = listed(about?.areas);
  const location = client.address?.trim() || areasLine;
  // Someone other than the person who signed up looks after the account.
  const otherContact = about?.contact && about.contact.isAccountOwner === false ? [about.contact.name, about.contact.email, about.contact.phone].filter(Boolean).join(" · ") : "";
  const hasAccountAnswers = SIGNUP_ACCOUNTS.some(([section, key]) => (answered?.[section] as Record<string, AccountAnswer | undefined> | undefined)?.[key]?.has);
  const infoRows: Row[] = [
    { icon: User, label: "Contact name", value: client.contactName },
    { icon: Building2, label: "Company name", value: client.companyName },
    { icon: Mail, label: "Email", value: client.email },
    { icon: Phone, label: "Phone", value: client.phone },
    { icon: MapPin, label: "Location", value: location, wide: true },
    ...(otherContact ? [{ icon: UserCog, label: "Main contact for the account", value: otherContact, wide: true }] : []),
    // What the team recorded; else how the client said to reach them, at sign-up.
    { icon: MessageSquare, label: "Preferred communication", value: listed(communication?.methods) ?? REACH_BY[about?.contact?.reachBy ?? ""] },
    { icon: Clock, label: "Best time to reach", value: communication?.bestTime },
    { icon: Globe, label: "Time zone", value: communication?.timeZone },
  ];

  // ── 2. What the business does ──
  const businessRows: Row[] = [
    { icon: FileText, label: "What the business does", value: about?.description, wide: true },
    { icon: Briefcase, label: "Industry", value: business?.industry },
    { icon: Building2, label: "Business type", value: business?.businessType },
    { icon: Layers, label: "Services they offer", value: listed(about?.services), wide: true },
    // The team's own words for it; else the areas the client gave ("Areas you serve").
    { icon: Target, label: "Areas they serve", value: business?.serviceArea || areasLine, wide: true },
    { icon: Users, label: "Target audience", value: business?.targetAudience },
    { icon: StickyNote, label: "Other details", value: business?.otherDetails, wide: true },
  ];

  // ── 4. Their website and brand ──
  const websiteRows: Row[] = [
    { icon: Globe, label: "Current website", value: shared.hasNoWebsite ? "No website yet" : shared.website },
    {
      icon: RefreshCw,
      label: "Website plan",
      value: answered?.website?.need === "new" ? "Build a new website" : answered?.website?.need === "redesign" ? "Redesign the current site" : answered?.website?.need === "no" ? "Keep the current site" : undefined,
    },
    { icon: FileText, label: "Pages they want", value: listed(answered?.website?.pages), wide: true },
    { icon: Check, label: "Features they want", value: listed(answered?.website?.features), wide: true },
    { icon: Link2, label: "Example and competitor websites", value: examples.length ? examples.join("\n") : shared.competitorsBefore, wide: true },
  ];
  const domainRows: Row[] = [
    {
      icon: Link2,
      label: "Domain",
      value:
        answered?.domain?.has === "yes"
          ? [answered.domain.name, answered.domain.platform && `registered at ${answered.domain.platform}`].filter(Boolean).join(" · ") || "Has one"
          : answered?.domain?.has === "no"
            ? answered.domain.wantsCreated
              ? `Wants us to register one${answered.domain.wishlist ? `: ${answered.domain.wishlist}` : ""}`
              : "Doesn't have one"
            : answered?.domain?.has === "unsure"
              ? "Not sure"
              : undefined,
    },
    {
      icon: Mail,
      label: "Business email",
      value:
        answered?.email?.has === "yes"
          ? `Has one${answered.email.provider && answered.email.provider !== "Not sure" ? ` · ${answered.email.provider}` : ""}`
          : answered?.email?.has === "no"
            ? answered.email.wantsCreated
              ? `Wants Google Workspace set up${answered.email.accounts ? ` · ${answered.email.accounts} account${answered.email.accounts === 1 ? "" : "s"}` : ""}`
              : "Doesn't have one"
            : undefined,
    },
  ];
  // Only the profiles there are a link to: the rest are on the onboarding page, item by item.
  const profileRows: Row[] = [
    { icon: MapPin, label: "Google Business Profile", value: shared.googleBusinessProfile },
    ...SOCIAL_PROFILES.map(([key, label]) => ({ icon: Link2, label: label.replace(/ URL$/, ""), value: shared.social[key] })),
  ].filter((row) => row.value);
  const logoRows: Row[] = [
    { icon: Palette, label: "Has a logo", value: yesNo(shared.hasLogo) },
    ...(shared.hasLogo === false
      ? [
          {
            icon: Palette,
            label: "Logo design",
            value: logoDesign?.add
              ? `Added to onboarding · ${money(logoDesign.price ?? 0)} one-time · ${logoDesign.concepts ?? 0} concepts`
              : answered?.logo?.wantsCreated
                ? "The client asked us to design one"
                : answered?.logo?.wantsCreated === false
                  ? "The client doesn't want one designed"
                  : "Not added to onboarding",
          },
          { icon: PenLine, label: "Style they'd like", value: shared.logoStyle, wide: true },
        ]
      : []),
  ];
  const logoUploads = [
    { title: "Their logo", files: answered?.logo?.files ?? [] },
    { title: "Style they'd like", files: answered?.logo?.styleFiles ?? [] },
  ].filter((group) => group.files.length);

  const goalRows: Row[] = goals
    ? [
        { icon: DollarSign, label: "Revenue per month", value: targetOf(goals.revenue, money) },
        { icon: Users, label: "Leads per month", value: targetOf(goals.leads, String) },
        { icon: User, label: "New clients per month", value: targetOf(goals.newClients, String) },
        { icon: Clock, label: "How soon", value: GOAL_TIMEFRAMES[goals.timeframe ?? ""] },
        { icon: CreditCard, label: "Monthly marketing budget", value: GOAL_BUDGETS[goals.budget ?? ""] },
        { icon: DollarSign, label: "Cost of one lead today", value: goals.costPerLead === undefined ? undefined : money(goals.costPerLead) },
        { icon: DollarSign, label: "Worth of one new client", value: goals.clientValue === undefined ? undefined : money(goals.clientValue) },
        { icon: Link2, label: "Where leads come from", value: listed(goals.leadSources?.map((source) => LEAD_SOURCES[source] ?? source)), wide: true },
      ]
    : [];
  const contractRows: Row[] = [
    { icon: Calendar, label: "Start date", value: client.startDate ? formatDate(client.startDate) : undefined },
    { icon: Clock, label: "Length", value: contract?.termMonths ? `${contract.termMonths} month${contract.termMonths === 1 ? "" : "s"}` : contract ? "Custom" : undefined },
    { icon: Calendar, label: "End date", value: day(contract?.endDate) },
    { icon: RefreshCw, label: "Renewal", value: contract?.renewal },
    { icon: Bell, label: "Cancellation notice", value: contract?.cancellationNotice },
    { icon: Bell, label: "Renewal reminder", value: contract?.renewalReminder },
    { icon: PenLine, label: "Signed", value: contract?.signed ? SIGNED[contract.signed] : undefined },
    ...(contract?.signed === "yes" ? [{ icon: Calendar, label: "Date signed", value: day(contract.dateSigned) }] : []),
    ...(contract?.signed === "sent" ? [{ icon: Calendar, label: "Date sent", value: day(contract.dateSent) }] : []),
  ];
  const billingRows: Row[] = [
    { icon: CreditCard, label: "Payment on file", value: billing ? (billing.paymentOnFile ? "Yes, added" : "Not yet") : undefined },
    { icon: CreditCard, label: "Payment method", value: billing?.method },
    { icon: RefreshCw, label: "Billing cycle", value: billing?.cycle },
    { icon: Calendar, label: "Billing day", value: billing?.day },
    { icon: DollarSign, label: "Setup fee", value: billing?.setupFee },
    { icon: Mail, label: "Report delivery", value: reportDelivery },
  ];
  const accountRows: Row[] = [
    { icon: UserCog, label: "Account manager", value: manager },
    // The portal password — only ever sent to those who manage clients (who get the edit link).
    {
      icon: Lock,
      label: "Portal password",
      value: client.hasPortalPassword
        ? "Hidden"
        : !client.user
          ? "No portal login"
          : !editHref
            ? "Only managers can see it"
            : "Not saved — set a new password on Edit Client to see it",
      tone: client.hasPortalPassword ? undefined : "none",
      content: client.hasPortalPassword ? <PasswordValue clientId={client._id} /> : undefined,
    },
    { icon: Users, label: "Assigned staff", value: team.join(", ") },
    // No choice made is every page. Settings is always there, so it isn't among them.
    {
      icon: LayoutGrid,
      label: "Portal pages shown",
      value: menus ? (listed(PORTAL_MENUS.filter(([key]) => menus.includes(key)).map(([, label]) => label)) ?? "None of them — only Settings") : "All pages",
      wide: true,
    },
    ...(menus ? [{ icon: LayoutGrid, label: "Portal pages hidden", value: listed(PORTAL_MENUS.filter(([key]) => !menus.includes(key)).map(([, label]) => label)), wide: true }] : []),
    { icon: StickyNote, label: "Internal notes", value: client.notes, wide: true },
  ];

  // The parts in order, each closed until it is clicked.
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  // In the order the client is got to know: who, their business (what it does, where it wants to
  // be, what it has online), what they buy from us, their onboarding, and the account itself —
  // the same five parts as the client form.
  const titles = ["Client information", "About the business", "Services and pricing", "Onboarding and transfer", "Account setup"];
  const part = (title: string) => ({
    step: titles.indexOf(title) + 1,
    steps: titles.length,
    open: Boolean(opened[title]),
    onToggle: () => setOpened((now) => ({ ...now, [title]: !now[title] })),
  });

  // Onboarding: what the client is asked (the team's ticks — see OnboardingControls), how much
  // of it is approved, and what is still waiting on them or needs our help.
  const notNeeded = new Set(client.onboarding?.notNeeded ?? DEFAULT_NOT_NEEDED);
  const approvedIds = new Set(client.onboarding?.approved ?? []);
  const asked = [site, domains, mail, brand, google, social, media]
    .filter((group) => !notNeeded.has(`step:${group.id}`))
    .flatMap((group) => group.items.map((item) => ({ item, id: ["google", "social", "media"].includes(group.id) ? `${group.id}.${item.id}` : item.id })))
    .filter(({ id }) => !notNeeded.has(id));
  // Who the client is ("contact") is always asked.
  const askedCount = asked.length + 1;
  const approvedCount = asked.filter(({ id }) => approvedIds.has(id)).length + (approvedIds.has("contact") ? 1 : 0);
  // Where the rest stands, in the client's own words (Submitted / Todo — OnboardingReview).
  const todo = asked.filter(({ item, id }) => !approvedIds.has(id) && (!isAnswered(item) || item.tone === "waiting")).length;
  const submitted = asked.filter(({ item, id }) => !approvedIds.has(id) && isAnswered(item) && item.tone !== "waiting").length;
  const onboardingChips = chipsOf([
    client.onboarding?.status === "submitted" ? `Submitted${client.onboarding.submittedAt ? ` ${formatDate(client.onboarding.submittedAt)}` : ""}` : client.onboarding?.status ? "Still filling in" : "Not started",
    submitted ? `${submitted} submitted` : undefined,
    todo ? `${todo} todo` : undefined,
  ]);

  return (
    <>
      <Section
        icon={Users}
        title="Client information"
        sub="Who the client is, and how and when to reach them."
        editHref={editHref && `${editHref}?section=1`}
        {...part("Client information")}
        tint="blue"
        chips={chipsOf([
          client.contactName,
          client.companyName,
          client.email,
          client.onboarding?.kickoffCall?.booked ? "Call booked" : client.onboarding?.status ? "Call not booked yet" : undefined,
        ])}
        badge={filledOf(infoRows)}
      >
        <Rows rows={infoRows} />
        {/* What they said about their accounts when signing up. */}
        {hasAccountAnswers ? (
          <>
            <Subhead>Accounts they have</Subhead>
            <ClientAccounts onboarding={client.onboarding} />
          </>
        ) : null}
        {client.onboarding?.status || client.onboarding?.kickoffCall ? (
          <>
            <Subhead>Onboarding call</Subhead>
            <OnboardingCall call={client.onboarding?.kickoffCall} />
          </>
        ) : null}
      </Section>

      <Section
        icon={Briefcase}
        title="About the business"
        sub="What they do and who they serve, where they want to be, and their website and brand."
        editHref={editHref && `${editHref}?section=2`}
        {...part("About the business")}
        tint="green"
        chips={chipsOf([business?.industry, ...(about?.services ?? []).slice(0, 2), shared.hasNoWebsite ? "No website yet" : shared.website])}
        badge={filledOf([...businessRows, ...goalRows, ...websiteRows, ...domainRows, ...logoRows])}
      >
        <Subhead first>The business</Subhead>
        <Rows rows={businessRows} />

        {/* Asked only of a client who signs up themselves. */}
        {goals ? (
          <>
            <Subhead>Goals</Subhead>
            <Rows rows={goalRows} />
          </>
        ) : null}

        <Subhead>Website</Subhead>
        <Rows rows={websiteRows} />

        <Subhead>Domain and email</Subhead>
        <Rows rows={domainRows} />

        <Subhead>Profiles online</Subhead>
        {profileRows.length ? <Rows rows={profileRows} /> : <p className="text-[12.5px] text-[#64748b]">No links to their profiles yet. Each account is on the onboarding page.</p>}

        <Subhead>Logo</Subhead>
        <Rows rows={logoRows} />
        {logoUploads.length ? (
          <div className="mt-3.5">
            <Uploads groups={logoUploads} />
          </div>
        ) : null}
      </Section>

      <Section icon={DollarSign} title="Services and pricing" sub="The services the client agreed to, with their quantities and prices." editHref={editHref && `${editHref}?section=3`} {...part("Services and pricing")} tint="amber" chips={chipsOf([...services.map((plan) => plan.name), ...unpriced])} badge={{ label: `${money(monthly)}/mo`, tone: "money" }}>
        {services.map((plan) => (
          <div key={plan.name} className="mb-3 rounded-xl border border-[#bbf7d0] bg-[#f4fbf6] p-3.5 text-[12.5px] last:mb-0">
            <div className="flex items-baseline justify-between gap-3 text-[13.5px] font-semibold text-[#14532d]">
              <span>
                {plan.name}
                {plan.custom ? <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-[#15803d]">Custom</span> : null}
              </span>
              <span className="tabular-nums whitespace-nowrap">{plan.custom ? `${money(onceOf(plan))} one-time` : `${money(plan.monthly)}/mo`}</span>
            </div>
            {plan.addedAt || (plan.custom && (plan.deadline || plan.duration)) ? (
              <div className="mt-1 text-[12px] leading-normal text-[#3f6212]">
                {[plan.addedAt ? `Added ${formatDate(plan.addedAt)}` : "", plan.custom && plan.deadline ? `Due ${day(plan.deadline)}` : "", plan.custom && plan.duration ? `Takes ${plan.duration}` : ""].filter(Boolean).join(" · ")}
              </div>
            ) : null}
            {plan.custom ? (
              plan.included.length ? (
                <div className="mt-1.5 text-[12px] leading-normal text-[#3f6212]">
                  <b className="font-semibold text-[#15803d]">Included:</b> {listed(plan.included)}
                </div>
              ) : null
            ) : (
              <>
                <div className="mt-1 text-[12px] leading-normal text-[#3f6212]">{plan.fields.map((field) => `${field.label}: ${fieldValue(plan.name, field.label, field.value)}`).join(" · ")}</div>
                <div className="mt-1.5 text-[12px] leading-normal text-[#3f6212]">
                  <b className="font-semibold text-[#15803d]">Included:</b> {listed(plan.included) ?? "Nothing ticked"}
                </div>
              </>
            )}
            {plan.addons.length ? (
              <div className="mt-1 text-[12px] leading-normal text-[#3f6212]">
                <b className="font-semibold text-[#15803d]">Add-on rates (not billed now):</b> {plan.addons.map((addon) => `${addon.label} ${money(addon.price)}`).join(" · ")}
              </div>
            ) : null}
          </div>
        ))}
        {unpriced.length ? (
          <div className="rounded-xl border border-[#fecaca] bg-[#fff7f7] p-3.5 text-[12.5px]">
            <b className="text-[13.5px] font-semibold text-[#b91c1c]">{unpriced.join(", ")}</b>
            <div className={`${dashPendingSub} mt-1`}>No quantities or prices were recorded for {unpriced.length === 1 ? "this service" : "these services"}.</div>
          </div>
        ) : null}
        {services.length || unpriced.length ? null : <div className="rounded-xl border border-[#fecaca] bg-[#fff7f7] p-3.5 text-[13px] font-medium text-[#b91c1c]">No services yet.</div>}
        {finished.length ? (
          <div className="mt-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 text-[12.5px]">
            <div className="flex items-baseline justify-between gap-3">
              <b className="text-[13.5px] font-semibold text-[#334155]">Completed · history</b>
              <span className="text-[11.5px] text-[#64748b]">Not billed or counted</span>
            </div>
            <ul className="mt-2 flex list-none flex-col divide-y divide-[#e2e8f0]">
              {finished.map((plan) => (
                <li key={plan.name} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 text-[#334155]">
                    <span className="font-semibold">{plan.name}</span>
                    <span className="text-[#64748b]">
                      {plan.addedAt ? ` · Added ${formatDate(plan.addedAt)}` : ""}
                      {plan.doneAt ? ` · Done ${formatDate(plan.doneAt)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[#64748b] tabular-nums">{plan.custom ? `${money(onceOf(plan))} one-time` : `${money(plan.monthly)}/mo`}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {openRequests.length ? (
          <div className="mt-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3.5 text-[12.5px]">
            <b className="text-[13.5px] font-semibold text-[#92400e]">Requested by the client</b>
            <ul className="mt-1.5 flex list-none flex-col gap-1">
              {openRequests.map((request) => (
                  <li key={request._id} className="text-[#78350f]">
                    <span className="font-semibold">{request.name}</span> · {formatDate(request.requestedAt)}
                    {request.note ? ` · ${request.note}` : ""}
                  </li>
                ))}
            </ul>
            {editHref ? <div className={`${dashPendingSub} mt-1.5`}>Add them as custom services on Edit → Services and pricing.</div> : null}
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-[#86efac] bg-[#dcfce7] px-4 py-3 text-[12.5px] text-[#14532d]">
          <div className="flex items-baseline justify-between gap-3">
            <span>Monthly total</span>
            <b className="text-[16px] font-semibold tabular-nums">{money(monthly)}</b>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-[#bbf7d0] pt-1.5 text-[#3f6212]">
            <span>One-time fees</span>
            <span className="tabular-nums">{money(oneTime)}</span>
          </div>
        </div>
      </Section>

      {/* It has a page of its own (clients/[slug]/onboarding): clicking it goes there. */}
      <Section
        icon={ClipboardList}
        title="Onboarding and transfer"
        sub="What the client already has, what they need, and what we are taking over."
        {...part("Onboarding and transfer")}
        href={`/clients/${client._id}/onboarding`}
        tint="violet"
        chips={onboardingChips}
        badge={{ label: `${approvedCount} / ${askedCount} approved`, tone: approvedCount === askedCount ? "done" : "pending" }}
      />

      <Section icon={Lock} title="Account setup" sub="Contract, billing, who looks after the client and what their portal shows." editHref={editHref && `${editHref}?section=5`} {...part("Account setup")} tint="slate" chips={chipsOf([client.startDate ? formatDate(client.startDate) : undefined, contractRows[1]?.value, day(contract?.endDate), contract?.renewal])} badge={filledOf([...contractRows, ...billingRows, ...accountRows])}>
        <Subhead first>Contract</Subhead>
        <Rows rows={contractRows} />

        <Subhead>Billing</Subhead>
        <Rows rows={billingRows} />

        <Subhead>Account</Subhead>
        <Rows rows={accountRows} />
      </Section>
    </>
  );
};

// The onboarding and transfer part in full, on its own page (clients/[slug]/onboarding): what the
// team recorded about the transfer, what the client answered on their onboarding form, and the
// files they uploaded. Without `answers`, only what the team recorded — for the onboarding review
// (OnboardingReview.tsx), which shows the answers, and their files, item by item.
export const OnboardingTransfer = ({ client, answers = true }: { client: Client; answers?: boolean }) => {
  const transfer = client.details?.transfer;
  const has = transfer?.has ?? [];
  // How far a transfer has got, and which of its steps are done.
  const checklist = (all: string[], done: string[] = []) => `${done.length} of ${all.length} done${done.length ? ` — ${done.join(", ")}` : ""}`;
  const metaAds = client.onboarding?.social?.metaAds;
  const metaAdsRow: Row | undefined = metaAds?.has
    ? {
        icon: Link2,
        label: "Meta Ads (Facebook / Instagram)",
        value: metaAds.has === "yes" ? "Has an account" : metaAds.wantsCreated ? "Create the account" : metaAds.has === "unsure" ? "Check whether one exists" : "Doesn't have one",
        tone: metaAds.has === "yes" ? "ready" : metaAds.wantsCreated ? "create" : metaAds.has === "unsure" ? "followup" : "none",
        note: metaAds.link ? `Link or name: ${metaAds.link}` : undefined,
      }
    : undefined;
  // What the client answered on the onboarding form, by the form's own steps — once they have
  // answered any of it.
  const [site, domains, mail, brand, google, social, media] = groupsOf({ onboarding: client.onboarding ?? { status: "in_progress" } });
  const answeredAny = answers && [site, domains, mail, brand, google, social, media].some((group) => group.items.some(isAnswered));
  const uploads = answers ? uploadsOf(client.onboarding) : [];

  return (
    <>
      {answeredAny ? <Subhead first>Recorded by the team</Subhead> : null}
      <Rows
        rows={[
          { icon: Check, label: "Client has", value: listed(CLIENT_HAS.filter(([key]) => has.includes(key)).map(([, label]) => label)), wide: true },
          { icon: Plus, label: "Client needs", value: listed(transfer?.needs), wide: true },
          ...(has.includes("website") ? [{ icon: Globe, label: "Website transfer", value: checklist(WEBSITE_TRANSFER, transfer?.websiteDone), wide: true }] : []),
          ...(has.includes("social") ? [{ icon: Users, label: "Social media transfer", value: checklist(SOCIAL_TRANSFER, transfer?.socialDone), wide: true }] : []),
        ]}
      />
      {answeredAny ? (
        <>
          <Subhead>Website, domain and brand — from the client</Subhead>
          <Rows rows={[...site.items, ...domains.items, ...mail.items, ...brand.items].map((item) => answerRow(item, Globe))} />
          <Subhead>Google accounts — from the client</Subhead>
          <Rows rows={google.items.map((item) => answerRow(item, MapPin))} />
          <Subhead>Social media — from the client</Subhead>
          <Rows rows={[...social.items.map((item) => answerRow(item, Link2)), ...(metaAdsRow ? [metaAdsRow] : [])]} />
          <Subhead>Photos and videos — from the client</Subhead>
          <Rows rows={media.items.map((item) => answerRow(item, Camera))} />
        </>
      ) : null}
      {uploads.length ? (
        <>
          <Subhead>Files the client uploaded</Subhead>
          <Uploads groups={uploads} />
        </>
      ) : null}
    </>
  );
};

// ── What the client answered (the onboarding form) ───────────────────────────

const pill = "inline-flex shrink-0 items-center whitespace-nowrap rounded-xl px-2.5 py-0.75 text-[11px] font-bold";

// Fields and what is in them — "None", greyed, where there is nothing. A web address opens in
// a new tab.
const Fields = ({ rows }: { rows: [label: string, value: string][] }) => (
  <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
    {rows.map(([label, value]) => {
      const link = linkOf(value);
      const missing = value === NONE;
      return (
        <div key={label} className={`rounded-lg border px-3 py-2.5 text-[12px] ${missing ? "border-[#fecaca] bg-[#fff7f7]" : "border-[#bbf7d0] bg-[#f4fbf6]"}`}>
          <dt className={`mb-1 font-semibold ${missing ? "text-[#b45309]" : "text-[#15803d]"}`}>{label}</dt>
          <dd className={`whitespace-pre-line break-words ${missing ? "text-[#b91c1c]" : "text-[#14532d]"}`}>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-[#2563eb] hover:underline">
                <span className="truncate">{link}</span>
                <ArrowUpRight size={12} strokeWidth={2.25} className="shrink-0" />
              </a>
            ) : (
              value
            )}
          </dd>
        </div>
      );
    })}
  </dl>
);

// One thing the client was asked about, in a box of its own: where it stands for the team,
// and all of its fields.
const ItemBox = ({ item }: { item: Item }) => (
  <div className={`rounded-xl border p-4 ${item.tone === "ready" ? "border-[#bbf7d0] bg-[#f4fbf6]" : item.tone === "none" ? "border-[#fecaca] bg-[#fff7f7]" : "border-[#fde68a] bg-[#fffbeb]"}`}>
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-current/10 pb-2.5">
      <span className="text-[13px] font-bold text-[#17242f]">{item.name}</span>
      <span className={`${pill} ${TONES[item.tone].className}`}>{item.label}</span>
    </div>
    <Fields rows={item.details} />
  </div>
);

// The onboarding form's answers, a tab for each step of the form in the order it asks them —
// Website, Domain and hosting, Business email and so on — one step on show at a time. Every
// field is listed with what the client put in it, and "None" where they put nothing, so a
// client who never went through onboarding shows every field as "None". Each tab says how many
// of its items were answered. `first` is a tab to put ahead of the form's own.
const OnboardingAnswerTabs = ({ onboarding, first }: { onboarding?: OnboardingAnswers; first?: { title: string; content: ReactNode } }) => {
  const tabs: { title: string; items?: Item[]; content?: ReactNode }[] = [
    ...(first ? [first] : []),
    ...groupsOf({ onboarding: onboarding ?? { status: "in_progress" } }),
  ];
  const [chosen, setChosen] = useState(0);
  const active = Math.min(chosen, tabs.length - 1);
  const tab = tabs[active];

  return (
    <div>
      <div role="tablist" aria-label="Onboarding answers" className="flex gap-1.5 overflow-x-auto rounded-lg border border-[#dbe3de] bg-white p-1">
        {tabs.map((entry, index) => {
          const on = index === active;
          return (
            <button
              key={entry.title}
              type="button"
              role="tab"
              id={`onboarding-tab-${index}`}
              aria-selected={on}
              aria-controls="onboarding-tab-panel"
              onClick={() => setChosen(index)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-1.75 text-[12.5px] font-semibold transition-colors ${
                on ? "bg-[#2563eb] text-white" : "text-[#64748b] hover:bg-[#f1f5f3] hover:text-[#17242f]"
              }`}
            >
              <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold ${on ? "bg-white/20 text-white" : "bg-[#eef1ef] text-[#64748b]"}`}>
                {index + 1}
              </span>
              {entry.title}
              {entry.items ? (
                <span className={`rounded-full px-1.5 text-[10.5px] font-bold ${on ? "bg-white/20 text-white" : "bg-[#eef1ef] text-[#7a8e9b]"}`}>
                  {entry.items.filter(isAnswered).length}/{entry.items.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section role="tabpanel" id="onboarding-tab-panel" aria-labelledby={`onboarding-tab-${active}`} className={`${sectionCard} mt-3.5`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={sectionTitle}>{tab.title}</h2>
          <span className="text-[11.5px] text-[#7a8e9b]">
            Step {active + 1} of {tabs.length}
          </span>
        </div>
        {tab.items ? (
          <div className={`grid items-start gap-4 ${tab.items.length > 1 ? "min-[1000px]:grid-cols-2" : ""}`}>
            {tab.items.map((item) => (
              <ItemBox item={item} key={item.id} />
            ))}
          </div>
        ) : (
          tab.content
        )}
      </section>
    </div>
  );
};

// ── A client's page ──────────────────────────────────────────────────────────

// Deleting a client affects their portal account too, so the destructive action lives in a
// dedicated dialog instead of expanding the page header in place.
const DeleteClientButton = ({ clientId, name, className = btnDangerOutline }: { clientId: string; name: string; className?: string }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isPending]);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete client.");
        return;
      }
      toast.success("Client deleted successfully");
      router.push("/clients");
    });
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <Trash2 size={13} strokeWidth={2} /> Delete
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPending) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-client-title"
            aria-describedby="delete-client-description"
            className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.24)]"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
                <AlertTriangle size={20} strokeWidth={2} />
              </span>
              <button
                type="button"
                aria-label="Close delete confirmation"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="-mt-1 -mr-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] disabled:cursor-wait"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>
            <h2 id="delete-client-title" className="mt-4 text-[18px] font-semibold tracking-[-0.01em] text-[#0f172a]">
              Delete {name}?
            </h2>
            <p id="delete-client-description" className="mt-2 text-[13px] leading-6 text-[#64748b]">
              This permanently removes the client record and its portal login. This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={`${btnDraft} justify-center`} disabled={isPending} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className={`${btnDanger} justify-center`} disabled={isPending} aria-busy={isPending} onClick={handleDelete}>
                {isPending ? (
                  <>
                    <Loader2 size={13} strokeWidth={2.5} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} strokeWidth={2.25} /> Delete client
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
};

// What each status means for the client, said under its name in the status menu. Pausing or
// closing a client also switches off its portal logins (the backend does that).
const STATUS_NOTES: Record<ClientStatus, { dot: string; note: string }> = {
  onboarding: { dot: "#7c3aed", note: "New — filling in onboarding, portal login on" },
  active: { dot: "#16a34a", note: "Working with us — portal login on" },
  pending: { dot: "#d97706", note: "Not started yet" },
  on_hold: { dot: "#3457c9", note: "Paused — portal login off" },
  closed: { dot: "#94a3b8", note: "No longer a client — portal login off" },
};

// The client's status as a pill that opens a menu: pick another status and it is saved there
// and then, without a trip to the edit page.
const StatusPicker = ({ clientId, name, status }: { clientId: string; name: string; status: ClientStatus }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // A click anywhere else, or Escape, closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: ClientStatus) => {
    setOpen(false);
    if (next === status) return;
    startTransition(async () => {
      const result = await updateClientAction(clientId, { status: next });
      if (!result.ok) {
        toast.error([result.error, ...(result.fieldErrors ?? [])].filter(Boolean).join(" — ") || "Couldn't change the status.");
        return;
      }
      toast.success(`${name} is now ${statusLabel(next)}`);
      router.refresh();
    });
  };

  return (
    <div ref={menuRef} className={`relative inline-block ${open ? "z-50" : ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${statusLabel(status)}. Change status`}
        disabled={isPending}
        onClick={() => setOpen((shown) => !shown)}
        className={`${statusClassName(status)} cursor-pointer ring-1 ring-black/5 transition-shadow hover:shadow-[0_1px_4px_rgba(11,21,34,0.15)] disabled:cursor-wait`}
      >
        {isPending ? <Loader2 size={11} strokeWidth={2.5} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_NOTES[status].dot }} />}
        {statusLabel(status)}
        <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="listbox" aria-label="Change status" className="absolute top-full left-0 z-50 mt-1.5 w-64 rounded-[10px] border border-[#dbe3de] bg-white p-1.5 shadow-[0_12px_32px_rgba(11,21,34,0.16)]">
          <div className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3] uppercase">Change status</div>
          {CLIENT_STATUS_OPTIONS.map((option) => {
            const current = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={current}
                onClick={() => choose(option.value)}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-[#f4f7f5] ${current ? "bg-[#f7f9f8]" : ""}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_NOTES[option.value].dot }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold text-[#17242f]">{option.label}</span>
                  <span className="block text-[11px] text-[#7a8e9b]">{STATUS_NOTES[option.value].note}</span>
                </span>
                {current ? <Check size={14} strokeWidth={2.5} className="shrink-0 text-[#2563eb]" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const TABS = ["Overview", "Reports", "Content", "Meetings", "Messages", "Payments"];

const LOGIN_STATUS_LABEL: Record<ClientLogin["status"], string> = {
  pending: "Pending",
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
};

// The portal password, hidden behind dots until the eye is clicked, with a button to copy it.
// The portal password: the eye opens it behind the security code (PasswordEye).
const PasswordValue = ({ clientId }: { clientId: string }) => (
  <b className="flex min-w-0 items-center">
    <PasswordEye label="Portal password" load={() => getClientPortalPasswordAction(clientId)} />
  </b>
);

// `comments` are those on the client's onboarding form, when they could be loaded.
const ClientDetails = ({
  client,
  canManage,
  canDelete,
  comments,
}: {
  client: Client;
  canManage: boolean;
  canDelete: boolean;
  comments?: OnboardingComment[];
}) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  // The client asked for a service while this page is open: it shows under their services at once.
  const router = useRouter();
  useRealtime<{ type?: string; client?: string }>("notifications:new", (news) => {
    if (news?.type === "service_requested" && news.client === client._id) router.refresh();
  });

  const login = client.user && typeof client.user === "object" ? client.user : undefined;
  const manager = staffName(client.accountManager);
  const team = client.team.map((member) => staffName(member)).filter(Boolean) as string[];

  return (
    <>
      <section className="relative rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-white via-white to-[#f8fbff] px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6">
        <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-[#dbeafe]/45 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div
            className="flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl text-[17px] font-bold text-white shadow-[0_5px_14px_rgba(15,23,42,0.15)]"
            style={{ background: avatarColorFor(client._id) }}
          >
            {initialsOf(client.companyName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-[24px] font-semibold tracking-[-0.025em] text-[#0f172a]">{client.companyName}</h1>
              {/* Those who manage clients change the status right here; everyone else just sees it. */}
              {canManage ? (
                <StatusPicker clientId={client._id} name={client.companyName} status={client.status} />
              ) : (
                <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
              )}
            </div>
            <div className="mt-1 text-[13px] text-[#64748b]">
              {[client.contactName, client.serviceTypes.join(", ")].filter(Boolean).join(" · ")}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-[#64748b]">
              {client.address ? (
                <span className={iconText}>
                  <MapPin size={12} strokeWidth={2} /> {client.address}
                </span>
              ) : null}
              <span className={iconText}>
                <Mail size={12} strokeWidth={2} /> {client.email}
              </span>
              {client.phone ? (
                <span className={iconText}>
                  <Phone size={12} strokeWidth={2} /> {client.phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <button className={headerAction} type="button">
              <MessageSquare size={13} strokeWidth={2} /> Message
            </button>
            {canManage ? (
              <Link href={`/clients/${client._id}/edit`} className={headerAction}>
                <Pencil size={13} strokeWidth={2} /> Edit Client
              </Link>
            ) : null}
            {/* Both open with this client already picked. */}
            <Link href={`/content/add?client=${client._id}`} className={headerPrimaryAction}>
              <Plus size={13} strokeWidth={2.5} /> Add New Content
            </Link>
            <Link href={`/monthly-reports/add?client=${client._id}`} className={headerPrimaryAction}>
              <Plus size={13} strokeWidth={2.5} /> Add New Report
            </Link>
            {canDelete ? <DeleteClientButton clientId={client._id} name={client.companyName} className={headerDangerAction} /> : null}
          </div>
        </div>
        </div>
      </section>

      <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={tab === activeTab}
            className={`cursor-pointer whitespace-nowrap rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
              tab === activeTab ? "bg-[#eff6ff] text-[#1d4ed8]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== "Overview" ? (
        <div className={sectionCard}>
          <div className="px-5 py-12 text-center text-[13px] text-[#657787]">
            <b>{activeTab}</b> for this client will appear here once that module is connected.
          </div>
        </div>
      ) : (
        // Laid out as the add/edit form is: its five parts down the page, and beside them — staying
        // in view as the page scrolls — what the form doesn't hold.
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[1100px]:grid-cols-1">
          <div className="flex min-w-0 flex-col gap-5">
            <RecordSections client={client} editHref={canManage ? `/clients/${client._id}/edit` : undefined} manager={manager} team={team} />
          </div>

          <aside className="sticky top-5 flex flex-col gap-4 max-[1100px]:static">
            {login ? (
              <div className={sectionCard}>
                <div className={sectionHeader}>
                  <span className={sectionTitle}>Portal Access</span>
                </div>
                <div className={infoTable}>
                  <div>
                    <span>Sign-in email</span>
                    <Value>{login.email}</Value>
                  </div>
                  {canManage ? (
                    <div>
                      <span>Password</span>
                      {client.hasPortalPassword ? <PasswordValue clientId={client._id} /> : <b className="font-medium! text-[#a3b1ba]!">Not saved — set a new one to see it</b>}
                    </div>
                  ) : null}
                  <div>
                    <span>Access status</span>
                    <Value>{LOGIN_STATUS_LABEL[login.status]}</Value>
                  </div>
                  <div>
                    <span>Last sign-in</span>
                    <Value>{login.lastLoginAt ? formatDateTime(login.lastLoginAt) : "Not signed in yet"}</Value>
                  </div>
                </div>
              </div>
            ) : null}

            {client.onboarding?.status ? (
              <div className={sectionCard}>
                <div className={sectionHeader}>
                  <span className={sectionTitle}>Onboarding</span>
                </div>
                <div className={infoTable}>
                  <div>
                    <span>Status</span>
                    <Value>{ONBOARDING_STATUS_LABELS[client.onboarding.status]}</Value>
                  </div>
                  {client.onboarding.submittedAt ? (
                    <div>
                      <span>Submitted</span>
                      <Value>{formatDate(client.onboarding.submittedAt)}</Value>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Comments on the client's onboarding form: only a client with a portal login can see them. */}
            {client.onboarding?.status && client.user && comments ? <OnboardingComments clientId={client._id} initial={comments} /> : null}
          </aside>
        </div>
      )}
    </>
  );
};

// ── An onboarding request's page ─────────────────────────────────────────────

// The "About them" tab: who they are, then everything they said about their business and their
// goals — on the onboarding form's first step, and in the steps right after signing up — and
// whether they booked the kickoff call. A field they left empty shows as "None".
const AboutThem = ({ request }: { request: OnboardingRequest }) => {
  const { business, goals, kickoffCall } = request.onboarding;
  const metaAds = request.onboarding.social?.metaAds;
  const or =(value: string | undefined) => (value?.trim() ? value : NONE);
  const head = "mt-5 mb-2.5 border-t border-[#eef3ef] pt-4 text-[12px] font-bold tracking-[0.04em] text-[#17242f] uppercase";
  return (
    <>
      <Fields
        rows={[
          ["Name", or(request.contactName)],
          ["Company", or(request.companyName)],
          ["Email", or(request.email)],
          ["Phone", or(request.phone)],
        ]}
      />
      <div className={head}>Their business</div>
      <Fields
        rows={[
          ["About the business", or(business?.description)],
          ["Services they offer", or(business?.services?.join(", "))],
          ["Areas they serve", or(business?.areas?.join(", "))],
          ["Main contact", or([business?.contact?.name, business?.contact?.email, business?.contact?.phone].filter(Boolean).join(" · "))],
          ["Best way to reach them", or(REACH_BY[business?.contact?.reachBy ?? ""])],
        ]}
      />
      <div className={head}>Goals</div>
      <Fields
        rows={[
          ["Revenue per month", or(targetOf(goals?.revenue, money))],
          ["Leads per month", or(targetOf(goals?.leads, String))],
          ["New clients per month", or(targetOf(goals?.newClients, String))],
          ["How soon", or(GOAL_TIMEFRAMES[goals?.timeframe ?? ""])],
          ["Monthly marketing budget", or(GOAL_BUDGETS[goals?.budget ?? ""])],
          ["Cost of one lead today", goals?.costPerLead === undefined ? NONE : money(goals.costPerLead)],
          ["Worth of one new client", goals?.clientValue === undefined ? NONE : money(goals.clientValue)],
          ["Where leads come from", or(goals?.leadSources?.map((source) => LEAD_SOURCES[source] ?? source).join(", "))],
        ]}
      />
      <div className={head}>Also asked at sign-up</div>
      <Fields
        rows={[
          ["Kickoff call booked", kickoffCall ? (kickoffCall.booked ? "Yes (the client says so)" : "Not yet") : NONE],
          [
            "Meta Ads account",
            metaAds?.has
              ? [metaAds.has === "yes" ? "Has one" : metaAds.wantsCreated ? "Wants us to create it" : metaAds.has === "unsure" ? "Not sure" : "Doesn't have one", metaAds.link]
                  .filter(Boolean)
                  .join(" — ")
              : NONE,
          ],
        ]}
      />
    </>
  );
};

// An onboarding request in full: who sent it, how much they answered, and then a tab for
// each step of the form — where each thing stands for the team, and every field with what the
// client put in it. A field they left empty still shows, as "None".
// `canOpenClient` is for those who can open the client record it made (admins: the client has
// no account manager or team yet, so nobody else can see it there).
export const OnboardingRequestDetails = ({ request, canOpenClient }: { request: OnboardingRequest; canOpenClient: boolean }) => {
  const { onboarding } = request;
  const groups = groupsOf(request);
  const counts = countsOf(groups);
  const takenOn = request.status !== "pending";

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/clients" className={breadcrumbLink}>
            Clients
          </Link>{" "}
          / Onboarding request / <b>{request.companyName}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[10px] border border-[#dbe3de] bg-white px-5.5 py-5">
        <div className="flex min-w-0 gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] text-[18px] font-bold text-white"
            style={{ background: avatarColorFor(request._id) }}
          >
            {initialsOf(request.companyName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="font-[Georgia,serif] text-[22px] font-bold text-[#0b1a26]">{request.companyName}</div>
              <span className={`${pill} ${ONBOARDING_STATUS_COLORS[onboarding.status]}`}>{ONBOARDING_STATUS_LABELS[onboarding.status]}</span>
            </div>
            <div className="mt-0.5 text-[13px] text-[#657787]">{request.contactName}</div>
            <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-[#556977]">
              <a href={`mailto:${request.email}`} className={`${iconText} text-inherit hover:text-[#2563eb]`}>
                <Mail size={13} strokeWidth={2} /> {request.email}
              </a>
              {request.phone ? (
                <span className={iconText}>
                  <Phone size={13} strokeWidth={2} /> {request.phone}
                </span>
              ) : null}
              <span className={iconText}>
                <Calendar size={13} strokeWidth={2} />
                {onboarding.status === "submitted" ? `Submitted ${formatDate(onboarding.submittedAt)}` : `Started ${formatDate(request.createdAt)} · last saved ${formatDate(request.updatedAt)}`}
              </span>
            </div>
          </div>
        </div>

        {canOpenClient ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/clients/${request._id}`} className={`${btnDraft} ${iconText}`}>
              Open client record <ArrowUpRight size={13} strokeWidth={2} />
            </Link>
            <Link href={`/clients/${request._id}/edit`} className={`${btnDraft} ${iconText}`}>
              <Pencil size={13} strokeWidth={2} /> Edit client
            </Link>
          </div>
        ) : null}
      </div>

      {takenOn ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#cfe9d6] bg-[#f0faf3] px-4 py-2.75 text-[12.5px] text-[#14532d]">
          This client has already been taken on <span className={statusClassName(request.status)}>{statusLabel(request.status)}</span> — their answers stay here to work from.
        </div>
      ) : onboarding.status === "in_progress" ? (
        <div className="rounded-lg border border-[#f1dfbf] bg-[#fdf6ea] px-4 py-2.75 text-[12.5px] text-[#7a4b0f]">
          They haven&apos;t handed this in yet — what you see is what they have saved so far, and it can still change.
        </div>
      ) : null}

      {/* The request at a glance: how much was answered, and what kind of work it adds up to. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] border border-[#dbe3de] bg-white px-5 py-3.5">
        <span className="text-[12.5px] text-[#657787]">
          <b className="text-[15px] font-bold text-[#0d1e2c]">{counts.answered}</b> of {counts.total} answered
        </span>
        {TONE_ORDER.map((tone) => (
          <span key={tone} className="inline-flex items-center gap-2 text-[12.5px] text-[#556977]">
            <span className="h-2 w-2 rounded-full" style={{ background: TONES[tone].dot }} />
            <b className="font-bold text-[#17242f]">{counts.byTone[tone]}</b> {TONES[tone].label.toLowerCase()}
          </span>
        ))}
      </div>

      <OnboardingAnswerTabs
        onboarding={onboarding}
        first={{
          title: "About them",
          content: <AboutThem request={request} />,
        }}
      />
    </>
  );
};

export default ClientDetails;
