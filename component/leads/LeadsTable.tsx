import { ArrowRight } from "lucide-react";
import { leads } from "./data";

const LeadsTable = () => {
  return (
    <div className="section-card" style={{ padding: 0 }}>
      <table className="leads-table">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Source</th>
            <th>Received</th>
            <th>Status</th>
            <th>Assigned</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.name}>
              <td>
                <div className="lead-cell">
                  <div className="lead-avatar" style={{ background: lead.avatarBg }}>
                    {lead.initials}
                  </div>
                  <div>
                    <div className="lead-name">{lead.name}</div>
                    <div className="lead-sub">{lead.reason}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="source-dot" style={{ background: lead.sourceColor }} /> {lead.source}
              </td>
              <td>{lead.received}</td>
              <td>
                <span className="lead-status" style={{ background: lead.statusBg, color: lead.statusColor }}>
                  {lead.status}
                </span>
              </td>
              <td>{lead.assigned}</td>
              <td className="lead-arrow">
                <ArrowRight size={14} strokeWidth={2} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="leads-table-footer">
        <span>Showing 1–10 of 84 leads</span>
        <span>September 2026</span>
      </div>
    </div>
  );
};

export default LeadsTable;
