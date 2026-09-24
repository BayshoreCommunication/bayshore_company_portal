import { upcomingMeetings } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";
import { MINI_STATUS, dashPendingSub, dashPendingTitle, miniStatus, sideCard, sideHeader, sideTitle } from "@/component/shared/ui";

const statusClassName = (status: string) => {
  if (status === "Today") return `${miniStatus} ${MINI_STATUS.sent}`;
  if (status === "Tomorrow") return `${miniStatus} ${MINI_STATUS.published}`;
  return miniStatus;
};

const UpcomingMeetings = () => {
  return (
    <div className={sideCard}>
      <div className={sideHeader}>
        <div className="flex items-center justify-between">
          <div className={sideTitle}>Upcoming Meetings</div>
          <ViewAllLink />
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        {upcomingMeetings.map((meeting) => (
          <div className="flex items-center gap-3" key={`${meeting.client}-${meeting.day}`}>
            <div className="flex h-10.5 w-10.5 shrink-0 flex-col items-center justify-center rounded-md bg-[#f6f2eb]">
              <div className="text-[9px] font-bold tracking-[0.4px] text-[#b91c1c]">{meeting.month}</div>
              <div className="text-[15px] leading-[1.1] font-bold text-[#17242f]">{meeting.day}</div>
            </div>
            <div className={meeting.status ? "flex flex-1 items-start justify-between" : undefined}>
              <div>
                <div className={dashPendingTitle}>{meeting.client}</div>
                <div className={dashPendingSub}>{meeting.detail}</div>
              </div>
              {meeting.status ? (
                <span className={statusClassName(meeting.status)}>{meeting.status}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingMeetings;
