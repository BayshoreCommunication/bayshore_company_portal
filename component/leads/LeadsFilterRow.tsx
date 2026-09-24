import { ListFilter, Clock, Calendar, Search } from "lucide-react";
import { dashSearch, dashSearchIcon } from "@/component/shared/ui";

const filterChip =
  "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border border-[#dbe3de] bg-white px-3.5 py-2.25 text-[12.5px] font-semibold text-[#384955]";

const LeadsFilterRow = () => {
  return (
    <div className="flex items-center gap-2.5">
      <button className={filterChip} type="button">
        <ListFilter size={13} strokeWidth={2} /> All Sources
      </button>
      <button className={filterChip} type="button">
        <Clock size={13} strokeWidth={2} /> All Statuses
      </button>
      <button className={filterChip} type="button">
        <Calendar size={13} strokeWidth={2} /> September 2026
      </button>
      <div className={dashSearch}>
        <span className={`${dashSearchIcon} inline-flex`}>
          <Search size={14} strokeWidth={2} />
        </span>
        <input type="text" placeholder="Search leads..." />
      </div>
    </div>
  );
};

export default LeadsFilterRow;
