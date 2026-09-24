import { ArrowRight } from "lucide-react";
import { sourceDot } from "@/component/shared/ui";
import { leads } from "./data";

const th = "border-b border-[#eef3ef] px-3.5 pt-3.5 pb-2.5 text-left text-[10.5px] font-bold tracking-[0.5px] text-[#8496a3]";
const td = "whitespace-nowrap border-b border-[#f4f7f5] px-3.5 py-3 text-[12.5px] text-[#384955]";

const LeadsTable = () => {
  return (
    <div className="rounded-lg border border-[#dbe3de] bg-white transition-all duration-200">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Lead", "Source", "Received", "Status", "Assigned", ""].map((heading) => (
              <th key={heading} className={th}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.name}>
              <td className={td}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: lead.avatarBg }}
                  >
                    {lead.initials}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold text-[#17242f]">{lead.name}</div>
                    <div className="mt-px text-[11px] text-[#8496a3]">{lead.reason}</div>
                  </div>
                </div>
              </td>
              <td className={td}>
                <span className={sourceDot} style={{ background: lead.sourceColor }} /> {lead.source}
              </td>
              <td className={td}>{lead.received}</td>
              <td className={td}>
                <span
                  className="whitespace-nowrap rounded-xl px-2.75 py-1 text-[10.5px] font-bold"
                  style={{ background: lead.statusBg, color: lead.statusColor }}
                >
                  {lead.status}
                </span>
              </td>
              <td className={td}>{lead.assigned}</td>
              <td className="whitespace-nowrap border-b border-[#f4f7f5] px-3.5 py-3 text-right text-[12.5px] text-[#b7c2cb]">
                <ArrowRight size={14} strokeWidth={2} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between px-4.5 py-3.5 text-[11.5px] text-[#7a8e9b]">
        <span>Showing 1–10 of 84 leads</span>
        <span>September 2026</span>
      </div>
    </div>
  );
};

export default LeadsTable;
