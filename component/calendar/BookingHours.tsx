"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarCheck, Loader2, RefreshCw } from "lucide-react";
import { updateBookingHoursAction, type BookingHours as Hours, type GoogleAccounts } from "@/app/actions/calendar";

// Where clients book their onboarding call (client portal: Book call): which connected calendar
// takes the bookings, and the hours it offers. The client sees the free times inside them as
// buttons; the call they pick is added to that calendar with a Meet link.

const DEFAULT_HOURS: Hours = { enabled: false, timeZone: "America/New_York", days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00", duration: 45, notice: 2, ahead: 30 };

const DAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

const DURATIONS = [15, 30, 45, 60, 90];

const COMMON_ZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "Asia/Dhaka", "Europe/London", "UTC"];
const allZones = () => {
  try {
    return (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? COMMON_ZONES;
  } catch {
    return COMMON_ZONES;
  }
};

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const label = "mb-1 block text-[11px] font-semibold tracking-wide text-[#8a94a3] uppercase";
const field =
  "h-9 w-full rounded-lg border border-[#e2e5e9] bg-white px-2.5 text-[12.5px] text-[#1f2530] outline-none focus:border-[#93c5fd] focus:ring-2 focus:ring-[#dbeafe]";

const BookingHours = ({ google, connecting, onConnect }: { google: GoogleAccounts; connecting: boolean; onConnect: () => void }) => {
  const router = useRouter();
  const live = google.accounts.find((account) => account.booking?.enabled && !account.broken);
  const [accountId, setAccountId] = useState(live?._id ?? "");
  const chosen = google.accounts.find((account) => account._id === accountId);
  const [hours, setHours] = useState<Hours>(() => ({ ...DEFAULT_HOURS, ...(live?.booking ?? google.accounts[0]?.booking ?? {}) }));
  const [saving, startSaving] = useTransition();
  const zones = [...new Set([hours.timeZone, ...COMMON_ZONES, ...allZones()])];

  const set = <Key extends keyof Hours>(key: Key, value: Hours[Key]) => setHours((now) => ({ ...now, [key]: value }));
  const toggleDay = (day: number) => set("days", hours.days.includes(day) ? hours.days.filter((each) => each !== day) : [...hours.days, day]);

  const save = (enabled: boolean) => {
    const target = enabled ? chosen : live;
    if (!target) return;
    startSaving(async () => {
      const result = await updateBookingHoursAction(target._id, { ...hours, enabled });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(enabled ? "Client booking is on" : "Client booking is off");
      router.refresh();
    });
  };

  if (!google.canConnect) {
    return live ? (
      <div className={`${cardClass} p-4.5`}>
        <Title on />
        <p className="text-[12px] leading-relaxed text-[#6b7280]">
          Clients book on <b className="font-semibold text-[#1f2530]">{live.email}</b>.
        </p>
      </div>
    ) : null;
  }

  return (
    <div className={`${cardClass} p-4.5`}>
      <Title on={Boolean(live)} />
      <p className="mb-3.5 text-[11.5px] leading-relaxed text-[#6b7280]">
        Clients pick a free time on this calendar when they book their onboarding call. The call is added to it with a Google Meet link.
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <span className={label}>Calendar</span>
          <select className={field} value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            <option value="">Choose a calendar…</option>
            {google.accounts.map((account) => (
              <option key={account._id} value={account._id} disabled={account.broken}>
                {account.email}
                {account.broken ? " (access lost)" : ""}
              </option>
            ))}
          </select>
        </div>

        {chosen && !chosen.canBook ? (
          <div className="rounded-xl bg-[#fffbeb] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#92400e]">
            <div className="mb-1 flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={12} strokeWidth={2.25} /> Needs leave to add events
            </div>
            Connect this account again and allow every box on Google&apos;s screen, so calls can be added to it.
            <button
              type="button"
              disabled={connecting}
              onClick={onConnect}
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#92400e] px-2.5 py-1.5 text-[11.5px] font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            >
              {connecting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} strokeWidth={2.25} />} Connect again
            </button>
          </div>
        ) : null}

        <div>
          <span className={label}>Days</span>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(({ day, label: name }) => (
              <button
                key={day}
                type="button"
                aria-pressed={hours.days.includes(day)}
                onClick={() => toggleDay(day)}
                className={`h-8 cursor-pointer rounded-md text-[11px] font-semibold transition-colors ${
                  hours.days.includes(day) ? "bg-[#0b0c24] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className={label}>From</span>
            <input type="time" className={field} value={hours.start} onChange={(event) => set("start", event.target.value)} />
          </div>
          <div>
            <span className={label}>To</span>
            <input type="time" className={field} value={hours.end} onChange={(event) => set("end", event.target.value)} />
          </div>
        </div>

        <div>
          <span className={label}>Time zone</span>
          <select className={field} value={hours.timeZone} onChange={(event) => set("timeZone", event.target.value)}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className={label}>Call</span>
            <select className={field} value={hours.duration} onChange={(event) => set("duration", Number(event.target.value))}>
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={label} title="The soonest a call can be, in hours from now">
              Notice
            </span>
            <div className="relative">
              <input type="number" min={0} max={168} className={`${field} pr-6`} value={hours.notice} onChange={(event) => set("notice", Number(event.target.value))} />
              <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-[#94a3b8]">h</span>
            </div>
          </div>
          <div>
            <span className={label} title="The latest a call can be, in days from now">
              Ahead
            </span>
            <div className="relative">
              <input type="number" min={1} max={90} className={`${field} pr-6`} value={hours.ahead} onChange={(event) => set("ahead", Number(event.target.value))} />
              <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-[#94a3b8]">d</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={saving || !chosen || !chosen.canBook}
          onClick={() => save(true)}
          className="inline-flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#1e2140] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} strokeWidth={2} />}
          {live && live._id === accountId ? "Save booking hours" : "Take bookings on this calendar"}
        </button>
        {live ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => save(false)}
            className="cursor-pointer text-[11.5px] font-semibold text-[#b42318] hover:underline disabled:cursor-wait"
          >
            Turn off client booking
          </button>
        ) : null}
      </div>
    </div>
  );
};

const Title = ({ on }: { on: boolean }) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <span className="text-[14px] font-semibold text-[#0b0c24]">Client booking</span>
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#f1f5f9] text-[#64748b]"}`}>{on ? "On" : "Off"}</span>
  </div>
);

export default BookingHours;
