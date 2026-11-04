"use client";

import { useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarCog,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Info,
  Link2,
  List,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Unplug,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  connectGoogleAction,
  disconnectGoogleAction,
  listCalendarEventsAction,
  markMeetingAction,
  type CalendarEvent,
  type MeetingOutcome,
  type CalendarEvents,
  type GoogleAccounts,
} from "@/app/actions/calendar";
import { pageDesc, pageTitle } from "@/component/shared/ui";
import BookingHours from "./BookingHours";
import {
  addDays,
  byDay,
  dayKey,
  endOf,
  format,
  rangeOf,
  sameDay,
  startOf,
  startOfWeek,
  step,
  timeOf,
  titleOf,
  whenOf,
  type CalendarMode,
} from "./calendarDates";

// The team's meetings, read from the Google accounts connected here (backend: /calendar) and
// shown in the portal's own Month, Week and Agenda views — each matched to its client.

const MODES: { mode: CalendarMode; label: string; icon: typeof CalendarDays }[] = [
  { mode: "month", label: "Month", icon: CalendarDays },
  { mode: "week", label: "Week", icon: CalendarRange },
  { mode: "agenda", label: "Agenda", icon: List },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_CELL_EVENTS = 3;

// One colour per connected account, in the order they were connected.
const ACCOUNT_COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#db2777", "#0891b2", "#4f46e5", "#65a30d"];

// Upcoming meetings are yellow, held ones green, missed ones red. Google can't say whether a
// meeting was held: a past one counts as done unless the team marks it missed — or every guest
// declined it.
type MeetingStatus = "upcoming" | "done" | "missed";
const STATUS: Record<MeetingStatus, { label: string; color: string; soft: string; text: string }> = {
  upcoming: { label: "Upcoming", color: "#d4a106", soft: "#fef9c3", text: "#854d0e" },
  done: { label: "Done", color: "#16a34a", soft: "#dcfce7", text: "#15803d" },
  missed: { label: "Missed", color: "#dc2626", soft: "#fee2e2", text: "#b91c1c" },
};

const meetingStatus = (event: CalendarEvent, now: Date): MeetingStatus => {
  if (endOf(event) > now) return "upcoming";
  if (event.outcome) return event.outcome;
  const guests = event.guests.filter((guest) => !guest.organizer);
  return guests.length && guests.every((guest) => guest.status === "declined") ? "missed" : "done";
};

// What Google said when it sent the browser back here (backend: googleCalendarCallback).
const OUTCOMES: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "Google Calendar connected" },
  denied: { ok: false, text: "Google sign-in was cancelled" },
  expired: { ok: false, text: "That took too long — please try connecting again" },
  not_allowed: { ok: false, text: "You aren't allowed to connect a calendar" },
  no_calendar: { ok: false, text: "Calendar access wasn't allowed — tick the calendar box on Google's screen" },
  error: { ok: false, text: "Couldn't connect Google Calendar. Please try again" },
};

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const ghostButton =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-3 text-[12.5px] font-medium text-[#1f2530] no-underline transition-colors hover:bg-[#f3f4f6] disabled:cursor-wait disabled:opacity-60";
const darkButton =
  "inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-60";

// Rendered in the browser only: "today", the month shown and every time depend on the viewer's
// own clock and time zone, which the server doesn't know.
const noChanges = () => () => {};

type Selected = { kind: "event"; event: CalendarEvent } | { kind: "day"; day: Date } | null;

const CalendarView = ({ google, outcome }: { google: GoogleAccounts | null; outcome?: string }) => {
  const router = useRouter();
  const inBrowser = useSyncExternalStore(noChanges, () => true, () => false);
  const [mode, setMode] = useState<CalendarMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<Selected>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [reloads, setReloads] = useState(0);
  const [connecting, startConnecting] = useTransition();

  const accounts = useMemo(() => google?.accounts ?? [], [google]);
  const colorOf = useMemo(() => {
    const colors = new Map(accounts.map((account, index) => [account._id, ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]]));
    return (accountId: string) => colors.get(accountId) ?? "#64748b";
  }, [accounts]);
  const readable = accounts.filter((account) => !account.broken);

  // Say how connecting went, once, and take it out of the address.
  useEffect(() => {
    if (!outcome) return;
    const said = OUTCOMES[outcome] ?? OUTCOMES.error;
    if (said.ok) toast.success(said.text);
    else toast.error(said.text);
    router.replace("/calendar");
  }, [outcome, router]);

  const today = new Date();

  // The meetings in the stretch shown; loaded again whenever it changes.
  const { from, to } = rangeOf(mode, anchor);
  const wanted = readable.length ? `${from.toISOString()}|${to.toISOString()}|${readable.map((account) => account._id).join(",")}|${reloads}` : "";
  const [loaded, setLoaded] = useState<{ key: string; data?: CalendarEvents; error?: string } | null>(null);
  useEffect(() => {
    if (!wanted) return;
    let live = true;
    const [fromIso, toIso] = wanted.split("|");
    void listCalendarEventsAction(fromIso, toIso).then((result) => {
      if (live) setLoaded(result.ok ? { key: wanted, data: result.data } : { key: wanted, error: result.error });
    });
    return () => {
      live = false;
    };
  }, [wanted]);
  const loading = Boolean(wanted) && loaded?.key !== wanted;
  const current = loaded?.key === wanted ? loaded : null;
  const events = useMemo(() => current?.data?.events ?? [], [current]);
  const eventsByDay = useMemo(() => byDay(events), [events]);

  // How each meeting stands: upcoming, done or missed — with the team's marks made on this page.
  const [marks, setMarks] = useState<Record<string, MeetingOutcome | null>>({});
  const [marking, startMarking] = useTransition();
  const statusOfEvent = (event: CalendarEvent) => meetingStatus(event.id in marks ? { ...event, outcome: marks[event.id] } : event, today);
  const eventColor = (event: CalendarEvent) => STATUS[statusOfEvent(event)].color;
  // A day's colour: yellow while any meeting on it is still to come, then red if one was missed, else green.
  const dayColor = (list: CalendarEvent[]) => {
    if (!list.length) return null;
    const statuses = list.map(statusOfEvent);
    return STATUS[statuses.includes("upcoming") ? "upcoming" : statuses.includes("missed") ? "missed" : "done"].color;
  };
  const mark = (event: CalendarEvent, outcome: MeetingOutcome | null) =>
    startMarking(async () => {
      const result = await markMeetingAction(event.accountId, event.id.slice(event.accountId.length + 1), outcome);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setMarks((now) => ({ ...now, [event.id]: outcome }));
      toast.success(outcome === "missed" ? "Marked as missed" : outcome === "done" ? "Marked as done" : "Mark removed");
    });

  const connect = () =>
    startConnecting(async () => {
      const result = await connectGoogleAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.location.assign(result.data.url);
    });

  const goToday = () => setAnchor(new Date());

  const failed = current?.data?.failed ?? [];
  // Until there is a calendar to read, the page is laid out all the same, saying why it is empty.
  const setupNote = !google
    ? "The calendar couldn't be loaded. Refresh the page to try again."
    : !google.configured
      ? "Google sign-in isn't set up on the server yet — see Connected calendars."
      : !accounts.length
        ? "No Google Calendar is connected yet. Connect one to see its meetings here."
        : !readable.length
          ? "Google no longer gives access to the connected calendars. Connect them again."
          : null;

  // The figures above the calendar, for the stretch it shows.
  const counted = inBrowser && Boolean(current?.data);
  const todayInView = today >= from && today < to;
  // While the meetings load, the figures that come from them wait as placeholders.
  const figuresLoading = Boolean(readable.length) && (!inBrowser || loading);
  const tiles: { icon: LucideIcon; label: string; sub: string; value: string; color: string; background: string; loading?: boolean }[] = [
    { icon: CalendarDays, label: "Meetings", sub: "In this view", value: counted ? String(events.length) : "—", color: "#2f5fd8", background: "#d9e0ef" },
    {
      icon: Clock,
      label: "Today",
      sub: "Meetings today",
      value: counted && todayInView ? String((eventsByDay.get(dayKey(today)) ?? []).length) : "—",
      color: "#d97706",
      background: "#f8e4c6",
    },
    {
      icon: Building2,
      label: "Client Meetings",
      sub: "With one of your clients",
      value: counted ? String(events.filter((event) => event.client).length) : "—",
      color: "#7c3aed",
      background: "#ece4fb",
    },
    { icon: Link2, label: "Calendars", sub: "Connected Google accounts", value: String(readable.length), color: "#16a34a", background: "#d2e7d8" },
  ];

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={pageTitle}>Calendar</div>
          <div className={pageDesc}>Meetings from the team&apos;s Google Calendars — which day, what time, and with which client.</div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* The connected Google accounts — and connecting one — in a window of their own. */}
          <button
            type="button"
            onClick={() => setAccountsOpen(true)}
            className={`relative inline-flex h-9.5 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-[12.5px] font-medium transition-colors ${
              accounts.length
                ? "border border-[#e2e5e9] bg-white text-[#1f2530] hover:bg-[#f3f4f6]"
                : "bg-[#0b0c24] text-white hover:bg-[#1e2140]"
            }`}
          >
            <CalendarCog size={15} strokeWidth={2} />
            {accounts.length ? "Calendars" : "Connect calendar"}
            {accounts.length ? (
              <span className="rounded-full bg-[#f1f5f9] px-1.75 py-px text-[11px] font-semibold text-[#475569]">{accounts.length}</span>
            ) : null}
            {accounts.some((account) => account.broken) ? (
              <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#dc2626] ring-2 ring-white" aria-label="A calendar needs connecting again" />
            ) : null}
          </button>
          <span className="h-6 w-px bg-[#e2e5e9] max-[640px]:hidden" aria-hidden="true" />
        <nav aria-label="Calendar view" className="flex items-center gap-1">
          {MODES.map(({ mode: each, label, icon: Icon }) => (
            <button
              key={each}
              type="button"
              aria-pressed={mode === each}
              onClick={() => setMode(each)}
              className={`inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium transition-colors ${
                mode === each ? "bg-[#0b0c24] text-white" : "text-[#4b5260] hover:text-[#0b0c24]"
              }`}
            >
              <Icon size={14} strokeWidth={2} /> {label}
            </button>
          ))}
        </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <SummaryTile key={tile.label} {...tile} loading={tile.label !== "Calendars" && figuresLoading} />
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-5 max-[1200px]:grid-cols-1">
        <section className={`${cardClass} min-w-0 overflow-hidden`}>
          {/* Where the calendar is, and the way to move it. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f3] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <button type="button" className={ghostButton} onClick={goToday}>
                Today
              </button>
              <div className="flex items-center">
                <button type="button" aria-label="Previous" className={iconButton} onClick={() => setAnchor(step(mode, anchor, -1))}>
                  <ChevronLeft size={17} strokeWidth={2} />
                </button>
                <button type="button" aria-label="Next" className={iconButton} onClick={() => setAnchor(step(mode, anchor, 1))}>
                  <ChevronRight size={17} strokeWidth={2} />
                </button>
              </div>
              <h2 className="text-[16px] font-semibold text-[#0b0c24]">{inBrowser ? titleOf(mode, anchor) : " "}</h2>
              {loading ? <Loader2 size={15} className="animate-spin text-[#94a3b8]" aria-label="Loading" /> : null}
            </div>
            <div className="flex items-center gap-3 max-[640px]:order-last max-[640px]:w-full">
              {(Object.keys(STATUS) as MeetingStatus[]).map((status) => (
                <span key={status} className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#4b5260]">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS[status].color }} /> {STATUS[status].label}
                </span>
              ))}
            </div>
            <button type="button" className={ghostButton} disabled={loading || !readable.length} onClick={() => setReloads((count) => count + 1)}>
              <RefreshCw size={13} strokeWidth={2} /> Refresh
            </button>
          </div>

          {setupNote ? <Banner tone="info">{setupNote}</Banner> : null}
          {current?.error ? (
            <Banner tone="error">
              {current.error}{" "}
              <button type="button" className="cursor-pointer font-semibold underline" onClick={() => setReloads((count) => count + 1)}>
                Try again
              </button>
            </Banner>
          ) : null}
          {failed.length ? (
            <Banner tone="warn">
              {failed.map((account) => (
                <span key={account._id} className="block">
                  Couldn&apos;t read {account.email}
                  {account.lost ? " — Google no longer gives access: connect it again." : account.reason ? `: ${account.reason}` : " this time."}
                </span>
              ))}
            </Banner>
          ) : null}

          {!inBrowser ? (
            <MonthSkeleton />
          ) : mode === "month" ? (
            <MonthGrid anchor={anchor} today={today} eventsByDay={eventsByDay} colorOf={eventColor} dayColorOf={dayColor} loading={loading} onSelect={setSelected} />
          ) : mode === "week" ? (
            <WeekColumns anchor={anchor} today={today} eventsByDay={eventsByDay} colorOf={eventColor} dayColorOf={dayColor} loading={loading} onSelect={setSelected} />
          ) : (
            <Agenda from={from} to={to} today={today} eventsByDay={eventsByDay} colorOf={eventColor} loading={loading} onSelect={setSelected} />
          )}
        </section>

        <aside className="sticky top-5 flex flex-col gap-4 max-[1200px]:static">
          {google?.configured && accounts.length ? <BookingHours google={google} connecting={connecting} onConnect={connect} /> : null}
          {readable.length ? <ComingUp events={events} now={today} colorOf={eventColor} loading={!inBrowser || loading} onSelect={setSelected} /> : null}
        </aside>
      </div>

      {accountsOpen ? (
        <Dialog label="Connected calendars" onClose={() => setAccountsOpen(false)}>
          <Accounts google={google} colorOf={colorOf} connecting={connecting} onConnect={connect} />
        </Dialog>
      ) : null}

      {selected?.kind === "event" ? (
        <EventDialog event={selected.event} status={statusOfEvent(selected.event)} marking={marking} onMark={mark} onClose={() => setSelected(null)} />
      ) : selected?.kind === "day" ? (
        <DayDialog
          day={selected.day}
          events={eventsByDay.get(dayKey(selected.day)) ?? []}
          colorOf={eventColor}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
};

const iconButton = "inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#4b5260] transition-colors hover:bg-[#f3f4f6] hover:text-[#0b0c24]";

type ViewProps = {
  anchor: Date;
  today: Date;
  eventsByDay: Map<string, CalendarEvent[]>;
  colorOf: (event: CalendarEvent) => string;
  // A day with meetings takes the colour of where they stand (null: none that day).
  dayColorOf: (events: CalendarEvent[]) => string | null;
  // The meetings are still on their way: placeholders stand in for them.
  loading: boolean;
  onSelect: (selected: Selected) => void;
};

// ── Month ────────────────────────────────────────────────────────────────────

const MonthGrid = ({ anchor, today, eventsByDay, colorOf, dayColorOf, loading, onSelect }: ViewProps) => {
  const first = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const days = Array.from({ length: 42 }, (_, index) => addDays(first, index));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-180">
        <div className="grid grid-cols-7 border-b border-[#eef0f3] bg-[#fafbfc]">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="px-3 py-2 text-[11px] font-semibold tracking-wide text-[#8a94a3] uppercase">
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const list = eventsByDay.get(dayKey(day)) ?? [];
            const inMonth = day.getMonth() === anchor.getMonth();
            const isToday = sameDay(day, today);
            const tint = dayColorOf(list);
            return (
              <div
                key={dayKey(day)}
                style={
                  tint
                    ? { backgroundColor: `${tint}2e`, boxShadow: `inset 0 3px 0 ${tint}${isToday ? ", inset 0 0 0 2px #2563eb55" : ""}` }
                    : isToday
                      ? { boxShadow: "inset 0 0 0 2px #2563eb40" }
                      : undefined
                }
                className={`flex min-h-28 min-w-0 flex-col gap-1 border-[#eef0f3] p-1.5 ${index % 7 ? "border-l" : ""} ${index >= 7 ? "border-t" : ""} ${
                  inMonth ? "bg-white" : "bg-[#fafbfc]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect({ kind: "day", day })}
                  className={`ml-0.5 grid size-6.5 cursor-pointer place-items-center rounded-full text-[12px] font-semibold transition-colors ${
                    isToday ? "bg-[#2563eb] text-white" : inMonth ? "text-[#1f2530] hover:bg-[#f1f5f9]" : "text-[#b0b7c3] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {day.getDate()}
                </button>
                {loading
                  ? Array.from({ length: BONES[(index * 3 + day.getDate()) % BONES.length] }, (_, bone) => <Bone key={bone} className="h-5.5 w-full" />)
                  : list.slice(0, MONTH_CELL_EVENTS).map((event) => (
                      <EventChip key={event.id} event={event} color={colorOf(event)} onClick={() => onSelect({ kind: "event", event })} />
                    ))}
                {list.length > MONTH_CELL_EVENTS ? (
                  <button
                    type="button"
                    onClick={() => onSelect({ kind: "day", day })}
                    className="cursor-pointer rounded px-1.5 text-left text-[11px] font-semibold text-[#64748b] hover:bg-[#f1f5f9]"
                  >
                    +{list.length - MONTH_CELL_EVENTS} more
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EventChip = ({ event, color, onClick }: { event: CalendarEvent; color: string; onClick: () => void }) =>
  event.allDay ? (
    <button
      type="button"
      onClick={onClick}
      title={event.title}
      style={{ backgroundColor: color }}
      className="w-full cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold text-white hover:opacity-90"
    >
      {event.title}
    </button>
  ) : (
    <button
      type="button"
      onClick={onClick}
      title={`${timeOf(startOf(event))} ${event.title}${event.client ? ` · ${event.client.companyName}` : ""}`}
      style={{ borderLeftColor: color }}
      className="flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md border-l-[3px] bg-white/85 px-1.5 py-1 text-left text-[11px] transition-[filter] hover:brightness-95"
    >
      <span className="shrink-0 font-medium text-[#475569]">{timeOf(startOf(event))}</span>
      <span className="truncate font-semibold text-[#1f2530]">{event.title}</span>
    </button>
  );

// ── Week ─────────────────────────────────────────────────────────────────────

const WeekColumns = ({ anchor, today, eventsByDay, colorOf, dayColorOf, loading, onSelect }: ViewProps) => {
  const first = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(first, index));
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-215 grid-cols-7">
        {days.map((day, index) => {
          const list = eventsByDay.get(dayKey(day)) ?? [];
          const isToday = sameDay(day, today);
          return (
            <div
              key={dayKey(day)}
              style={dayColorOf(list) ? { backgroundColor: `${dayColorOf(list)}2e` } : undefined}
              className={`flex min-h-130 min-w-0 flex-col border-[#eef0f3] ${index ? "border-l" : ""}`}
            >
              <div className={`border-b border-[#eef0f3] px-3 py-2.5 ${isToday ? "bg-[#eff6ff]" : "bg-[#fafbfc]"}`}>
                <div className="text-[11px] font-semibold tracking-wide text-[#8a94a3] uppercase">{WEEKDAYS[index]}</div>
                <div className={`text-[18px] font-semibold ${isToday ? "text-[#2563eb]" : "text-[#1f2530]"}`}>{day.getDate()}</div>
              </div>
              <div className="flex flex-col gap-1.5 p-1.5">
                {loading ? (
                  Array.from({ length: (index % 3) + 1 }, (_, bone) => <Bone key={bone} className="h-16 w-full rounded-lg" />)
                ) : (
                  <>
                    {list.map((event) => (
                      <EventCard key={event.id} event={event} color={colorOf(event)} onClick={() => onSelect({ kind: "event", event })} />
                    ))}
                    {!list.length ? <div className="px-1.5 py-2 text-[11.5px] text-[#b0b7c3]">No meetings</div> : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EventCard = ({ event, color, onClick }: { event: CalendarEvent; color: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full min-w-0 cursor-pointer rounded-lg border-l-[3px] bg-white/85 px-2.5 py-2 text-left transition-[filter] hover:brightness-95"
    style={{ borderLeftColor: color }}
  >
    <div className="text-[11px] font-medium text-[#64748b]">{event.allDay ? "All day" : `${timeOf(startOf(event))} – ${timeOf(new Date(event.end))}`}</div>
    <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug font-semibold text-[#1f2530]">{event.title}</div>
    {event.client ? (
      <div className="mt-1 flex items-center gap-1 truncate text-[11px] font-medium text-[#2563eb]">
        <Building2 size={11} strokeWidth={2} className="shrink-0" /> {event.client.companyName}
      </div>
    ) : null}
  </button>
);

// ── Agenda ───────────────────────────────────────────────────────────────────

const Agenda = ({
  from,
  to,
  today,
  eventsByDay,
  colorOf,
  loading,
  onSelect,
}: Omit<ViewProps, "anchor" | "dayColorOf"> & { from: Date; to: Date; loading: boolean }) => {
  const days: Date[] = [];
  for (let day = from; day < to; day = addDays(day, 1)) if (eventsByDay.has(dayKey(day))) days.push(day);

  if (loading) {
    return (
      <div className="divide-y divide-[#eef0f3]">
        {[2, 1, 3].map((rows, group) => (
          <div key={group} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 px-5 py-4 max-[640px]:grid-cols-1 max-[640px]:gap-2">
            <div className="flex flex-col gap-1.5">
              <Bone className="h-4 w-20" />
              <Bone className="h-3 w-24" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: rows }, (_, row) => (
                <Bone key={row} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-2 px-6 text-center text-[13px] text-[#6b7280]">
        <CalendarDays size={22} strokeWidth={1.8} className="text-[#b0b7c3]" />
        No meetings in these 30 days.
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#eef0f3]">
      {days.map((day) => (
        <div key={dayKey(day)} className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 px-5 py-4 max-[640px]:grid-cols-1 max-[640px]:gap-2">
          <div>
            <div className={`text-[13px] font-semibold ${sameDay(day, today) ? "text-[#2563eb]" : "text-[#1f2530]"}`}>
              {sameDay(day, today) ? "Today" : format(day, { weekday: "long" })}
            </div>
            <div className="text-[12px] text-[#8a94a3]">{format(day, { month: "short", day: "numeric", year: "numeric" })}</div>
          </div>
          <div className="flex flex-col gap-2">
            {(eventsByDay.get(dayKey(day)) ?? []).map((event) => (
              <AgendaRow key={event.id} event={event} color={colorOf(event)} onClick={() => onSelect({ kind: "event", event })} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const AgendaRow = ({ event, color, onClick }: { event: CalendarEvent; color: string; onClick: () => void }) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#eef0f3] px-3.5 py-2.5 transition-colors hover:border-[#dbe3ed] hover:bg-[#fafbfc]">
    <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
    <button type="button" onClick={onClick} className="min-w-0 flex-1 cursor-pointer text-left">
      <div className="truncate text-[13px] font-semibold text-[#1f2530]">{event.title}</div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-[#64748b]">
        <span className="inline-flex items-center gap-1">
          <Clock size={11} strokeWidth={2} /> {event.allDay ? "All day" : `${timeOf(startOf(event))} – ${timeOf(new Date(event.end))}`}
        </span>
        {event.client ? (
          <span className="inline-flex items-center gap-1 font-medium text-[#2563eb]">
            <Building2 size={11} strokeWidth={2} /> {event.client.companyName}
          </span>
        ) : null}
        {event.guests.length ? (
          <span className="inline-flex items-center gap-1">
            <Users size={11} strokeWidth={2} /> {event.guests.length}
          </span>
        ) : null}
      </div>
    </button>
    {event.meetLink ? (
      <a
        href={event.meetLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#eff6ff] px-3 text-[12px] font-semibold text-[#2563eb] no-underline hover:bg-[#dbeafe]"
      >
        <Video size={13} strokeWidth={2} /> Join
      </a>
    ) : null}
  </div>
);

// ── Side: accounts and what's next ───────────────────────────────────────────

const Accounts = ({
  google,
  colorOf,
  connecting,
  onConnect,
}: {
  google: GoogleAccounts | null;
  colorOf: (accountId: string) => string;
  connecting: boolean;
  onConnect: () => void;
}) => {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [, startRemoving] = useTransition();

  const disconnect = (id: string) => {
    setRemoving(id);
    startRemoving(async () => {
      const result = await disconnectGoogleAction(id);
      setRemoving(null);
      setConfirming(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Google account disconnected");
      router.refresh();
    });
  };

  const title = (
    <div className="mb-1 flex items-center gap-2 pr-10">
      <span className="text-[17px] font-semibold text-[#0b0c24]">Connected calendars</span>
      <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#64748b]">{google?.accounts.length ?? 0}</span>
    </div>
  );

  const intro = (
    <p className="mb-4 text-[12.5px] leading-relaxed text-[#64748b]">
      Meetings on these Google Calendars show on this page for the whole team. Calls clients book are added to the booking calendar.
    </p>
  );

  if (!google) {
    return (
      <div className="">
        {title}
        {intro}
        <p className="text-[12px] leading-relaxed text-[#6b7280]">The connected calendars couldn&apos;t be loaded. Refresh the page to try again.</p>
      </div>
    );
  }

  // Google sign-in needs the server's OAuth client first.
  if (!google.configured) {
    return (
      <div className="">
        {title}
        {intro}
        <div className="rounded-xl bg-[#fffbeb] px-3.5 py-3 text-[12px] leading-relaxed text-[#92400e]">
          <div className="mb-1.5 flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={13} strokeWidth={2.25} /> Google sign-in isn&apos;t set up
          </div>
          <ol className="ml-4 list-decimal space-y-1">
            <li>
              Add <Code>GOOGLE_CLIENT_ID</Code> and <Code>GOOGLE_CLIENT_SECRET</Code> to the backend&apos;s environment.
            </li>
            <li>Restart the backend.</li>
            <li>Come back here and connect a Google account.</li>
          </ol>
        </div>
      </div>
    );
  }

  if (!google.accounts.length) {
    return (
      <div className="">
        {title}
        {intro}
        <div className="flex flex-col items-center rounded-xl border border-dashed border-[#dbe3ed] px-4 py-6 text-center">
          <span className="mb-3 grid size-11 place-items-center rounded-xl bg-[#eef1f6] text-[#4b5260]">
            <CalendarDays size={20} strokeWidth={1.8} />
          </span>
          <div className="text-[13px] font-semibold text-[#0b0c24]">No calendar connected</div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[#6b7280]">Sign in with any Google account to show its meetings here.</p>
          {google.canConnect ? (
            <button type="button" disabled={connecting} onClick={onConnect} className={`${darkButton} mt-4 w-full justify-center`}>
              {connecting ? <Loader2 size={14} className="animate-spin" /> : <GoogleMark />} Connect Google Calendar
            </button>
          ) : (
            <span className="mt-3 text-[11.5px] font-medium text-[#6b7280]">Ask a manager to connect one.</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {title}
      {intro}
      <div className="flex flex-col gap-2">
        {google.accounts.map((account) => (
          <div key={account._id} className="rounded-xl border border-[#eef0f3] px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(account._id) }} />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold [overflow-wrap:anywhere] text-[#1f2530]">{account.email}</div>
                {account.booking?.enabled && !account.broken ? (
                  <span className="mt-0.5 inline-flex rounded-full bg-[#dcfce7] px-1.5 py-px text-[10px] font-semibold text-[#15803d]">Client bookings</span>
                ) : null}
                <div className="text-[11px] text-[#8a94a3]">
                  {account.connectedBy?.fullName ? `Connected by ${account.connectedBy.fullName}` : "Connected"}
                </div>
                {account.broken ? (
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#b42318]">
                    <AlertTriangle size={11} strokeWidth={2.25} /> Access lost — connect it again
                  </div>
                ) : null}
              </div>
              {google.canConnect ? (
                confirming === account._id ? null : (
                  <button
                    type="button"
                    aria-label={`Disconnect ${account.email}`}
                    title="Disconnect"
                    onClick={() => setConfirming(account._id)}
                    className="-mt-0.5 -mr-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                  >
                    <Unplug size={14} strokeWidth={2} />
                  </button>
                )
              ) : null}
            </div>
            {confirming === account._id ? (
              <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-[#f1f5f9] pt-2">
                <span className="mr-auto text-[11.5px] font-medium text-[#b42318]">Disconnect?</span>
                <button
                  type="button"
                  disabled={removing === account._id}
                  onClick={() => setConfirming(null)}
                  className="cursor-pointer rounded-md px-2 py-1 text-[11.5px] font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={removing === account._id}
                  onClick={() => disconnect(account._id)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-[#dc2626] px-2.5 py-1 text-[11.5px] font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {removing === account._id ? <Loader2 size={11} className="animate-spin" /> : null} Disconnect
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {google.canConnect ? (
        <button type="button" disabled={connecting} onClick={onConnect} className={`${ghostButton} mt-3 w-full justify-center`}>
          {connecting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} strokeWidth={2} />} Connect another account
        </button>
      ) : null}
    </div>
  );
};

const ComingUp = ({
  events,
  now,
  colorOf,
  loading,
  onSelect,
}: {
  events: CalendarEvent[];
  now: Date;
  colorOf: (event: CalendarEvent) => string;
  loading: boolean;
  onSelect: (selected: Selected) => void;
}) => {
  const next = events.filter((event) => !event.allDay && new Date(event.end) > now).slice(0, 5);
  return (
    <div className={`${cardClass} p-4.5`}>
      <div className="mb-3 text-[14px] font-semibold text-[#0b0c24]">Coming up</div>
      {loading ? (
        <div className="flex flex-col gap-3 px-2 py-1">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-2.5">
              <Bone className="mt-1 size-2 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Bone className="h-3.5 w-4/5" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : next.length ? (
        <div className="flex flex-col gap-1">
          {next.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect({ kind: "event", event })}
              className="flex min-w-0 cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-[#f8fafc]"
            >
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf(event) }} />
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold text-[#1f2530]">{event.title}</span>
                <span className="block text-[11px] text-[#8a94a3]">
                  {format(startOf(event), { weekday: "short", month: "short", day: "numeric" })} · {timeOf(startOf(event))}
                  {event.client ? ` · ${event.client.companyName}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[12px] text-[#8a94a3]">Nothing else in this view.</div>
      )}
    </div>
  );
};

// ── Dialogs ──────────────────────────────────────────────────────────────────

const Dialog = ({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.24)]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
        >
          <X size={17} strokeWidth={2} />
        </button>
        {children}
      </section>
    </div>
  );
};

const GUEST_STATUS: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  accepted: { label: "Going", icon: <Check size={11} strokeWidth={3} />, className: "bg-[#dcfce7] text-[#15803d]" },
  declined: { label: "Not going", icon: <X size={11} strokeWidth={3} />, className: "bg-[#fee2e2] text-[#b91c1c]" },
  tentative: { label: "Maybe", icon: <CircleHelp size={11} strokeWidth={2.5} />, className: "bg-[#fef3c7] text-[#b45309]" },
};

const EventDialog = ({
  event,
  status,
  marking,
  onMark,
  onClose,
}: {
  event: CalendarEvent;
  status: MeetingStatus;
  marking: boolean;
  onMark: (event: CalendarEvent, outcome: MeetingOutcome | null) => void;
  onClose: () => void;
}) => (
  <Dialog label={event.title} onClose={onClose}>
    <div className="flex items-start gap-3 pr-8">
      <span className="mt-1.5 size-3 shrink-0 rounded-sm" style={{ backgroundColor: STATUS[status].color }} />
      <div className="min-w-0">
        <h2 className="text-[18px] leading-snug font-semibold [overflow-wrap:anywhere] text-[#0f172a]">{event.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[#475569]">
          {whenOf(event)}
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: STATUS[status].soft, color: STATUS[status].text }}>
            {STATUS[status].label}
          </span>
        </div>
      </div>
    </div>

    {/* Once it has happened: whether it was held. */}
    {status !== "upcoming" ? (
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#f8fafc] px-3.5 py-2.5">
        <span className="mr-auto text-[12px] font-medium text-[#475569]">How did it go?</span>
        {(["done", "missed"] as const).map((outcome) => (
          <button
            key={outcome}
            type="button"
            disabled={marking || status === outcome}
            aria-pressed={status === outcome}
            onClick={() => onMark(event, outcome)}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors disabled:cursor-default"
            style={
              status === outcome
                ? { backgroundColor: STATUS[outcome].color, borderColor: STATUS[outcome].color, color: "#fff" }
                : { backgroundColor: "#fff", borderColor: "#e2e5e9", color: STATUS[outcome].text }
            }
          >
            {outcome === "done" ? <Check size={13} strokeWidth={2.5} /> : <X size={13} strokeWidth={2.5} />}
            {outcome === "done" ? "Done" : "Missed"}
          </button>
        ))}
        {marking ? <Loader2 size={14} className="animate-spin text-[#94a3b8]" /> : null}
      </div>
    ) : null}

    <div className="mt-4 flex flex-wrap gap-2">
      {event.meetLink ? (
        <a href={event.meetLink} target="_blank" rel="noopener noreferrer" className={`${darkButton} no-underline`}>
          <Video size={14} strokeWidth={2} /> Join meeting
        </a>
      ) : null}
      {event.client ? (
        <Link href={`/clients/${event.client._id}`} className={ghostButton}>
          <Building2 size={13} strokeWidth={2} /> {event.client.companyName}
        </Link>
      ) : null}
      {event.link ? (
        <a href={event.link} target="_blank" rel="noopener noreferrer" className={ghostButton}>
          Open in Google <ArrowUpRight size={13} strokeWidth={2.25} />
        </a>
      ) : null}
    </div>

    <div className="mt-5 flex flex-col gap-3 text-[12.5px] text-[#334155]">
      {event.location ? (
        <div className="flex items-start gap-2.5">
          <MapPin size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[#94a3b8]" />
          <span className="[overflow-wrap:anywhere]">{event.location}</span>
        </div>
      ) : null}
      <div className="flex items-start gap-2.5">
        <CalendarDays size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[#94a3b8]" />
        <span className="[overflow-wrap:anywhere]">On {event.accountEmail}</span>
      </div>
      {event.guests.length ? (
        <div className="flex items-start gap-2.5">
          <Users size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[#94a3b8]" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="font-semibold text-[#1f2530]">{event.guests.length === 1 ? "1 guest" : `${event.guests.length} guests`}</span>
            {event.guests.map((guest) => {
              const status = GUEST_STATUS[guest.status ?? ""];
              return (
                <div key={guest.email} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[#1f2530]">
                      {guest.name || guest.email}
                      {guest.organizer ? <span className="ml-1.5 text-[11px] font-normal text-[#94a3b8]">Organizer</span> : null}
                    </div>
                    {guest.name ? <div className="truncate text-[11px] text-[#94a3b8]">{guest.email}</div> : null}
                  </div>
                  {status ? (
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${status.className}`}>
                      {status.icon} {status.label}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10.5px] font-semibold text-[#64748b]">Awaiting</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {event.description ? (
        <div className="rounded-xl bg-[#f8fafc] px-3.5 py-3 text-[12px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] text-[#475569]">
          {event.description}
        </div>
      ) : null}
    </div>
  </Dialog>
);

const DayDialog = ({
  day,
  events,
  colorOf,
  onSelect,
  onClose,
}: {
  day: Date;
  events: CalendarEvent[];
  colorOf: (event: CalendarEvent) => string;
  onSelect: (selected: Selected) => void;
  onClose: () => void;
}) => (
  <Dialog label={format(day, { weekday: "long", month: "long", day: "numeric" })} onClose={onClose}>
    <h2 className="pr-8 text-[18px] font-semibold text-[#0f172a]">{format(day, { weekday: "long", month: "long", day: "numeric" })}</h2>
    <div className="mt-1 text-[12.5px] text-[#64748b]">{events.length === 1 ? "1 meeting" : `${events.length} meetings`}</div>
    <div className="mt-4 flex flex-col gap-2">
      {events.map((event) => (
        <AgendaRow key={event.id} event={event} color={colorOf(event)} onClick={() => onSelect({ kind: "event", event })} />
      ))}
      {!events.length ? <div className="py-6 text-center text-[12.5px] text-[#94a3b8]">No meetings this day.</div> : null}
    </div>
  </Dialog>
);

// ── Small pieces ─────────────────────────────────────────────────────────────

// A grey placeholder, pulsing while what goes in its place loads.
const Bone = ({ className = "" }: { className?: string }) => <span aria-hidden="true" className={`block animate-pulse rounded-md bg-[#e9edf2] ${className}`} />;

// How many placeholders a month's day shows while loading: a fixed mix, so it doesn't jump about.
const BONES = [0, 1, 0, 2, 0, 1, 0];

// The month before the browser takes over (the server doesn't know the viewer's dates).
const MonthSkeleton = () => (
  <div className="overflow-x-auto">
    <div className="min-w-180">
      <div className="grid grid-cols-7 border-b border-[#eef0f3] bg-[#fafbfc]">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="px-3 py-2 text-[11px] font-semibold tracking-wide text-[#8a94a3] uppercase">
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }, (_, index) => (
          <div key={index} className={`flex min-h-28 flex-col gap-1 border-[#eef0f3] p-1.5 ${index % 7 ? "border-l" : ""} ${index >= 7 ? "border-t" : ""}`}>
            <Bone className="ml-0.5 size-6.5 rounded-full" />
            {Array.from({ length: BONES[(index * 3) % BONES.length] }, (_, bone) => (
              <Bone key={bone} className="h-5.5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const SummaryTile = ({
  icon: Icon,
  label,
  sub,
  value,
  color,
  background,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: string;
  color: string;
  background: string;
  loading?: boolean;
}) => (
  <div className={`${cardClass} px-4 pt-3.5 pb-4`}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background, color }}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-[#0b0c24] uppercase">{label}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6b7280]" title={sub}>
          {sub}
        </div>
      </div>
    </div>
    {loading ? <Bone className="mt-3 h-7.5 w-14" /> : <div className="mt-3 text-[30px] leading-none font-semibold text-[#0b0c24]">{value}</div>}
  </div>
);

const Code = ({ children }: { children: React.ReactNode }) => <code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[11.5px]">{children}</code>;

const BANNER_TONES = {
  error: "border-[#fecaca] bg-[#fef2f2] text-[#b42318]",
  warn: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
  info: "border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]",
};

const Banner = ({ tone, children }: { tone: keyof typeof BANNER_TONES; children: React.ReactNode }) => (
  <div
    className={`flex items-start gap-2 border-b px-5 py-2.5 text-[12px] ${BANNER_TONES[tone]}`}
  >
    {tone === "info" ? <Info size={13} strokeWidth={2.25} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} strokeWidth={2.25} className="mt-0.5 shrink-0" />}
    <span>{children}</span>
  </div>
);

// Google's "G", for the connect button.
const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5">
    <path fill="#fff" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.32 2.98-7.35Z" />
    <path fill="#fff" opacity=".85" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.1H3.07v2.58A10 10 0 0 0 12 22Z" />
    <path fill="#fff" opacity=".7" d="M6.41 13.93A6 6 0 0 1 6.1 12c0-.67.11-1.32.31-1.93V7.49H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.51l3.34-2.58Z" />
    <path fill="#fff" opacity=".55" d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.58C7.2 7.73 9.4 5.98 12 5.98Z" />
  </svg>
);

export default CalendarView;
