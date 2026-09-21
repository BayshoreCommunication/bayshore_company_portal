"use client";

import { useState } from "react";
import { supportTickets, ticketInspector } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";

const statusStyle = (status: string) =>
  status === "Open" ? { background: "#fbdada", color: "#b91c1c" } : undefined;

const statusClassName = (status: string) => {
  if (status === "In Review") return "mini-status pending";
  if (status === "Resolved") return "mini-status sent";
  return "mini-status";
};

const SupportTickets = () => {
  const [selectedId, setSelectedId] = useState(
    supportTickets.find((t) => t.selected)?.id ?? supportTickets[0]?.id
  );

  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "#c8973a",
              display: "inline-block",
            }}
          />
          <span className="section-title">Client Support &amp; Complaint Tickets</span>
          <span className="dash-pending-sub" style={{ marginLeft: 2 }}>
            (Client-submitted queue)
          </span>
        </div>
        <ViewAllLink label="View All Tickets" />
      </div>

      <div className="ticket-split">
        <table className="report-mini-table ticket-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {supportTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={`ticket-row${ticket.id === selectedId ? " selected" : ""}`}
                onClick={() => setSelectedId(ticket.id)}
              >
                <td>
                  <b>{ticket.client}</b>
                  <div className="dash-pending-sub">{ticket.id}</div>
                </td>
                <td>{ticket.subject}</td>
                <td>
                  <span
                    className={statusClassName(ticket.status)}
                    style={statusStyle(ticket.status)}
                  >
                    {ticket.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ticket-inspector">
          <div className="ti-label">
            TICKET INSPECTOR • {ticketInspector.ticketId}
          </div>
          <div className="ti-subject">{ticketInspector.subject}</div>
          <div className="ti-message">{ticketInspector.message}</div>
          <div className="ti-actions">
            <button className="btn-view-report" style={{ flex: 1 }}>
              Update Status
            </button>
            <button className="btn-draft" style={{ flex: 1 }}>
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
