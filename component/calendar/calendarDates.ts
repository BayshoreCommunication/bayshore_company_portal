import type { CalendarEvent } from "@/app/actions/calendar";

// Dates for the Calendar page, all in the viewer's own time zone. Weeks start on Monday.

export type CalendarMode = "month" | "week" | "agenda";

export const AGENDA_DAYS = 30;

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
export const startOfWeek = (date: Date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7));
export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// The days a view shows, first to last (the last one excluded).
export const rangeOf = (mode: CalendarMode, anchor: Date): { from: Date; to: Date } => {
  if (mode === "week") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 7) };
  }
  if (mode === "agenda") {
    const from = startOfDay(anchor);
    return { from, to: addDays(from, AGENDA_DAYS) };
  }
  // Six whole weeks, so every month fits and the grid never changes height.
  const from = startOfWeek(startOfMonth(anchor));
  return { from, to: addDays(from, 42) };
};

// Where the arrows go from here.
export const step = (mode: CalendarMode, anchor: Date, direction: 1 | -1) => {
  if (mode === "month") return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  return addDays(anchor, direction * (mode === "week" ? 7 : AGENDA_DAYS));
};

// An all-day event's dates are days, not moments: "2026-11-04" is that day here, wherever here is.
const parseDay = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const startOf = (event: CalendarEvent) => (event.allDay ? parseDay(event.start) : new Date(event.start));
export const endOf = (event: CalendarEvent) => (event.allDay ? parseDay(event.end) : new Date(event.end));

// Every day an event is on (one ending at midnight isn't on the day after).
export const daysOf = (event: CalendarEvent): string[] => {
  const start = startOf(event);
  const end = endOf(event);
  const last = end > start ? new Date(end.getTime() - 1) : start;
  const days: string[] = [];
  for (let day = startOfDay(start); day <= last && days.length < 62; day = addDays(day, 1)) days.push(dayKey(day));
  return days;
};

export const byDay = (events: CalendarEvent[]) => {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    for (const key of daysOf(event)) {
      const list = map.get(key);
      if (list) list.push(event);
      else map.set(key, [event]);
    }
  }
  // All-day ones first, then by time.
  for (const list of map.values()) list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || startOf(a).getTime() - startOf(b).getTime());
  return map;
};

const LOCALE = "en-US";
const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" });

export const timeOf = (date: Date) => timeFormat.format(date).replace(":00", "");

export const format = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE, options).format(date);

// "Wed, Nov 4 · 10:30 – 11 AM", "Wed, Nov 4 · All day", or across days.
export const whenOf = (event: CalendarEvent) => {
  const start = startOf(event);
  const end = endOf(event);
  const day = (date: Date) => format(date, { weekday: "short", month: "short", day: "numeric" });
  if (event.allDay) {
    const last = addDays(end, -1);
    return sameDay(start, last) || last < start ? `${day(start)} · All day` : `${day(start)} – ${day(last)} · All day`;
  }
  if (sameDay(start, end)) return `${day(start)} · ${timeOf(start)} – ${timeOf(end)}`;
  return `${day(start)}, ${timeOf(start)} – ${day(end)}, ${timeOf(end)}`;
};

// The title above the calendar: "November 2026", "Nov 2 – 8, 2026", "Nov 4 – Dec 3, 2026".
export const titleOf = (mode: CalendarMode, anchor: Date) => {
  if (mode === "month") return format(anchor, { month: "long", year: "numeric" });
  const { from, to } = rangeOf(mode, anchor);
  const last = addDays(to, -1);
  const sameMonth = from.getMonth() === last.getMonth() && from.getFullYear() === last.getFullYear();
  const first = format(from, { month: "short", day: "numeric" });
  const end = sameMonth ? format(last, { day: "numeric" }) : format(last, { month: "short", day: "numeric" });
  return `${first} – ${end}, ${last.getFullYear()}`;
};
