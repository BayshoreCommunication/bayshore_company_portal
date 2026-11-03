"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowUpRight, CalendarDays, CalendarRange, Info, List, Loader2 } from "lucide-react";
import { BOOKING_CALENDAR_ID, CALENDAR_URL } from "@/lib/booking";
import { pageDesc, pageTitle } from "@/component/shared/ui";

// The calendar clients book their onboarding call on (client portal: the booking calendar), as
// Google Calendar shows it: each booked call on its day, under the client's name. It is the
// Google calendar that owns the appointment schedule (BOOKING_CALENDAR_ID); whoever looks needs
// access to it in the Google account they are signed in to in this browser.

type Mode = "MONTH" | "WEEK" | "AGENDA";
const MODES: { mode: Mode; label: string; icon: typeof CalendarDays }[] = [
  { mode: "MONTH", label: "Month", icon: CalendarDays },
  { mode: "WEEK", label: "Week", icon: CalendarRange },
  { mode: "AGENDA", label: "Agenda", icon: List },
];

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const embedUrl = (calendarId: string, mode: Mode, timeZone: string) => {
  const params = new URLSearchParams({
    src: calendarId,
    ctz: timeZone,
    mode,
    wkst: "1",
    bgcolor: "#ffffff",
    showTitle: "0",
    showPrint: "0",
    showTabs: "0",
    showCalendars: "0",
    showTz: "1",
  });
  return `https://calendar.google.com/calendar/embed?${params.toString()}`;
};

// The time zone doesn't change while the page is open: nothing to listen to.
const noChanges = () => () => {};

const CalendarView = () => {
  const [mode, setMode] = useState<Mode>("MONTH");
  // The viewer's own time zone — known only in the browser, so the calendar loads once it is.
  const timeZone = useSyncExternalStore(
    noChanges,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => null,
  );
  const [loaded, setLoaded] = useState(false);

  const choose = (next: Mode) => {
    if (next === mode) return;
    setLoaded(false);
    setMode(next);
  };

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={pageTitle}>Calendar</div>
          <div className={pageDesc}>The onboarding calls clients have booked: which day, what time, and with which client.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {BOOKING_CALENDAR_ID ? (
            <nav aria-label="Calendar view" className="flex items-center gap-1">
              {MODES.map(({ mode: each, label, icon: Icon }) => (
                <button
                  key={each}
                  type="button"
                  aria-pressed={mode === each}
                  onClick={() => choose(each)}
                  className={`inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-[12.5px] font-medium transition-colors ${
                    mode === each ? "bg-[#0b0c24] text-white" : "text-[#4b5260] hover:text-[#0b0c24]"
                  }`}
                >
                  <Icon size={14} strokeWidth={2} /> {label}
                </button>
              ))}
            </nav>
          ) : null}
          <a
            href={CALENDAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9.5 items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
          >
            Open in Google Calendar <ArrowUpRight size={13} strokeWidth={2.25} />
          </a>
        </div>
      </div>

      {BOOKING_CALENDAR_ID ? (
        <>
          <div className={`${cardClass} relative overflow-hidden`}>
            {!loaded ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white text-[12.5px] text-[#6b7280]">
                <Loader2 size={16} className="animate-spin" /> Loading the calendar…
              </div>
            ) : null}
            {timeZone ? (
              <iframe
                key={mode}
                src={embedUrl(BOOKING_CALENDAR_ID, mode, timeZone)}
                title="Booked onboarding calls"
                onLoad={() => setLoaded(true)}
                className="block h-[calc(100vh-15rem)] min-h-150 w-full border-0"
              />
            ) : (
              <div className="h-[calc(100vh-15rem)] min-h-150" />
            )}
          </div>
          <div className="flex items-start gap-2 px-1 text-[11.5px] leading-snug text-[#6b7280]">
            <Info size={13} strokeWidth={2} className="mt-px shrink-0" />
            Calls show in your own time zone ({timeZone ?? "…"}). Empty, or asking you to sign in? Sign in to Google with an account that has access to the booking calendar.
          </div>
        </>
      ) : (
        <div className={`${cardClass} flex flex-col items-center px-6 py-14 text-center`}>
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#eef1f6] text-[#4b5260]">
            <CalendarDays size={24} strokeWidth={1.8} />
          </span>
          <div className="text-[17px] font-semibold text-[#0b0c24]">The booking calendar isn&apos;t connected yet</div>
          <div className="mt-1.5 max-w-120 text-[12.5px] leading-normal text-[#4b5563]">
            Set <code className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[11.5px]">NEXT_PUBLIC_BOOKING_CALENDAR_ID</code> to the Google calendar that owns the onboarding booking page — usually that account&apos;s email — and rebuild the portal. Booked calls then show here by day.
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
