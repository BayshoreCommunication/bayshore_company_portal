import { ArrowLeft } from "lucide-react";
import type { Specialist } from "./data";
import { sampleMeetings, specialists } from "./data";
import { breadcrumbLink, sideHeader, sideSub, sideTitle } from "@/component/shared/ui";

const reassignLabel = "whitespace-nowrap text-[11.5px] text-[#8496a3]";
const reassignSelect =
  "max-w-55 flex-1 rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-2.5 py-1.5 text-[12px] text-[#17242f]";

const SpecialistCalendar = ({
  specialist,
  onBack,
}: {
  specialist: Specialist;
  onBack: () => void;
}) => {
  const meetings = sampleMeetings[specialist.key] ?? [];

  return (
    <div>
      <span className={`${breadcrumbLink} mb-3.5 inline-flex items-center gap-1.25`} onClick={onBack}>
        <ArrowLeft size={13} strokeWidth={2} /> All specialists
      </span>

      <div className="relative mx-auto mt-6 w-full max-w-260 self-center rounded-3xl border border-[#e5eae7] bg-white px-14 py-12 shadow-[0_12px_36px_rgba(0,0,0,0.09)]">
        <div className="mb-7 flex items-center gap-4.5">
          <div
            className="relative flex h-17 w-17 shrink-0 items-center justify-center rounded-full text-[22px] font-bold text-white"
            style={{ background: specialist.color }}
          >
            {specialist.avatar}
            <span className="absolute right-0.5 bottom-0.5 h-4 w-4 rounded-full border-3 border-white bg-[#16a34a]" />
          </div>
          <div>
            <div className="text-[22px] font-bold text-[#0d1e2c]">{specialist.name}</div>
            <div className="mt-0.75 text-[14px] text-[#9aacb8]">{specialist.role}</div>
          </div>
        </div>

        <div className="mt-6 mb-9 grid grid-cols-5 gap-4.5">
          {specialist.days.map((day) => (
            <button
              key={day.dow}
              className={`flex flex-col items-center gap-2.5 rounded-2xl border-[1.5px] px-2 py-8 ${
                day.available
                  ? "cursor-pointer border-[#dbe3de] bg-white hover:border-[#9aacb8]"
                  : "cursor-not-allowed border-[#eef2f0] bg-[#f4f7f5] opacity-55"
              }`}
              disabled
            >
              <span className={`text-[18px] ${day.available ? "text-[#384955]" : "text-[#b7c2cb]"}`}>{day.dow}</span>
              <span className={`text-[32px] font-bold ${day.available ? "text-[#17242f]" : "text-[#b7c2cb]"}`}>{day.date}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-5 w-full max-w-260 self-center rounded-2xl border border-[#dbe3de] bg-white px-7 py-6">
        <div className={sideHeader}>
          <div className={sideTitle}>Booked Meetings</div>
          <div className={sideSub}>Clients who booked time with {specialist.name}</div>
        </div>

        {meetings.length === 0 ? (
          <div className="py-2 text-[12.5px] text-[#9aacb8] italic">No meetings booked with {specialist.name} yet.</div>
        ) : (
          meetings.map((meeting) => (
            <div className="border-b border-[#eef3ef] py-3.5 last:border-b-0 last:pb-0" key={meeting.id}>
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#f6f2eb]">
                  <div className="text-[9.5px] font-bold tracking-[0.4px] text-[#b91c1c]">{meeting.day.toUpperCase()}</div>
                  <div className="text-[17px] leading-[1.1] font-bold text-[#17242f]">{meeting.date}</div>
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-[#17242f]">{meeting.clientName}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#8496a3]">
                    Requested a 30-minute call · {meeting.day} the {meeting.date}th
                  </div>
                </div>
                {meeting.status === "pending" ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      className="cursor-pointer rounded-md border border-[#fbdada] bg-white px-3.5 py-2 text-[12px] font-bold text-[#b91c1c] hover:bg-[#fef2f2]"
                      type="button"
                    >
                      Decline
                    </button>
                    <button
                      className="cursor-pointer rounded-md bg-[#16a34a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#15803d]"
                      type="button"
                    >
                      Approve
                    </button>
                  </div>
                ) : (
                  <span className="shrink-0 rounded-xl bg-[#dcf3e2] px-2.5 py-1 text-[11px] font-bold text-[#15803d]">
                    Approved
                  </span>
                )}
              </div>

              <div className="mt-3 ml-15.5 flex items-center gap-2 border-t border-dashed border-[#eef3ef] pt-3">
                <span className={reassignLabel}>Not available? Reassign to:</span>
                <select className={reassignSelect}>
                  {specialists
                    .filter((other) => other.key !== specialist.key)
                    .map((other) => (
                      <option key={other.key}>{other.name}</option>
                    ))}
                </select>
                <button
                  className="cursor-pointer whitespace-nowrap rounded-md border border-[#93c5fd] bg-[#eff6ff] px-3.5 py-1.5 text-[11.5px] font-bold text-[#2563eb] hover:bg-[#dbeafe]"
                  type="button"
                >
                  Reassign
                </button>
              </div>
              <textarea
                className="mt-2 h-11.5 w-full resize-none rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-2.5 py-2 font-[inherit] text-[11.5px] text-[#17242f]"
                placeholder="Optional: let the client know why (e.g. I am unavailable that day, so I asked a teammate to cover this call.)"
              />
              <div className="mt-2.5 ml-15.5 flex items-center gap-2">
                <span className={reassignLabel}>Need a different day? Reschedule to:</span>
                <select className={reassignSelect}>
                  {specialist.days
                    .filter((day) => day.available)
                    .map((day) => (
                      <option key={day.dow}>
                        {day.dow} {day.date}
                      </option>
                    ))}
                </select>
                <button
                  className="cursor-pointer whitespace-nowrap rounded-md border border-[#f3d9a8] bg-[#fdf1de] px-3.5 py-1.5 text-[11.5px] font-bold text-[#a35a12] hover:bg-[#fbe6c4]"
                  type="button"
                >
                  Reschedule
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpecialistCalendar;
