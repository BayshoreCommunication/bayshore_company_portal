import { metricCards } from "./data";
import TrendIndicator from "@/component/shared/TrendIndicator";

const MetricCards = () => {
  return (
    <div className="dash-metrics-grid">
      {metricCards.map((card) => (
        <div className="client-stat-card" key={card.title}>
          <div
            className="client-stat-icon"
            style={{ background: card.iconBg, color: card.iconColor }}
          >
            <card.icon size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="dash-metric-val" style={{ fontSize: 24 }}>
              {card.value}
            </div>
            <TrendIndicator trend={card.trend} value={card.trendValue} label={card.subLabel} />
            <div className="dash-pending-sub">{card.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;
