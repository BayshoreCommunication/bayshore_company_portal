"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bell,
  BellOff,
  Building2,
  CalendarCheck,
  Check,
  ClipboardCheck,
  FileBarChart,
  FolderKanban,
  Info,
  KeyRound,
  Layers,
  Loader2,
  Mail,
  MailX,
  MessageCircle,
  MessageSquareText,
  Newspaper,
  RefreshCw,
  Save,
  Send,
  TimerReset,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { updateClientMessagesAction, type Client } from "@/app/actions/clients";
import { avatarColorFor, initialsOf } from "@/component/clients/clientUi";
import Picker from "@/component/shared/Picker";

// Which system messages one client is sent — by email, in their portal's bell, or both — as the
// team switches them (backend: client.messagesOff, CLIENT_MESSAGES). Everything is on until
// switched off. The welcome isn't here: it goes the moment the client is made.

type Channel = "email" | "bell";
type MessageRow = { key: string; label: string; about: string; icon: LucideIcon; channels: Channel[]; warn?: string };
type Group = { title: string; about: string; icon: LucideIcon; color: string; tint: string; rows: MessageRow[] };

const GROUPS: Group[] = [
  {
    title: "Account and onboarding",
    about: "Signing in, and getting them set up",
    icon: UserRound,
    color: "#7c3aed",
    tint: "#f1ebfe",
    rows: [
      {
        key: "portal_login",
        label: "Portal login and password",
        about: "When the team gives them a login, changes their sign-in email or sets a new password.",
        icon: KeyRound,
        channels: ["email", "bell"],
        warn: "They won't get their sign-in email or password. Tell them another way.",
      },
      { key: "onboarding_reminder", label: "Onboarding reminder", about: "Once, 1 hour after they sign up, if the onboarding call isn't booked.", icon: TimerReset, channels: ["email", "bell"] },
      { key: "onboarding_call_booked", label: "Onboarding call booked", about: "Their onboarding call is booked: when it is, and what to expect on it.", icon: CalendarCheck, channels: ["email", "bell"] },
      { key: "onboarding_comment", label: "Onboarding comments", about: "The team commented or replied on their onboarding form.", icon: MessageSquareText, channels: ["email", "bell"] },
      { key: "onboarding_approved", label: "Onboarding approvals", about: "Items on their onboarding form were approved.", icon: ClipboardCheck, channels: ["email", "bell"] },
    ],
  },
  {
    title: "Content",
    about: "Posts and pieces sent for their approval",
    icon: Newspaper,
    color: "#2563eb",
    tint: "#eaf2ff",
    rows: [
      { key: "content_sent", label: "Content for approval", about: "New content is sent for them to approve.", icon: Send, channels: ["email", "bell"] },
      { key: "content_resubmitted", label: "Updated content", about: "Content changed as they asked, sent back for approval.", icon: RefreshCw, channels: ["email", "bell"] },
      { key: "content_comment", label: "Replies on content", about: "The team replied on a piece's comments.", icon: MessageCircle, channels: ["email", "bell"] },
    ],
  },
  {
    title: "Messages and updates",
    about: "Conversations, reports, projects and services",
    icon: Mail,
    color: "#15803d",
    tint: "#e7f6ec",
    rows: [
      { key: "message", label: "Messages", about: "The team sent a message or scheduled a meeting.", icon: Mail, channels: ["email", "bell"] },
      { key: "report_published", label: "Reports", about: "A monthly report was published.", icon: FileBarChart, channels: ["email", "bell"] },
      { key: "project_created", label: "New projects", about: "The team started a project for them.", icon: FolderKanban, channels: ["email", "bell"] },
      { key: "services_updated", label: "Service changes", about: "A service added, finished, changed or removed — or their request declined.", icon: Layers, channels: ["email", "bell"] },
    ],
  },
];

