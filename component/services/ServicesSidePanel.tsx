import { dashPendingSub, dashSideCol, sideCard, sideHeader, sideSub, sideTitle } from "@/component/shared/ui";
import { contractOverview } from "./data";

const ServicesSidePanel = () => {
  return (
    <div className={dashSideCol}>
      <div className={sideCard}>
        <div className={sideHeader}>
          <div className={sideTitle}>Contract Overview</div>
          <div className={sideSub}>Your agreement with BayShore</div>
        </div>
        {contractOverview.map((row) => (
          <div className="flex justify-between border-b border-[#eef3ef] py-2.25 text-[12.5px] last:border-b-0" key={row.label}>
            <span className="text-[#7a8e9b]">{row.label}</span>
            <b className="text-[#17242f]">{row.value}</b>
          </div>
        ))}
      </div>

      <div className={sideCard}>
        <div className={`${sideTitle} mb-2`}>How This Works</div>
        <div className={dashPendingSub}>
          Click any category to see everything included in that package. Don&apos;t see what you need? Use{" "}
          <b className="text-[#17242f]">+ Add Service</b> under any category to request it.
        </div>
      </div>
    </div>
  );
};

export default ServicesSidePanel;
