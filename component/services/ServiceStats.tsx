import { dashMetricCard, dashMetricLbl, dashMetricVal, dashMetricsGrid, dashPendingSub } from "@/component/shared/ui";
import { serviceStats } from "./data";

const ServiceStats = () => {
  return (
    <div className={dashMetricsGrid}>
      {serviceStats.map((stat) => (
        <div className={dashMetricCard} key={stat.label}>
          <div className={dashMetricLbl}>{stat.label}</div>
          <div className={stat.small ? "mb-2 text-[20px] font-bold text-[#0d1e2c]" : dashMetricVal}>{stat.value}</div>
          <div className={dashPendingSub}>{stat.note}</div>
        </div>
      ))}
    </div>
  );
};

export default ServiceStats;
