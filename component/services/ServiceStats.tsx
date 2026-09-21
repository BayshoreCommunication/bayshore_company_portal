import { serviceStats } from "./data";

const ServiceStats = () => {
  return (
    <div className="dash-metrics-grid">
      {serviceStats.map((stat) => (
        <div className="dash-metric-card" key={stat.label}>
          <div className="dash-metric-lbl">{stat.label}</div>
          <div className="dash-metric-val" style={stat.small ? { fontSize: 20 } : undefined}>
            {stat.value}
          </div>
          <div className="dash-pending-sub">{stat.note}</div>
        </div>
      ))}
    </div>
  );
};

export default ServiceStats;
