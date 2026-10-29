"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Trash2,
  Upload as UploadIcon,
  ExternalLink,
  FileImage,
  FileVideo,
  Building2,
  Calendar,
  Code,
  DollarSign,
  FileText,
  FolderOpen,
  KeyRound,
  Layers,
  MessageCircle,
  Phone,
  ShieldCheck,
  Target,
  Upload,
  Briefcase,
  Camera,
  ChartBar,
  Check,
  ChevronDown,
  CircleCheck,
  Clapperboard,
  Clock,
  EyeOff,
  Globe,
  Hourglass,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutList,
  LifeBuoy,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Music2,
  Palette,
  SearchCheck,
  Server,
  SquarePlay,
  Tags,
  ThumbsUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getClientAction, updateClientAction, type Client } from "@/app/actions/clients";
import { PasswordEye } from "@/component/shared/PasswordModal";
import { listOnboardingCommentsAction, removeClientOnboardingFileAction, revealOnboardingPasswordAction, updateClientOnboardingAction, type OnboardingAnswers, type OnboardingComment, type OnboardingFile } from "@/app/actions/onboarding";
import { answersFrom, fieldsOf as editFieldsOf, valueOf, type FieldDef } from "./onboardingFields";
import { formatFileSize } from "@/component/projects/projectUi";
import OnboardingComments from "./OnboardingComments";
import ItemComments from "./ItemComments";
import StepTicks from "./StepTicks";
import { useRealtime, useRefreshing } from "@/lib/realtime";
import { NONE } from "./clientUi";
import { DEFAULT_NOT_NEEDED, KIND_LABELS, stepsOf, tickedIn, ticksOf, type Entry, type Step, type Ticks } from "./OnboardingControls";

// A client's onboarding, item by item, for the team to review (clients/[slug]/onboarding): how
// much is approved, what needs the team, what is waiting on the client — and, for those who
// manage clients, approving an item, taking it off the client's form or putting it back, each
// saved at once. The items and what the client gave for them are the same as the client form's
// "Credentials & onboarding" (OnboardingControls → stepsOf); under each step, what the client
// asked about it, with the team's replies.

// Where an item — and a step — stands: the same three the client sees beside their own form
// (client-portal: OnboardingProcess → STEP_DOTS), in the same colors. Approved: the team checked
// it. Submitted: the client gave it (or asked us to do it), and it waits on the team. Todo: the
// client still owes it. And, for the team only, what the client isn't asked.
type Standing = "approved" | "submitted" | "todo" | "none";
const META: Record<Standing, { label: string; pill: string; dot: string; bar: string }> = {
  approved: { label: "Approved", pill: "bg-[#dcfce7] text-[#15803d]", dot: "bg-[#16A34A] text-white", bar: "#16A34A" },
  submitted: { label: "Submitted", pill: "bg-[#e8eefe] text-[#2F5FD8]", dot: "bg-[#2F5FD8] text-white", bar: "#2F5FD8" },
  todo: { label: "Todo", pill: "bg-[#FEF3C7] text-[#B45309]", dot: "bg-[#FEF3C7] text-[#B45309] ring-1 ring-[#D97706] ring-inset", bar: "#F59E0B" },
  none: { label: "Not needed", pill: "bg-[#f3f4f6] text-[#6b7280]", dot: "bg-[#f3f4f6] text-[#6b7280]", bar: "#d1d5db" },
};
// What needs the team first, in a step.
const ORDER: Record<Standing, number> = { submitted: 0, todo: 1, approved: 2, none: 3 };

// What each item and step is, at a glance. An item's id is its own ("hosting"), or its step's and
// its own ("google.ads").
const ITEM_ICONS: Record<string, LucideIcon> = {
  contact: User,
  website: Globe,
  domain: Link2,
  hosting: Server,
  cms: LayoutDashboard,
  email: Mail,
  logo: Palette,
  "google.businessProfile": MapPin,
  "google.analytics": ChartBar,
  "google.searchConsole": SearchCheck,
  "google.tagManager": Tags,
  "google.ads": Megaphone,
  "social.facebook": ThumbsUp,
  "social.instagram": Camera,
  "social.youtube": SquarePlay,
  "social.linkedin": Briefcase,
  "social.tiktok": Music2,
  "social.email": Mail,
  "media.professionalPhotos": Camera,
  "media.businessPhotos": Images,
  "media.videos": Clapperboard,
};
const STEP_ICONS: Record<string, LucideIcon> = {
  "step:contact": User,
  "step:web": Globe,
  "step:domain": Server,
  "step:email": Mail,
  "step:logo": Palette,
  "step:google": MapPin,
  "step:social": Users,
  "step:media": Camera,
};
// Each state's icon, and the tint of an item's icon in it.
const STATE_ICONS: Record<Standing, LucideIcon> = { approved: CircleCheck, submitted: Inbox, todo: Clock, none: EyeOff };
const TILE: Record<Standing, string> = {
  approved: "bg-[#dcfce7] text-[#15803d]",
  submitted: "bg-[#e8eefe] text-[#2F5FD8]",
  todo: "bg-[#FEF3C7] text-[#B45309]",
  none: "bg-[#f3f4f6] text-[#9ca3af]",
};

// The icon beside a field of what the client gave, by its label, each in a color of its own.
const FIELD_ICONS: [RegExp, LucideIcon, string][] = [
  [/^name$|main contact|contact name/i, User, "bg-[#e0e7ff] text-[#4338ca]"],
  [/company|business type/i, Building2, "bg-[#e0f2fe] text-[#0369a1]"],
  [/phone/i, Phone, "bg-[#dcfce7] text-[#15803d]"],
  [/e-?mail/i, Mail, "bg-[#fce7f3] text-[#be185d]"],
  [/about the business|description|details|note/i, FileText, "bg-[#f1f5f9] text-[#475569]"],
  [/services|offer|features|pages/i, Layers, "bg-[#ede9fe] text-[#6d28d9]"],
  [/areas|serve|location|address/i, MapPin, "bg-[#ffe4e6] text-[#be123c]"],
  [/reach|communicat/i, MessageCircle, "bg-[#ccfbf1] text-[#0f766e]"],
  [/kickoff|call|date|when|how soon/i, Calendar, "bg-[#ffedd5] text-[#c2410c]"],
  [/revenue|budget|cost|worth|price|fee/i, DollarSign, "bg-[#dcfce7] text-[#166534]"],
  [/leads|clients per|goal/i, Target, "bg-[#fee2e2] text-[#b91c1c]"],
  [/password|username|login/i, KeyRound, "bg-[#fef9c3] text-[#a16207]"],
  [/access|invite/i, ShieldCheck, "bg-[#d1fae5] text-[#047857]"],
  [/upload|files/i, Upload, "bg-[#e0f2fe] text-[#0284c7]"],
  [/folder|shared/i, FolderOpen, "bg-[#fef3c7] text-[#b45309]"],
  [/link|website|url|domain|example/i, Link2, "bg-[#dbeafe] text-[#1d4ed8]"],
  [/built with|developer|platform|hosted/i, Code, "bg-[#f3e8ff] text-[#7e22ce]"],
  [/logo|style|colou?r|font/i, Palette, "bg-[#fae8ff] text-[#a21caf]"],
];
const fieldIconOf = (label: string): [LucideIcon, string] => {
  const found = FIELD_ICONS.find(([pattern]) => pattern.test(label));
  return found ? [found[1], found[2]] : [FileText, "bg-[#f1f5f9] text-[#475569]"];
};
// A field the client left empty.
const isEmptyValue = (value: string) => !value.trim() || value === NONE || /^nothing entered yet$/i.test(value);

