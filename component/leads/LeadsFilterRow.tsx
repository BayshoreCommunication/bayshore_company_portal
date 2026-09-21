import { ListFilter, Clock, Calendar, Search } from "lucide-react";

const LeadsFilterRow = () => {
  return (
    <div className="leads-filter-row">
      <button
        className="leads-filter-chip"
        type="button"
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <ListFilter size={13} strokeWidth={2} /> All Sources
      </button>
      <button
        className="leads-filter-chip"
        type="button"
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Clock size={13} strokeWidth={2} /> All Statuses
      </button>
      <button
        className="leads-filter-chip"
        type="button"
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Calendar size={13} strokeWidth={2} /> September 2026
      </button>
      <div className="dash-search" style={{ flex: 1 }}>
        <span className="dash-search-icon" style={{ display: "inline-flex" }}>
          <Search size={14} strokeWidth={2} />
        </span>
        <input type="text" placeholder="Search leads..." />
      </div>
    </div>
  );
};

export default LeadsFilterRow;