const switchesOf = (rows: MessageRow[], only?: Channel) => rows.flatMap((row) => row.channels.filter((channel) => !only || channel === only).map((channel) => `${row.key}.${channel}`));
const ALL_ROWS = GROUPS.flatMap((group) => group.rows);
const ALL_SWITCHES = switchesOf(ALL_ROWS);
const EMAIL_SWITCHES = switchesOf(ALL_ROWS, "email");
const BELL_SWITCHES = switchesOf(ALL_ROWS, "bell");

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const quietButton =
  "inline-flex h-8 cursor-pointer items-center rounded-lg px-2.5 text-[12px] font-medium text-[#4b5260] transition-colors hover:bg-[#f3f4f6] hover:text-[#0b0c24] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";

const CHANNELS: Record<Channel, { label: string; on: LucideIcon; off: LucideIcon }> = {
  email: { label: "Email", on: Mail, off: MailX },
  bell: { label: "Bell", on: Bell, off: BellOff },
};

// One way a message goes: pressed (green, ticked) while it is sent that way.
const ChannelToggle = ({ channel, on, name, onToggle, disabled }: { channel: Channel; on: boolean; name: string; onToggle: () => void; disabled: boolean }) => {
  const look = CHANNELS[channel];
  const Icon = on ? look.on : look.off;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`${name} by ${channel === "bell" ? "portal notification" : "email"}: ${on ? "on" : "off"}`}
      title={on ? `Sent by ${look.label.toLowerCase()} — click to turn off` : `Not sent by ${look.label.toLowerCase()} — click to turn on`}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex h-8.5 w-23 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[12px] font-semibold transition-all disabled:cursor-wait ${
        on
          ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] hover:border-[#86efac]"
          : "border-[#e5e7eb] bg-[#f9fafb] text-[#9ca3af] hover:border-[#d1d5db] hover:text-[#6b7280]"
      }`}
    >
      <Icon size={14} strokeWidth={2.1} />
      {look.label}
      {on ? <Check size={12} strokeWidth={3} /> : null}
    </button>
  );
};

// A channel this message isn't sent by: a quiet space, so the columns stay in line.
const NoChannel = ({ channel }: { channel: Channel }) => (
  <span className="inline-flex h-8.5 w-23 items-center justify-center rounded-lg border border-dashed border-[#eceef1] text-[11px] text-[#c4c8ce]" title={`Not sent by ${channel === "bell" ? "portal notification" : "email"}`}>
    Not used
  </span>
);

// How many of a channel's messages are on, as a bar.
const Meter = ({ icon: Icon, label, on, total }: { icon: LucideIcon; label: string; on: number; total: number }) => (
  <div className="flex items-center gap-3">
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#f0fdf4] text-[#15803d]">
      <Icon size={16} strokeWidth={2} />
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span className="font-semibold text-[#0b0c24]">{label}</span>
        <span className="text-[#6b7280] tabular-nums">
          {on} of {total} on
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]">
        <div className="h-full rounded-full bg-[#16a34a] transition-[width] duration-300" style={{ width: `${total ? (on / total) * 100 : 0}%` }} />
      </div>
    </div>
  </div>
);

const ClientMessages = ({ clients, client }: { clients: { _id: string; companyName: string; contactName?: string }[]; client?: Client }) => {
  const router = useRouter();
  const [, startNavigation] = useTransition();
  // What is saved for this client, and the changes on top of it — kept until Save.
  const [saved, setSaved] = useState<string[]>(client?.messagesOff ?? []);
  const [off, setOff] = useState<string[]>(saved);
  const [saving, setSaving] = useState(false);
  const changed = off.length !== saved.length || off.some((id) => !saved.includes(id));

  const choose = (id: string) => {
    if (id === client?._id) return;
    // Another client would lose these changes.
    if (changed) return void toast.error("Save or discard your changes first.");
    startNavigation(() => router.replace(`/notifications/manage?client=${id}`, { scroll: false }));
  };

  const edit = (next: string[]) => setOff(Array.from(new Set(next)));
  const save = async () => {
    if (!client || !changed) return;
    setSaving(true);
    const result = await updateClientMessagesAction(client._id, off);
    setSaving(false);
    if (!result.ok) return void toast.error(result.error ?? "Couldn't save the changes.");
    setSaved(off);
    toast.success(`Saved for ${client.companyName}`);
  };
  const discard = () => setOff(saved);
  const isOn = (id: string) => !off.includes(id);
  const toggle = (id: string) => edit(isOn(id) ? [...off, id] : off.filter((each) => each !== id));
  // A group's switches all on, or all off.
  const setAll = (ids: string[], on: boolean) => edit(on ? off.filter((id) => !ids.includes(id)) : [...off, ...ids]);
  const onCount = (ids: string[]) => ids.filter(isOn).length;

  const picker = (
    <Picker
      id="messages-client"
      value={client?._id ?? ""}
      options={clients.map((option) => ({
        value: option._id,
        label: option.companyName,
        sub: option.contactName ? `Contact: ${option.contactName}` : undefined,
        initials: initialsOf(option.companyName),
        color: avatarColorFor(option._id),
      }))}
      onChange={choose}
      placeholder="Select a client"
      placeholderIcon={Building2}
      searchable
      searchPlaceholder="Search clients…"
    />
  );

  if (!client) {
    return (
      <div className={`${cardClass} flex flex-col items-center px-6 py-14 text-center`}>
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#eef1f6] text-[#4b5260]">
          <Bell size={24} strokeWidth={1.8} />
        </span>
        <div className="text-[17px] font-semibold text-[#0b0c24]">Choose a client</div>
        <div className="mt-1.5 max-w-96 text-[12.5px] leading-normal text-[#4b5563]">
          Pick which emails and portal notifications they get. Everything is on until you turn it off.
        </div>
        <div className="mt-5 w-full max-w-80 text-left">{picker}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-4.5">
        {/* Whose messages, and the way to another client's. */}
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <div className="w-full sm:w-80">{picker}</div>
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" className={quietButton} disabled={saving || off.length === 0} onClick={() => edit([])}>
              Turn all on
            </button>
            <button type="button" className={quietButton} disabled={saving || onCount(ALL_SWITCHES) === 0} onClick={() => edit(ALL_SWITCHES)}>
              Turn all off
            </button>
            <button
              type="button"
              disabled={saving || !changed}
              onClick={() => void save()}
              className="ml-1.5 inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12.5px] font-medium text-white hover:bg-[#1e2140] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-[#0b0c24]"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />} {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        {GROUPS.map((group) => {
          const ids = switchesOf(group.rows);
          const on = onCount(ids);
          return (
            <section key={group.title} className={`${cardClass} overflow-hidden`}>
              <div className="flex flex-wrap items-center gap-3 border-b border-[#eef0f2] px-4.5 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: group.tint, color: group.color }}>
                  <group.icon size={18} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14.5px] font-bold text-[#0b0c24]">{group.title}</h2>
                  <p className="text-[12px] text-[#6b7280]">{group.about}</p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold tabular-nums" style={{ background: group.tint, color: group.color }}>
                  {on} of {ids.length} on
                </span>
                <div className="flex items-center">
                  <button type="button" className={quietButton} disabled={saving || on === ids.length} onClick={() => setAll(ids, true)}>
                    All on
                  </button>
                  <button type="button" className={quietButton} disabled={saving || on === 0} onClick={() => setAll(ids, false)}>
                    All off
                  </button>
                </div>
              </div>

              <ul className="list-none p-1.5">
                {group.rows.map((row) => {
                  const rowOn = row.channels.filter((channel) => isOn(`${row.key}.${channel}`));
                  const silent = rowOn.length === 0;
                  const warn = row.warn && !isOn(`${row.key}.email`);
                  return (
                    <li key={row.key} className="flex flex-wrap items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-[#f8f9fb]">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-lg transition-colors"
                        style={silent ? { background: "#f3f4f6", color: "#9ca3af" } : { background: group.tint, color: group.color }}
                      >
                        <row.icon size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[13px] font-semibold ${silent ? "text-[#6b7280]" : "text-[#0b0c24]"}`}>{row.label}</span>
                          {silent ? <span className="rounded-full bg-[#f3f4f6] px-2 py-px text-[10.5px] font-semibold text-[#6b7280]">Not sent</span> : null}
                        </div>
                        <div className="text-[12px] leading-snug text-[#6b7280]">{row.about}</div>
                        {warn ? (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[#fffbeb] px-2 py-1 text-[11.5px] font-medium text-[#b45309]">
                            <TriangleAlert size={12} strokeWidth={2.25} className="shrink-0" /> {row.warn}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2 max-sm:w-full max-sm:justify-end">
                        {(["email", "bell"] as const).map((channel) =>
                          row.channels.includes(channel) ? (
                            <ChannelToggle
                              key={channel}
                              channel={channel}
                              on={isOn(`${row.key}.${channel}`)}
                              name={row.label}
                              disabled={saving}
                              onToggle={() => toggle(`${row.key}.${channel}`)}
                            />
                          ) : (
                            <NoChannel key={channel} channel={channel} />
                          ),
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {/* Changes not saved yet: said at the foot of the window, with the way to save them. */}
        {changed ? (
          <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c7d2fe] bg-white px-4.5 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
            <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-[#1f2530]">
              <span className="size-2 rounded-full bg-[#f59e0b]" /> You have unsaved changes for {client.companyName}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className={quietButton} disabled={saving} onClick={discard}>
                Discard
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 text-[12.5px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-wait"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />} {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* At a glance: how much reaches this client, and how the switches work. */}
      <aside className="flex flex-col gap-4.5 lg:sticky lg:top-6">
        <div className={`${cardClass} p-4.5`}>
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white" style={{ background: avatarColorFor(client._id) }}>
              {initialsOf(client.companyName)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold text-[#0b0c24]">{client.companyName}</div>
              <div className="truncate text-[12px] text-[#6b7280]">{client.email}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <Meter icon={Mail} label="Emails" on={onCount(EMAIL_SWITCHES)} total={EMAIL_SWITCHES.length} />
            <Meter icon={Bell} label="Portal notifications" on={onCount(BELL_SWITCHES)} total={BELL_SWITCHES.length} />
          </div>
        </div>

        <div className={`${cardClass} p-4.5`}>
          <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold text-[#0b0c24]">
            <Info size={15} strokeWidth={2} className="text-[#4b5260]" /> How it works
          </div>
          <ul className="flex list-none flex-col gap-2.5 text-[12px] leading-snug text-[#4b5563]">
            <li className="flex gap-2">
              <Mail size={14} strokeWidth={2} className="mt-px shrink-0 text-[#6b7280]" />
              <span>
                <b className="font-semibold text-[#0b0c24]">Email</b> goes to their inbox.
              </span>
            </li>
            <li className="flex gap-2">
              <Bell size={14} strokeWidth={2} className="mt-px shrink-0 text-[#6b7280]" />
              <span>
                <b className="font-semibold text-[#0b0c24]">Bell</b> shows in their client portal.
              </span>
            </li>
            <li className="flex gap-2">
              <Check size={14} strokeWidth={2.25} className="mt-px shrink-0 text-[#16a34a]" />
              <span>Turn messages on or off, then Save. They apply to everything sent from then on.</span>
            </li>
            <li className="flex gap-2">
              <Info size={14} strokeWidth={2} className="mt-px shrink-0 text-[#6b7280]" />
              <span>The welcome email isn&apos;t listed: it goes the moment a client is added.</span>
            </li>
            <li className="flex gap-2">
              <Info size={14} strokeWidth={2} className="mt-px shrink-0 text-[#6b7280]" />
              <span>With the Messages bell off, every message is emailed on its own.</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default ClientMessages;
