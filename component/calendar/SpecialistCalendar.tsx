import { ArrowLeft } from "lucide-react";
import type { Specialist } from "./data";
import { sampleMeetings, specialists } from "./data";

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
      <span
        className="breadcrumb-link"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 14 }}
        onClick={onBack}
      >
        <ArrowLeft size={13} strokeWidth={2} /> All specialists
      </span>

      <div className="book-call-card" style={{ padding: "48px 56px" }}>
        <div className="book-call-host-row">
          <div className="book-call-avatar" style={{ background: specialist.color }}>
            {specialist.avatar}
            <span className="book-call-online-dot" />
          </div>
          <div>
            <div className="book-call-name">{specialist.name}</div>
            <div className="book-call-lastseen">{specialist.role}</div>
          </div>
        </div>

        <div className="book-call-days" style={{ marginTop: 24 }}>
          {specialist.days.map((day) => (
            <button
              key={day.dow}
              className={`book-call-day${day.available ? "" : " unavailable"}`}
              disabled
            >
              <span className="bcd-dow">{day.dow}</span>
              <span className="bcd-date">{day.date}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="call-requests-panel">
        <div className="side-header">
          <div className="side-title">Booked Meetings</div>
          <div className="side-sub">Clients who booked time with {specialist.name}</div>
        </div>

        {meetings.length === 0 ? (
          <div className="call-request-empty">No meetings booked with {specialist.name} yet.</div>
        ) : (
          meetings.map((meeting) => (
            <div className="meeting-item" key={meeting.id}>
              <div className="meeting-item-top">
                <div className="call-request-date-badge">
                  <div className="crd-dow">{meeting.day.toUpperCase()}</div>
                  <div className="crd-date">{meeting.date}</div>
                </div>
                <div className="meeting-info">
                  <div className="meeting-client">{meeting.clientName}</div>
                  <div className="meeting-meta">
                    Requested a 30-minute call · {meeting.day} the {meeting.date}th
                  </div>
                </div>
                {meeting.status === "pending" ? (
                  <div className="meeting-actions">
                    <button className="btn-decline-call" type="button">
                      Decline
                    </button>
                    <button className="btn-approve-call" type="button">
                      Approve
                    </button>
                  </div>
                ) : (
                  <span className="call-request-status-tag" style={{ background: "#dcf3e2", color: "#15803d" }}>
                    Approved
                  </span>
                )}
              </div>

              <div className="meeting-reassign-row">
                <span className="meeting-reassign-label">Not available? Reassign to:</span>
                <select className="reassign-select">
                  {specialists
                    .filter((other) => other.key !== specialist.key)
                    .map((other) => (
                      <option key={other.key}>{other.name}</option>
                    ))}
                </select>
                <button className="btn-reassign" type="button">
                  Reassign
                </button>
              </div>
              <textarea
                className="reassign-note-input"
                placeholder="Optional: let the client know why (e.g. I am unavailable that day, so I asked a teammate to cover this call.)"
              />
              <div className="meeting-reschedule-row">
                <span className="meeting-reassign-label">Need a different day? Reschedule to:</span>
                <select className="reassign-select">
                  {specialist.days
                    .filter((day) => day.available)
                    .map((day) => (
                      <option key={day.dow}>
                        {day.dow} {day.date}
                      </option>
                    ))}
                </select>
                <button className="btn-reschedule" type="button">
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