// ── What the client gave, made usable ─────────────────────────────────────────

// An email address or a web address (with or without https://) in what the client wrote. A
// web address never ends where an email's "@" starts.
const LINK = /([^\s@·,;()]+@[^\s@·,;()]+\.[a-z]{2,}|https?:\/\/[^\s,;]+|(?<![@\w.-])(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?![\w@-])(?:\/[^\s,;]*)?)/gi;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hrefOf = (link: string) => (/^https?:\/\//i.test(link) ? link : `https://${link}`);
const linkClass = "inline-flex max-w-full items-center gap-1 break-all text-[#2563eb] underline decoration-[#93c5fd] underline-offset-2 hover:decoration-[#2563eb]";

// A field's value with its links clickable: an email opens a message, a phone number dials it,
// and a web address opens in a new tab.
const FieldValue = ({ label, value }: { label: string; value: string }) => {
  const trimmed = value.trim();
  if (EMAIL.test(trimmed)) {
    return (
      <a href={`mailto:${trimmed}`} className={linkClass}>
        {trimmed}
      </a>
    );
  }
  if (/phone/i.test(label) && /^[+\d][\d\s().-]{5,}$/.test(trimmed)) {
    return (
      <a href={`tel:${trimmed.replace(/[^\d+]/g, "")}`} className={linkClass}>
        {trimmed}
      </a>
    );
  }
  const parts = value.split(LINK);
  if (parts.length === 1) return <>{value}</>;
  return (
    <>
      {parts.map((part, index) =>
        index % 2 && part.includes("@") ? (
          <a key={index} href={`mailto:${part}`} className={linkClass}>
            {part}
          </a>
        ) : index % 2 ? (
          <a key={index} href={hrefOf(part)} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {part}
            <ExternalLink size={11} strokeWidth={2.25} className="shrink-0" />
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
};

// The kinds of upload each item has, as the backend names them, and what each takes.
export type UploadKind = "logo" | "logoStyle" | "professionalPhotos" | "businessPhotos" | "videos";
const UPLOADS_OF: Record<string, [kind: UploadKind, title: string][]> = {
  logo: [
    ["logo", "Their logo"],
    ["logoStyle", "Style they'd like"],
  ],
  "media.professionalPhotos": [["professionalPhotos", "Photos"]],
  "media.businessPhotos": [["businessPhotos", "Photos"]],
  "media.videos": [["videos", "Videos"]],
};
const ACCEPT: Record<UploadKind, string> = {
  logo: "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
  logoStyle: "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
  professionalPhotos: "image/png,image/jpeg,image/webp,image/gif",
  businessPhotos: "image/png,image/jpeg,image/webp,image/gif",
  videos: "video/mp4,video/quicktime,video/webm",
};
export const filesOfKind = (onboarding: OnboardingAnswers | undefined, kind: UploadKind): OnboardingFile[] =>
  (kind === "logo" ? onboarding?.logo?.files : kind === "logoStyle" ? onboarding?.logo?.styleFiles : onboarding?.media?.[kind]?.files) ?? [];

// One kind of the client's files, in edit mode: each shown as it is (a picture, a video that
// plays, a link to anything else) with a way to take it off, and a button to add more.
export const FileManager = ({
  clientId,
  kind,
  title,
  files,
  onChange,
}: {
  clientId: string;
  kind: UploadKind;
  title: string;
  files: OnboardingFile[];
  onChange: (kind: UploadKind, files: OnboardingFile[]) => void;
}) => {
  const picker = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const upload = async (picked: FileList | null) => {
    if (!picked?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(picked).forEach((file) => form.append("files", file));
    try {
      const response = await fetch(`/api/onboarding/media/${clientId}/${kind}`, { method: "POST", body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.data) return void toast.error(body?.message || "Couldn't upload the files.");
      onChange(kind, body.data.files as OnboardingFile[]);
      toast.success(picked.length === 1 ? "File uploaded" : "Files uploaded");
    } catch {
      toast.error("Couldn't reach the server. Please try again.");
    } finally {
      setUploading(false);
      if (picker.current) picker.current.value = "";
    }
  };

  const remove = async (file: OnboardingFile) => {
    setRemoving(file.url);
    const result = await removeClientOnboardingFileAction(clientId, kind, file.url);
    setRemoving(null);
    if (!result.ok || !result.data) return void toast.error(result.error ?? "Couldn't remove the file.");
    onChange(kind, result.data.files);
  };

  return (
    <div className="rounded-lg border border-[#eef0f3] bg-white p-3">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[0.03em] text-[#6b7280] uppercase">
          {title} · {files.length}
        </span>
        <input ref={picker} type="file" multiple hidden accept={ACCEPT[kind]} onChange={(event) => void upload(event.target.files)} />
        <button
          type="button"
          disabled={uploading}
          onClick={() => picker.current?.click()}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-3 text-[12.5px] font-semibold text-[#374151] hover:border-[#93c5fd] hover:text-[#2563eb] disabled:cursor-wait disabled:opacity-60"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadIcon size={13} strokeWidth={2.25} />} {uploading ? "Uploading…" : files.length ? "Add more" : "Upload"}
        </button>
      </div>
      {files.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const kindOf = kindOfFile(file);
            return (
              <div key={file.url} className="group relative overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
                {kindOf === "image" ? (
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="block h-24 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.url} alt={file.name} loading="lazy" className="h-full w-full object-contain" />
                  </a>
                ) : kindOf === "video" ? (
                  <video src={file.url} controls preload="metadata" className="block h-24 w-full bg-black object-contain" />
                ) : (
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="grid h-24 place-items-center bg-[#f8fafc] text-[#4f46e5]">
                    <FileText size={26} />
                  </a>
                )}
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#1f2937]" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    disabled={removing === file.url}
                    onClick={() => void remove(file)}
                    className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-[#9ca3af] hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:cursor-wait"
                  >
                    {removing === file.url ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-[#e2e8f0] px-3 py-4 text-center text-[12px] text-[#9ca3af]">Nothing uploaded yet.</p>
      )}
    </div>
  );
};

// The team filling in or correcting an item's answers (the client's onboarding, edit mode): a
// control for each field, saved together. A password is only ever replaced by a new one.
const ItemEditor = ({ clientId, onboarding, fields, onSaved }: { clientId: string; onboarding?: OnboardingAnswers; fields: FieldDef[]; onSaved: (onboarding: OnboardingAnswers) => void }) => {
  const [values, setValues] = useState<Record<string, string | boolean>>(() => Object.fromEntries(fields.map((field) => [field.path, valueOf(onboarding, field)])));
  const [saving, setSaving] = useState(false);
  const set = (path: string, value: string | boolean) => setValues((now) => ({ ...now, [path]: value }));
  const save = async () => {
    setSaving(true);
    const result = await updateClientOnboardingAction(clientId, answersFrom(onboarding, fields, values));
    setSaving(false);
    if (!result.ok || !result.data) return void toast.error(result.error ?? "Couldn't save the answers.");
    toast.success("Saved");
    onSaved(result.data.onboarding);
  };
  const control =
    "h-9 w-full rounded-md border border-[#e5e7eb] bg-[#fafbfc] px-2.5 text-[13px] font-medium text-[#111827] outline-none placeholder:font-normal placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:bg-white focus:ring-3 focus:ring-[#2563eb]/12";
  return (
    <div className="flex flex-col gap-3.5">
      {/* Each field as the view shows it — its icon, its name — with the control under the name. */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {fields.map((field) => {
          const id = `edit-${field.path}`;
          const value = values[field.path];
          const [FieldIcon, tint] = fieldIconOf(field.label);
          const filled = field.kind === "check" ? value === true : String(value ?? "").trim() !== "";
          const card = `flex items-start gap-2.5 rounded-lg border bg-white px-3 py-2.5 transition-colors focus-within:border-[#93c5fd] ${filled ? "border-[#eef0f3]" : "border-dashed border-[#e2e8f0]"}`;
          const icon = (
            <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${tint}`}>
              <FieldIcon size={14} strokeWidth={2.1} />
            </span>
          );
          if (field.kind === "check") {
            return (
              <label key={field.path} className={`${card} cursor-pointer items-center`}>
                {icon}
                <span className="min-w-0 flex-1 text-[11px] font-semibold tracking-[0.03em] text-[#6b7280] uppercase">{field.label}</span>
                <input type="checkbox" className="size-4.5 shrink-0 cursor-pointer accent-[#16a34a]" checked={value === true} onChange={(event) => set(field.path, event.target.checked)} />
              </label>
            );
          }
          return (
            <div key={field.path} className={`${card} ${field.wide || field.kind === "textarea" ? "sm:col-span-2" : ""}`}>
              {icon}
              <div className="min-w-0 flex-1">
                <label htmlFor={id} className="block text-[11px] font-semibold tracking-[0.03em] text-[#6b7280] uppercase">
                  {field.label}
                </label>
                {field.kind === "textarea" ? (
                  <textarea id={id} rows={3} className={`${control} mt-1.5 h-auto py-2`} value={String(value ?? "")} onChange={(event) => set(field.path, event.target.value)} />
                ) : field.kind === "select" || field.kind === "yesno" ? (
                  <select id={id} className={`${control} mt-1.5 cursor-pointer`} value={String(value ?? "")} onChange={(event) => set(field.path, event.target.value)}>
                    <option value="">Not answered</option>
                    {(field.kind === "yesno"
                      ? ([
                          ["true", "Yes"],
                          ["false", "No"],
                        ] as [string, string][])
                      : (field.options ?? [])
                    ).map(([option, label]) => (
                      <option key={option} value={option}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    type={field.kind === "number" ? "number" : field.kind === "password" ? "password" : "text"}
                    min={field.kind === "number" ? 0 : undefined}
                    autoComplete="off"
                    className={`${control} mt-1.5`}
                    placeholder={field.kind === "password" ? "••••••••" : `Add ${field.label.toLowerCase()}`}
                    value={String(value ?? "")}
                    onChange={(event) => set(field.path, event.target.value)}
                  />
                )}
                {field.hint ? <div className="mt-1 text-[11.5px] text-[#6b7280]">{field.hint}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#16a34a] bg-[#16a34a] px-4 text-[13px] font-semibold text-white hover:bg-[#15803d] disabled:cursor-wait disabled:opacity-70"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} strokeWidth={2.5} />} {saving ? "Saving…" : "Save answers"}
        </button>
      </div>
    </div>
  );
};

// A password the client shared: the eye opens it behind the security code (PasswordEye), only for
// those who manage clients.
const PasswordReveal = ({ clientId, login }: { clientId: string; login: string }) => (
  <PasswordEye label="Password" load={() => revealOnboardingPasswordAction(clientId, login)} />
);

// The files the client uploaded for an item: their logo (and what shows the style they'd like),
// or each kind of photos and videos.
const filesOf = (client: Client, itemId: string): { title: string; files: OnboardingFile[] }[] => {
  const onboarding = client.onboarding;
  if (itemId === "logo") {
    return [
      { title: "Logo files", files: onboarding?.logo?.files ?? [] },
      { title: "Style they'd like", files: onboarding?.logo?.styleFiles ?? [] },
    ].filter((group) => group.files.length);
  }
  const kind = itemId.startsWith("media.") ? (itemId.slice("media.".length) as keyof NonNullable<NonNullable<typeof onboarding>["media"]>) : null;
  const files = kind ? (onboarding?.media?.[kind]?.files ?? []) : [];
  return files.length ? [{ title: "Uploaded files", files }] : [];
};

const kindOfFile = (file: OnboardingFile) => {
  const type = file.mimeType ?? "";
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(file.url)) return "image";
  if (type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(file.url)) return "video";
  return "file";
};

// A tile to each file: a picture shows itself, a video plays in place, anything else opens.
const FilePreviews = ({ groups }: { groups: { title: string; files: OnboardingFile[] }[] }) => (
  <div className="flex flex-col gap-3">
    {groups.map((group) => (
      <div key={group.title}>
        <div className="mb-2 text-[11px] font-semibold tracking-[0.03em] text-[#6b7280] uppercase">
          {group.title} · {group.files.length}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {group.files.map((file) => {
            const kind = kindOfFile(file);
            const size = file.size ? formatFileSize(file.size) : "";
            const caption = (
              <span className="flex items-center gap-1.5 px-2.5 py-2 text-[11.5px]">
                {kind === "image" ? <FileImage size={13} className="shrink-0 text-[#0284c7]" /> : <FileVideo size={13} className="shrink-0 text-[#7c3aed]" />}
                <span className="min-w-0 flex-1 truncate font-medium text-[#1f2937]" title={file.name}>
                  {file.name}
                </span>
                {size ? <span className="shrink-0 text-[#9ca3af]">{size}</span> : null}
              </span>
            );
            if (kind === "image") {
              return (
                <a key={file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-lg border border-[#e5e7eb] bg-white no-underline hover:border-[#93c5fd]">
                  <span className="block h-28 overflow-hidden bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.url} alt={file.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]" />
                  </span>
                  {caption}
                </a>
              );
            }
            if (kind === "video") {
              return (
                <div key={file.url} className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
                  <video src={file.url} controls preload="metadata" className="block h-28 w-full bg-black object-contain" />
                  {caption}
                </div>
              );
            }
            return (
              <a
                key={file.url}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-3 no-underline hover:border-[#93c5fd]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
                  <FileText size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold text-[#1f2937]" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-[11px] text-[#6b7280]">{size || "Open file"}</span>
                </span>
                <ExternalLink size={14} className="shrink-0 text-[#9ca3af]" />
              </a>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

type Filter = "submitted" | "todo" | "approved" | "all";

const smallButton = "inline-flex h-9 cursor-pointer items-center rounded-lg border border-[#d1d5db] bg-white px-3 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]";
const cardClass = "rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]";

// `editMode`: open with the team filling in the answers (from the client form's onboarding part).
const OnboardingReview = ({
  client: initialClient,
  canManage,
  comments: initialComments,
  editMode = false,
}: {
  client: Client;
  canManage: boolean;
  comments: OnboardingComment[];
  editMode?: boolean;
}) => {
  // The client's answers change here when the team fills them in.
  const [client, setClient] = useState(initialClient);
  const [answering, setAnswering] = useState(editMode && canManage);
  const saveAnswers = (onboarding: OnboardingAnswers) => setClient((now) => ({ ...now, onboarding: { ...now.onboarding, ...onboarding } }));
  const saveFiles = (kind: UploadKind, files: OnboardingFile[]) =>
    setClient((now) => {
      const onboarding = { ...(now.onboarding ?? { status: "in_progress" as const }) };
      if (kind === "logo" || kind === "logoStyle") onboarding.logo = { ...onboarding.logo, [kind === "logo" ? "files" : "styleFiles"]: files } as typeof onboarding.logo;
      else onboarding.media = { ...onboarding.media, [kind]: { ...onboarding.media?.[kind], files } };
      return { ...now, onboarding };
    });
  const steps = stepsOf({ contactName: client.contactName, companyName: client.companyName, email: client.email, phone: client.phone ?? "" }, client);

  // The team's ticks: what the client isn't asked, and what is approved. Each change is saved at
  // once; one that can't be saved is put back as it was.
  const [off, setOff] = useState<Ticks>(() => ticksOf(client.onboarding?.notNeeded ?? DEFAULT_NOT_NEEDED));
  const [approved, setApproved] = useState<Ticks>(() => ticksOf(client.onboarding?.approved));
  // What the team asked the client to update (a comment on the item): to do again for the client
  // until they change it, reply on it or hand the form in again — or it is approved.
  const [updateAsked, setUpdateAsked] = useState<Ticks>(() => ticksOf(client.onboarding?.updateAsked));
  const latest = useRef({ off, approved });
  const saved = useRef({ off, approved });
  const queue = useRef<Promise<void>>(Promise.resolve());
  const [saving, setSaving] = useState(0);

  const commit = (change: (now: { off: Ticks; approved: Ticks }) => { off?: Ticks; approved?: Ticks }) => {
    const previous = latest.current;
    const next = { ...previous, ...change(previous) };
    latest.current = next;
    setOff(next.off);
    setApproved(next.approved);
    // An item approved needs no more updating, and one newly approved answers what was asked on
    // its step (the backend says the same).
    const newly = Object.keys(next.approved).filter((id) => next.approved[id] && !previous.approved[id]);
    const stepsDone = new Set(newly.map((id) => steps.find((entry) => entry.items.some((item) => item.id === id))?.id));
    setUpdateAsked((now) => Object.fromEntries(Object.entries(now).filter(([id]) => !next.approved[id] && !stepsDone.has(id))));
    setSaving((count) => count + 1);
    queue.current = queue.current
      .then(async () => {
        const result = await updateClientAction(client._id, { onboardingControls: { notNeeded: tickedIn(next.off), approved: tickedIn(next.approved) } });
        if (result.ok) {
          saved.current = next;
          return;
        }
        toast.error(result.error ?? "Couldn't save that. Please try again.");
        latest.current = saved.current;
        setOff(saved.current.off);
        setApproved(saved.current.approved);
      })
      .finally(() => setSaving((count) => count - 1));
  };

  const isOn = (step: Step, item: Entry) => step.locked || (!off[step.id] && !off[item.id]);
  const standingOf = (step: Step, item: Entry): Standing =>
    !isOn(step, item) ? "none" : approved[item.id] ? "approved" : item.st === "wait" || updateAsked[item.id] ? "todo" : "submitted";
  // A step as the client's form shows it: approved once every item asked is, todo while one is.
  const stepStandingOf = (step: Step): Standing => {
    const live = step.items.filter((item) => isOn(step, item));
    if (!live.length) return "none";
    // Asked to update the step: to do again, approved or not.
    if (updateAsked[step.id]) return "todo";
    if (live.every((item) => approved[item.id])) return "approved";
    return live.some((item) => standingOf(step, item) === "todo") ? "todo" : "submitted";
  };

  const skip = (item: Entry) => commit((now) => ({ off: { ...now.off, [item.id]: true } }));
  // Putting an item back turns its step on too, if it was off. The step's other items come back
  // with it unless the team took them off one by one.
  const addBack = (step: Step, item: Entry) => commit((now) => ({ off: { ...now.off, [item.id]: false, [step.id]: false } }));

  // Every item with where it stands.
  const rows = steps.flatMap((step) => step.items.map((item) => ({ step, item, standing: standingOf(step, item) })));
  const count = (standing: Standing) => rows.filter((row) => row.standing === standing).length;
  const totals = { approved: count("approved"), submitted: count("submitted"), todo: count("todo"), none: count("none") };
  const active = rows.length - totals.none;

  // The page opens on the first step, About you, with everything in it open. Picking a step
  // opens all of its items; each can still be closed on its own.
  const [filter, setFilter] = useState<Filter>("all");
  const [section, setSection] = useState<string | null>("step:contact");
  const [open, setOpen] = useState<Set<string>>(() => new Set(steps.find((step) => step.id === "step:contact")?.items.map((item) => item.id) ?? []));
  const toggleOpen = (id: string) =>
    setOpen((now) => {
      const next = new Set(now);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const matches = (standing: Standing, step: Step) =>
    section
      ? step.id === section
      : filter === "all"
        ? true
        : standing === filter;

  // The client's comments, by step, with the team's replies.
  const [comments, setComments] = useState(initialComments);
  // A comment or reply from either side, live (backend → onboarding:comment) — this client's only.
  // Where the asks stand on the record: the client answers them from their own form.
  const reloadAsks = () =>
    void getClientAction(client._id).then((result) => {
      if (result.ok && result.data) setUpdateAsked(ticksOf(result.data.onboarding?.updateAsked));
    });
  useRealtime<OnboardingComment & { client?: string }>("onboarding:comment", (comment) => {
    if (comment.client && comment.client !== client._id) return;
    setComments((now) => (now.some((entry) => entry._id === comment._id) ? now.map((entry) => (entry._id === comment._id ? comment : entry)) : [...now, comment]));
    reloadAsks();
  });
  // And reloaded now and then, in case the live connection is down.
  useRefreshing(() => {
    void listOnboardingCommentsAction(client._id).then((result) => result.ok && result.data && setComments(result.data));
    reloadAsks();
  });
  const addComment = (comment: OnboardingComment) => setComments((now) => (now.some((entry) => entry._id === comment._id) ? now : [...now, comment]));
  // The team asked the client to update an item: to do again, and no longer approved (the backend
  // does the same — so nothing is saved here).
  const askedUpdate = (comment: OnboardingComment) => {
    addComment(comment);
    // On the whole step: the step is to do again, its items' ticks as they are.
    if (!comment.item) {
      setUpdateAsked((now) => ({ ...now, [`step:${comment.step}`]: true }));
      return;
    }
    const ids = comment.item === "hosting" ? ["hosting", "cms"] : [comment.item];
    const unticked = (ticks: Ticks) => Object.fromEntries(Object.entries(ticks).filter(([id]) => !ids.includes(id)));
    latest.current = { ...latest.current, approved: unticked(latest.current.approved) };
    saved.current = { ...saved.current, approved: unticked(saved.current.approved) };
    setApproved(latest.current.approved);
    setUpdateAsked((now) => ({ ...now, ...Object.fromEntries(ids.map((id) => [id, true])) }));
  };
  const commentsOn = (step: Step) => comments.filter((comment) => `step:${comment.step}` === step.id);

  const submittedAt = client.onboarding?.submittedAt
    ? new Date(client.onboarding.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "";
  const standingLine =
    client.onboarding?.status === "submitted" ? `submitted${submittedAt ? ` ${submittedAt}` : ""}` : client.onboarding?.status ? "still filling in the form" : "hasn't started the form";

  const pct = (n: number) => (active ? (n / active) * 100 : 0);
  const helpCount = rows.filter((row) => row.standing === "submitted" && row.item.st === "help").length;
  const tiles: { key: Filter; label: string; n: number; color: string; soft: string; icon: LucideIcon; hint: string }[] = [
    { key: "submitted", label: "Submitted", n: totals.submitted, color: "#2F5FD8", soft: "#e8eefe", icon: Inbox, hint: helpCount ? `Ready to approve · ${helpCount} asked for our help` : "Ready for you to approve" },
    { key: "todo", label: "Todo", n: totals.todo, color: "#B45309", soft: "#FEF3C7", icon: Clock, hint: "Waiting on the client" },
    { key: "approved", label: "Approved", n: totals.approved, color: "#15803d", soft: "#dcfce7", icon: CircleCheck, hint: "Checked by the team" },
    { key: "all", label: "All items", n: rows.length, color: "#374151", soft: "#f3f4f6", icon: LayoutList, hint: `${totals.none} not needed` },
  ];

  // An item's button: what moves it on — for every entry it stands for (hosting stands for the
  // website's login too).
  const approveAll = (entries: Entry[], yes: boolean) => commit((now) => ({ approved: { ...now.approved, ...Object.fromEntries(entries.map((entry) => [entry.id, yes])) } }));
  const actionOf = (step: Step, entries: Entry[], standing: Standing) => {
    const base = "h-9 min-w-24 shrink-0 cursor-pointer rounded-lg border px-3.5 text-[13px] font-semibold transition-colors";
    const quiet = `${base} border-[#d1d5db] bg-white text-[#374151] hover:border-[#9ca3af] hover:bg-[#f9fafb]`;
    if (standing === "submitted")
      return (
        <button type="button" className={`${base} border-[#16A34A] bg-[#16A34A] text-white hover:bg-[#15803d]`} onClick={() => approveAll(entries, true)}>
          Approve
        </button>
      );
    if (standing === "approved")
      return (
        <button type="button" className={quiet} onClick={() => approveAll(entries, false)}>
          Undo
        </button>
      );
    if (standing === "none")
      return (
        <button type="button" className={quiet} onClick={() => entries.forEach((entry) => addBack(step, entry))}>
          Add back
        </button>
      );
    // Todo: the team can still approve what they have from elsewhere.
    return (
      <button type="button" className={quiet} onClick={() => approveAll(entries, true)}>
        Approve
      </button>
    );
  };
  // Two items shown as one: approved once both are, todo while either is.
  const together = (one: Standing, other: Standing): Standing =>
    one === "none" ? other : other === "none" ? one : one === "approved" && other === "approved" ? "approved" : one === "todo" || other === "todo" ? "todo" : "submitted";

  // Which login a password field is: the item's own, or — on hosting with the website's login —
  // the hosting's or the website's.
  const passwordLoginOf = (entry: Entry, label: string) =>
    label === "Login password" ? entry.id : label === "Hosting password" ? "hosting" : label === "Website password" ? "cms" : null;

  // Hosting with the website's login, simply: where it is hosted, what the site is built with, and
  // the way in they gave to each — the login itself, or whether the invite is done.
  const hostingInBrief = (): [string, string][] => {
    const hosting = client.onboarding?.hosting ?? {};
    const cms = client.onboarding?.cms ?? {};
    const none = "None";
    const builder = hosting.has === "yes" && ["Wix", "Squarespace", "Shopify"].includes(hosting.platform ?? "");
    const hasCms = builder ? "yes" : (cms.has ?? (cms.platform ? "yes" : undefined));
    const giving = builder || hosting.has !== "yes" ? "cms" : cms.giving;
    const way = (entry: typeof hosting, name: string): [string, string][] =>
      entry.access === "secure"
        ? [
            [`${name} login`, entry.loginUsername || none],
            [`${name} password`, entry.loginPassword || entry.loginPasswordSet ? "Saved (encrypted)" : none],
          ]
        : [[`${name} access`, entry.accessGiven ? "Invite done" : entry.needsHelp ? "Needs our help" : none]];
    return [
      ["Hosting", hosting.has === "yes" ? hosting.platform || none : hosting.has === "no" ? (hosting.wantsCreated ? "Set it up for them" : "No hosting") : hosting.has === "unsure" ? "Not sure — find out" : none],
      ["Website", hasCms === "yes" ? cms.platform || none : hasCms === "no" ? "No CMS" : hasCms === "unsure" ? "Not sure — find out" : none],
      ...(hosting.has === "yes" && !builder && hasCms !== "unsure" && (hasCms !== "yes" || giving === "hosting" || giving === "both") ? way(hosting, "Hosting") : []),
      ...(hasCms === "yes" && (giving === "cms" || giving === "both") ? (cms.developer ? ([["Developer", cms.developer]] as [string, string][]) : way(cms, "Website")) : []),
    ];
  };

  // What the client gave for one item, a card to each field.
  const fieldsOf = (entry: Entry) => (
    <dl className="m-0 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(entry.details.length ? entry.details : [["Client answer", "Nothing entered yet"] as [string, string]]).map(([label, value]) => {
          const [FieldIcon, tint] = fieldIconOf(label);
          const empty = isEmptyValue(value);
          // Given: the field's own color. Left empty: todo's amber, so it stands out.
          return (
            <div
              key={label}
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${empty ? "border-dashed border-[#fcd34d] bg-[#fffbeb]" : "border-[#eef0f3] bg-white"}`}
            >
              <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${empty ? "bg-[#FEF3C7] text-[#B45309]" : tint}`}>
                <FieldIcon size={14} strokeWidth={2.1} />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.03em] text-[#6b7280] uppercase">
                  {label}
                  {empty ? (
                    <span className="rounded-full bg-[#FEF3C7] px-1.5 py-px text-[9.5px] font-bold tracking-normal text-[#B45309] normal-case">Todo</span>
                  ) : (
                    <Check size={12} strokeWidth={3} className="shrink-0 text-[#16A34A]" aria-label="Given" />
                  )}
                </dt>
                <dd className={`m-0 mt-0.5 text-[13px] break-words whitespace-pre-line ${empty ? "text-[#b45309] italic" : "font-medium text-[#111827]"}`}>
                  {empty ? (
                    "Not given yet"
                  ) : passwordLoginOf(entry, label) && value === "Saved (encrypted)" && canManage ? (
                    <PasswordReveal clientId={client._id} login={passwordLoginOf(entry, label)!} />
                  ) : (
                    <FieldValue label={label} value={value} />
                  )}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
  );

  // A step's mark: a tick once approved, else what is left to approve.
  const StepDot = ({ step }: { step: Step }) => {
    const standing = stepStandingOf(step);
    const live = step.items.filter((item) => isOn(step, item));
    const left = live.filter((item) => !approved[item.id]).length;
    return (
      <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${META[standing].dot}`}>
        {standing === "none" ? "–" : standing === "approved" ? <Check size={13} strokeWidth={3} /> : left}
      </span>
    );
  };

  // The steps on the client's form: one left off it (unticked above) isn't listed at all — the
  // client doesn't see it either.
  const onForm = steps.filter((step) => step.locked || !off[step.id]);
  const groups = onForm
    .map((step) => {
      const items = step.items
        .map((item) => ({ item, standing: standingOf(step, item) }))
        .filter(({ standing }) => matches(standing, step))
        .sort((a, b) => ORDER[a.standing] - ORDER[b.standing]);
      return { step, items };
    })
    .filter(({ items }) => items.length);

  return (
    <div className="flex flex-col gap-4 text-[#111827]">
      {/* ── Where it stands ── */}
      <div className={`${cardClass} flex flex-col gap-5 p-6 max-sm:p-4.5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold tracking-[0.06em] text-[#4b5563]">STEP 4 OF 5</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h1 className="m-0 text-[22px] font-bold">Onboarding and transfer</h1>
              <span className="text-[14px] text-[#4b5563]">
                ({client.companyName} · {standingLine})
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saving ? (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#4b5563]">
                <Loader2 size={13} className="animate-spin" /> Saving…
              </span>
            ) : null}
            <Link
              href={`/clients/${client._id}`}
              className="inline-flex h-10 max-w-full items-center gap-2 rounded-[10px] border border-[#d1d5db] bg-white px-3.5 text-[13.5px] font-semibold text-[#374151] no-underline shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:text-[#2563eb]"
            >
              <ArrowLeft size={16} strokeWidth={2} className="shrink-0" />
              <span className="truncate">Back to {client.companyName}</span>
            </Link>
            {canManage ? (
              <button
                type="button"
                aria-pressed={answering}
                onClick={() => setAnswering((now) => !now)}
                className={`inline-flex h-10 cursor-pointer items-center rounded-[10px] border px-3.5 text-[13.5px] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors ${
                  answering ? "border-[#16a34a] bg-[#16a34a] text-white hover:bg-[#15803d]" : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:text-[#2563eb]"
                }`}
              >
                {answering ? "Done editing" : "Edit answers"}
              </button>
            ) : null}
          </div>
        </div>

        {/* How far along, beside the four ways to look at it. The tiles are the bar's key too. */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(300px,1fr)_minmax(0,1.6fr)]">
          <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#eef0f3] bg-[linear-gradient(180deg,#fbfcfe,#f6f8fb)] p-5">
            <div className="flex items-center gap-4">
              <div className="relative grid size-18 shrink-0 place-items-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8ebf0" strokeWidth="3.5" />
                  {totals.approved ? (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke={META.approved.bar}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct(totals.approved) / 100) * 97.4} 97.4`}
                      className="transition-[stroke-dasharray] duration-500"
                    />
                  ) : null}
                </svg>
                <span className="text-[16px] font-bold tabular-nums">{Math.round(pct(totals.approved))}%</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[30px] leading-none font-bold tabular-nums">{totals.approved}</span>
                  <span className="text-[16px] font-semibold text-[#9ca3af]">/ {active}</span>
                </div>
                <div className="mt-1 text-[13.5px] text-[#4b5563]">items approved</div>
              </div>
            </div>
            <div>
              <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-[#e8ebf0]">
                {(["approved", "submitted", "todo"] as const)
                  .filter((standing) => totals[standing])
                  .map((standing) => (
                    <div key={standing} className="rounded-full transition-[width] duration-300" style={{ width: `${pct(totals[standing])}%`, background: META[standing].bar }} />
                  ))}
              </div>
              <div className="mt-2.5 text-[12px] text-[#6b7280]">
                {active} asked of this client{totals.none ? ` · ${totals.none} not needed` : ""}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {tiles.map((tile) => {
              const on = filter === tile.key && !section;
              return (
                <button
                  key={tile.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setFilter(tile.key);
                    setSection(null);
                  }}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    on ? "border-2 shadow-[0_4px_14px_rgba(15,23,42,0.06)]" : "m-px border border-[#e5e7eb] bg-white hover:border-[#d1d5db] hover:shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
                  }`}
                  style={on ? { borderColor: tile.color, background: `${tile.soft}66` } : undefined}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: tile.soft, color: tile.color }}>
                    <tile.icon size={17} strokeWidth={2.25} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13.5px] font-semibold" style={{ color: tile.color }}>
                      {tile.label}
                    </span>
                    <span className="truncate text-[12px] text-[#6b7280]">{tile.hint}</span>
                  </span>
                  <span className="shrink-0 text-[24px] leading-none font-bold tabular-nums">{tile.n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Which steps the client fills in: ticked here, saved at once ── */}
      <div className={`${cardClass} p-6 max-sm:p-4.5`}>
        <h2 className="mb-1 text-[16px] font-bold">Steps on the client&apos;s form</h2>
        <StepTicks
          off={off}
          disabled={!canManage}
          onChange={canManage ? (stepId, on) => commit((now) => ({ off: { ...now.off, [stepId]: !on } })) : undefined}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* ── The steps, and under them the comments on the client's form: on the right on a wide screen ── */}
        <div className="flex w-full flex-col gap-4 lg:order-last lg:w-75 lg:shrink-0">
          <nav className={`${cardClass} flex w-full flex-col gap-0.5 p-2`} aria-label="Onboarding sections">
            <div className="px-2.5 pt-1.5 pb-2 text-[11px] font-bold tracking-[0.08em] text-[#6b7280] uppercase">Steps</div>
            {onForm.map((step) => {
              const live = step.items.filter((item) => isOn(step, item));
              const ok = live.filter((item) => approved[item.id]).length;
              const here = section === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  aria-pressed={here}
                  onClick={() => {
                    setSection(here ? null : step.id);
                    setFilter("all");
                    if (!here) setOpen(new Set(step.items.map((item) => item.id)));
                  }}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[14px] transition-colors ${here ? "bg-[#eef2ff] font-semibold" : "font-medium hover:bg-[#f9fafb]"}`}
                >
                  <StepDot step={step} />
                  <span className="min-w-0 flex-1 truncate" title={step.title}>
                    {step.title}
                  </span>
                  <span className="shrink-0 text-[12px] font-normal whitespace-nowrap text-[#4b5563]">{live.length ? `${ok}/${live.length}` : "Not needed"}</span>
                </button>
              );
            })}
          </nav>
          {client.user ? <OnboardingComments clientId={client._id} comments={comments} onPosted={askedUpdate} /> : null}
        </div>

        {/* ── The items ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">

          {groups.length ? (
            groups.map(({ step, items }) => {
              const live = step.items.filter((item) => isOn(step, item));
              const ok = live.filter((item) => approved[item.id]).length;
              const stepComments = commentsOn(step);
              const stepStanding = stepStandingOf(step);
              const StepIcon = STEP_ICONS[step.id] ?? LayoutList;
              return (
                <section key={step.id} className={`${cardClass} overflow-hidden`}>
                  {/* The step: its icon, name and state, and how much of it is approved. */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f3] bg-[linear-gradient(180deg,#fcfcfd,#f8f9fb)] px-4.5 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${TILE[stepStanding]}`}>
                        <StepIcon size={17} strokeWidth={2.1} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="m-0 text-[15px] font-bold">{step.title}</h2>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${META[stepStanding].pill}`}>{META[stepStanding].label}</span>
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6b7280]">{live.length ? `${live.length} item${live.length === 1 ? "" : "s"} asked` : "Not on the client’s form"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5 text-[12px] text-[#4b5563]">
                      {stepComments.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2 py-0.5 font-semibold text-[#3730a3]" aria-label={`${stepComments.length} comments`}>
                          <MessageSquare size={12} strokeWidth={2.25} /> {stepComments.length}
                        </span>
                      ) : null}
                      {live.length ? (
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e8ebf0]">
                            <span className="block h-full rounded-full bg-[#16A34A] transition-[width] duration-300" style={{ width: `${(ok / live.length) * 100}%` }} />
                          </span>
                          <span className="font-medium tabular-nums">
                            {ok}/{live.length} approved
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 p-2.5">
                    {items.map(({ item, standing: own }) => {
                      // The website's login is shown inside Hosting, as on the client's own form.
                      if (item.id === "cms" && items.some((row) => row.item.id === "hosting")) return null;
                      const cms = item.id === "hosting" ? step.items.find((entry) => entry.id === "cms") : undefined;
                      const cmsStanding = cms ? standingOf(step, cms) : "none";
                      const entries = cms && cmsStanding !== "none" ? [item, cms] : [item];
                      const standing = entries.length > 1 ? together(own, cmsStanding) : own;
                      const title = entries.length > 1 ? "Hosting and website login" : item.name;
                      const isOpen = open.has(item.id);
                      const ItemIcon = ITEM_ICONS[item.id] ?? LayoutList;
                      const StateIcon = STATE_ICONS[standing];
                      const unanswered = item.kind === "empty";
                      // What the team asked the client to fix on this item, and the client's answers.
                      const itemComments = comments.filter((comment) => comment.item && entries.some((entry) => entry.id === comment.item));
                      const lastNote = itemComments[itemComments.length - 1];
                      const noteState =
                        standing === "approved" || standing === "none" || !lastNote
                          ? null
                          : entries.some((entry) => updateAsked[entry.id])
                            ? "asked"
                            : lastNote.side === "team"
                              ? "updated"
                              : "replied";
                      return (
                        <div
                          key={item.id}
                          className={`overflow-hidden rounded-xl border transition-all ${
                            isOpen ? "border-[#c7d2fe] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)]" : "border-[#eef0f3] bg-white hover:border-[#dfe3e8] hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
                          } ${standing === "none" ? "opacity-70" : ""}`}
                        >
                          <div className="flex items-center gap-3 py-2.5 pr-2.5 pl-3 max-sm:flex-wrap">
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              onClick={() => toggleOpen(item.id)}
                              className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 text-left max-sm:basis-full"
                            >
                              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${TILE[standing]}`}>
                                <ItemIcon size={18} strokeWidth={2} />
                              </span>
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <b className="text-[14px] font-semibold">{title}</b>
                                  {standing === "submitted" && item.st === "help" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ede9fe] px-1.5 py-px text-[10.5px] font-semibold text-[#6d28d9]">
                                      <LifeBuoy size={10} strokeWidth={2.5} /> Asked for our help
                                    </span>
                                  ) : null}
                                  {noteState === "asked" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-1.5 py-px text-[10.5px] font-semibold text-[#92400e]">
                                      <MessageSquare size={10} strokeWidth={2.5} /> Update asked
                                    </span>
                                  ) : noteState ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f2fe] px-1.5 py-px text-[10.5px] font-semibold text-[#075985]">
                                      <MessageSquare size={10} strokeWidth={2.5} /> {noteState === "replied" ? "Client replied" : "Client updated"}
                                    </span>
                                  ) : null}
                                </span>
                                {standing === "none" ? (
                                  <span className="truncate text-[12.5px] text-[#9ca3af]">Removed from this client&apos;s form</span>
                                ) : unanswered ? (
                                  <span className="inline-flex items-center gap-1 text-[12.5px] text-[#9ca3af] italic">
                                    <Hourglass size={12} strokeWidth={2} /> No answer yet
                                  </span>
                                ) : (
                                  <span className="truncate text-[12.5px] text-[#4b5563]">{entries.length > 1 ? `${item.answer} · ${cms?.answer}` : item.answer}</span>
                                )}
                              </span>
                            </button>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${META[standing].pill}`}>
                              <StateIcon size={12} strokeWidth={2.5} />
                              {META[standing].label}
                            </span>
                            {canManage ? actionOf(step, entries, standing) : null}
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-hidden
                              onClick={() => toggleOpen(item.id)}
                              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#374151] max-sm:hidden"
                            >
                              <ChevronDown size={16} strokeWidth={2.25} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                          </div>

                          {isOpen ? (
                            <div className="flex flex-col gap-3.5 border-t border-[#f0f1f3] bg-[#fafbfc] px-4 py-4">
                              {item.kind !== "empty" && entries.length === 1 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="rounded-full bg-white px-2.5 py-0.75 text-[12px] font-medium text-[#374151] ring-1 ring-[#e5e7eb]">{KIND_LABELS[item.kind]}</span>
                                </div>
                              ) : null}
                              {/* What the client gave, a card to each field — for hosting with the website's login, just the essentials. */}
                              {answering && canManage && UPLOADS_OF[item.id] ? (
                                <div className="flex flex-col gap-2.5">
                                  {UPLOADS_OF[item.id].map(([kind, title]) => (
                                    <FileManager key={kind} clientId={client._id} kind={kind} title={title} files={filesOfKind(client.onboarding, kind)} onChange={saveFiles} />
                                  ))}
                                </div>
                              ) : null}
                              {answering && canManage && entries.some((entry) => editFieldsOf(entry.id).length) ? (
                                <ItemEditor
                                  key={`${item.id}-${entries.length}`}
                                  clientId={client._id}
                                  onboarding={client.onboarding}
                                  fields={entries.flatMap((entry) => editFieldsOf(entry.id))}
                                  onSaved={saveAnswers}
                                />
                              ) : entries.length > 1 ? (
                                fieldsOf({ ...item, details: hostingInBrief() })
                              ) : (
                                fieldsOf(item)
                              )}
                              {!(answering && canManage) && filesOf(client, item.id).length ? <FilePreviews groups={filesOf(client, item.id)} /> : null}
                              {standing === "submitted" && item.st === "help" && canManage ? (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#ede9fe] px-3 py-2.5 text-[13px] text-[#4c1d95]">
                                  <span className="inline-flex items-center gap-2">
                                    <LifeBuoy size={15} strokeWidth={2} className="shrink-0" />
                                    The client asked us to do this. Mark it complete when it&apos;s done — the client will see it as finished.
                                  </span>
                                  <button type="button" className="h-9 cursor-pointer rounded-lg border border-[#6d28d9] bg-[#6d28d9] px-3.5 text-[13px] font-semibold text-white hover:bg-[#5b21b6]" onClick={() => approveAll(entries, true)}>
                                    Mark as complete
                                  </button>
                                </div>
                              ) : null}
                              {client.user && standing !== "none" ? (
                                <ItemComments clientId={client._id} step={step.id.replace(/^step:/, "")} item={{ id: item.id, label: title }} comments={itemComments} onPosted={askedUpdate} />
                              ) : null}
                              {canManage && !step.locked ? (
                                <div className="flex justify-end">
                                  <button type="button" className={smallButton} onClick={() => entries.forEach((entry) => (standing === "none" ? addBack(step, entry) : skip(entry)))}>
                                    {standing === "none" ? "Ask client for this" : "Mark not needed"}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <div className={`${cardClass} border-dashed p-8 text-center text-[14px] text-[#4b5563]`}>Nothing here right now.</div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OnboardingReview;
