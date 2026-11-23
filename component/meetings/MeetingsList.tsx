"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock, Loader2, Users, Video, X } from "lucide-react";
import { cancelMeetingAction, type TeamMeeting } from "@/app/actions/meetings";

// The team's meetings: who the client wants to meet and when, each with a Google Meet link. A
// super user (admin) sees all; everyone else sees only the meetings they're on (scoped by the
// backend). Staff can call a meeting off, which removes it from Google too.

const card = "rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)]";

const dateOf = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const initialsOf = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";

const Avatar = ({ person }: { person: { name: string; avatar: string | null } }) =>
  person.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.avatar} alt="" title={person.name} className="size-7 rounded-full object-cover ring-2 ring-white" />
  ) : (
    <span title={person.name} className="grid size-7 place-items-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white ring-2 ring-white">
      {initialsOf(person.name)}
    </span>
  );

const MeetingCard = ({ meeting }: { meeting: TeamMeeting }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, startCancel] = useTransition();
  const cancelled = meeting.status === "cancelled";

  const cancel = () =>
    startCancel(async () => {
      await cancelMeetingAction(meeting._id);
      setConfirming(false);
      router.refresh();
    });

  return (
    <div className={`${card} px-5 py-4 ${cancelled ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-bold text-[#0f172a]">{meeting.title}</h3>
            {cancelled ? <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[10.5px] font-bold text-[#b91c1c]">Cancelled</span> : null}
          </div>
          <div className="mt-1 text-[12.5px] text-[#64748b]">{meeting.client ? meeting.client.companyName : "—"}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[#475569]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={13} /> {dateOf(meeting.start)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} /> {timeOf(meeting.start)} – {timeOf(meeting.end)}
            </span>
            {meeting.meetLink && !cancelled ? (
              <a href={meeting.meetLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#2563eb] hover:underline">
                <Video size={13} /> Join
              </a>
            ) : null}
          </div>
        </div>
        {!cancelled ? (
          confirming ? (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={cancel} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#b91c1c] disabled:opacity-60">
                {busy ? <Loader2 size={12} className="animate-spin" /> : null} Cancel it
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[#64748b] hover:bg-[#f1f5f9]">
                Keep
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} aria-label="Cancel meeting" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]">
              <X size={16} />
            </button>
          )
        ) : null}
      </div>

      {meeting.notes ? <p className="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2 text-[12.5px] whitespace-pre-wrap text-[#475569]">{meeting.notes}</p> : null}

      <div className="mt-3 flex items-center gap-2 border-t border-[#eef2f7] pt-3">
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#94a3b8]">
          <Users size={12} /> On it
        </span>
        <div className="flex -space-x-1.5">
          {meeting.participants.map((person) => (
            <Avatar key={person.email} person={person} />
          ))}
        </div>
        {meeting.createdBy ? <span className="ml-auto text-[11.5px] text-[#94a3b8]">Requested by {meeting.createdBy.fullName}</span> : null}
      </div>
    </div>
  );
};

const MeetingsList = ({ meetings, error }: { meetings?: TeamMeeting[]; error?: string }) => {
  const [now] = useState(() => Date.now());
  if (error) {
    return <div className="rounded-2xl border border-[#fecaca] bg-[#fff7f7] px-5 py-10 text-center text-[13px] text-[#b91c1c]">{error}</div>;
  }
  const list = meetings ?? [];
  const upcoming = list.filter((m) => m.status !== "cancelled" && new Date(m.start).getTime() >= now).sort((a, b) => +new Date(a.start) - +new Date(b.start));
  const past = list.filter((m) => m.status === "cancelled" || new Date(m.start).getTime() < now).sort((a, b) => +new Date(b.start) - +new Date(a.start));

  if (!list.length) {
    return <div className="rounded-2xl border border-[#e2e8f0] bg-white px-5 py-14 text-center text-[13px] text-[#64748b]">No meetings yet. When a client opens one with you on it, it shows up here.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {upcoming.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-bold tracking-[0.04em] text-[#64748b] uppercase">Upcoming</h2>
          {upcoming.map((meeting) => (
            <MeetingCard key={meeting._id} meeting={meeting} />
          ))}
        </section>
      ) : null}
      {past.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-bold tracking-[0.04em] text-[#64748b] uppercase">Past &amp; cancelled</h2>
          {past.map((meeting) => (
            <MeetingCard key={meeting._id} meeting={meeting} />
          ))}
        </section>
      ) : null}
    </div>
  );
};

export default MeetingsList;
