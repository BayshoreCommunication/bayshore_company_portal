import { metricCards } from "./data";
import TrendIndicator from "@/component/shared/TrendIndicator";
import { clientStatCard, clientStatIcon, dashMetricsGrid, dashPendingSub } from "@/component/shared/ui";

const MetricCards = () => {
  return (
    <div className={dashMetricsGrid}>
      {metricCards.map((card) => (
        <div className={clientStatCard} key={card.title}>
          <div className={clientStatIcon} style={{ background: card.iconBg, color: card.iconColor }}>
            <card.icon size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="mb-2 text-[24px] font-bold text-[#0d1e2c]">{card.value}</div>
            <TrendIndicator trend={card.trend} value={card.trendValue} label={card.subLabel} />
            <div className={dashPendingSub}>{card.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricCards;
