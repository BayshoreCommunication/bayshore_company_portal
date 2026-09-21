import { upcomingMeetings } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";

const statusClassName = (status: string) => {
  if (status === "Today") return "mini-status sent";
  if (status === "Tomorrow") return "mini-status published";
  return "mini-status";
};

const UpcomingMeetings = () => {
  return (
    <div className="side-card">
      <div className="side-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="side-title">Upcoming Meetings</div>
          <ViewAllLink />
        </div>
      </div>
      <div className="dash-meeting-list">
        {upcomingMeetings.map((meeting) => (
          <div className="dash-meeting-item" key={`${meeting.client}-${meeting.day}`}>
            <div className="dash-meeting-date">
              <div className="dm-mon">{meeting.month}</div>
              <div className="dm-day">{meeting.day}</div>
            </div>
            <div
              style={
                meeting.status
                  ? { flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }
                  : undefined
              }
            >
              <div>
                <div className="dash-pending-title">{meeting.client}</div>
                <div className="dash-pending-sub">{meeting.detail}</div>
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
