import { leadStats } from "./data";
import TrendIndicator from "@/component/shared/TrendIndicator";

const LeadStats = () => {
  return (
    <div className="dash-metrics-grid">
      {leadStats.map((stat) => (
        <div className="dash-metric-card" key={stat.label}>
          <div className="dash-metric-lbl">{stat.label}</div>
          <div className="dash-metric-val">
            {stat.value}{" "}
            {stat.valueSuffix ? (
              <span style={{ fontSize: 13, color: "#8496a3", fontWeight: 600 }}>
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
