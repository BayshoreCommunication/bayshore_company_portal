"use client";

import { useState } from "react";
import { supportTickets, ticketInspector } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";
import {
  MINI_STATUS,
  btnDraft,
  btnViewReport,
  dashPendingSub,
  miniStatus,
  miniTd,
  miniTh,
  sectionCard,
  sectionHeader,
  sectionTitle,
} from "@/component/shared/ui";

const statusClassName = (status: string) => {
  if (status === "Open") return `${miniStatus} bg-[#fbdada] text-[#b91c1c]`;
  if (status === "In Review") return `${miniStatus} ${MINI_STATUS.pending}`;
  if (status === "Resolved") return `${miniStatus} ${MINI_STATUS.sent}`;
  return miniStatus;
};

const SupportTickets = () => {
  const [selectedId, setSelectedId] = useState(
    supportTickets.find((t) => t.selected)?.id ?? supportTickets[0]?.id
  );

  return (
    <div className={sectionCard}>
      <div className={sectionHeader}>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-xs bg-[#c8973a]" />
          <span className={sectionTitle}>Client Support &amp; Complaint Tickets</span>
          <span className={`${dashPendingSub} ml-0.5`}>(Client-submitted queue)</span>
        </div>
        <ViewAllLink label="View All Tickets" />
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] items-start gap-4">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Client", "Subject", "Status"].map((heading) => (
                <th key={heading} className={miniTh}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {supportTickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={`cursor-pointer ${ticket.id === selectedId ? "bg-[#eff6ff]" : "hover:bg-[#f7f9f8]"}`}
                onClick={() => setSelectedId(ticket.id)}
              >
                <td className={miniTd}>
                  <b>{ticket.client}</b>
                  <div className={dashPendingSub}>{ticket.id}</div>
                </td>
                <td className={miniTd}>{ticket.subject}</td>
                <td className={miniTd}>
                  <span className={statusClassName(ticket.status)}>{ticket.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="rounded-lg border border-[#eef3ef] bg-[#f7f9f8] p-3.5">
          <div className="text-[10px] font-bold tracking-[0.5px] text-[#8496a3]">
            TICKET INSPECTOR • {ticketInspector.ticketId}
          </div>
          <div className="mt-1.5 text-[13px] leading-[1.35] font-bold text-[#2563eb]">{ticketInspector.subject}</div>
          <div className="mt-2.5 max-h-22.5 overflow-y-auto pr-1 text-[11.5px] leading-normal text-[#384955]">
            {ticketInspector.message}
          </div>
          <div className="mt-3 flex gap-2">
            <button className={`${btnViewReport} flex-1`}>Update Status</button>
            <button className={`${btnDraft} flex-1`}>
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;
