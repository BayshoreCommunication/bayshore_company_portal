import { leadStats } from "./data";
import TrendIndicator from "@/component/shared/TrendIndicator";
import { dashMetricCard, dashMetricLbl, dashMetricVal, dashMetricsGrid } from "@/component/shared/ui";

const LeadStats = () => {
  return (
    <div className={dashMetricsGrid}>
      {leadStats.map((stat) => (
        <div className={dashMetricCard} key={stat.label}>
          <div className={dashMetricLbl}>{stat.label}</div>
          <div className={dashMetricVal}>
            {stat.value}{" "}
            {stat.valueSuffix ? (
              <span className="text-[13px] font-semibold text-[#8496a3]">
                {stat.valueSuffix}
              </span>
            ) : null}
          </div>
          <TrendIndicator trend="up" value={stat.trendValue} label={stat.subLabel} />
        </div>
      ))}
    </div>
  );
};

export default LeadStats;
