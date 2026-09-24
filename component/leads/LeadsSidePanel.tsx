import { dashPendingSub, dashSideCol, sideCard, sideHeader, sideSub, sideTitle, sourceDot } from "@/component/shared/ui";
import { leadSources } from "./data";

const LeadsSidePanel = () => {
  return (
    <div className={dashSideCol}>
      <div className={sideCard}>
        <div className={sideHeader}>
          <div className={sideTitle}>Lead Sources</div>
          <div className={sideSub}>September, month to date</div>
        </div>
        <div className="flex flex-col gap-3">
          {leadSources.map((source) => (
            <div className="flex items-center gap-2" key={source.label}>
              <span className={sourceDot} style={{ background: source.color }} />
              <span className="w-13 shrink-0 text-[12px] font-semibold text-[#17242f]">{source.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[#eef3ef]">
                <div className="h-full rounded-[3px]" style={{ width: source.width, background: source.color }} />
              </div>
              <span className="w-5.5 text-right text-[12px] font-bold text-[#17242f]">{source.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={sideCard}>
        <div className={`${sideTitle} mb-2`}>Follow-Up Reminder</div>
        <div className={dashPendingSub}>
          3 leads have had no contact logged in over 48 hours — Tyrell Jenkins, Latoya Freeman, and 1 more.
          Consider following up today.
        </div>
      </div>
    </div>
  );
};

export default LeadsSidePanel;
