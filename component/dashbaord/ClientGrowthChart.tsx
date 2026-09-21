import { growthBars } from "./data";

const ClientGrowthChart = () => {
  return (
    <div className="section-card">
      <div className="section-title" style={{ marginBottom: 16 }}>
        Client Growth
      </div>
      <div className="growth-bars">
        {growthBars.map((bar) => (
          <div
            className={`growth-bar${bar.active ? " active" : ""}`}
            style={{ height: `${bar.height}%` }}
            key={bar.month}
          >
            {bar.tooltip ? <span className="growth-tooltip">{bar.tooltip}</span> : null}
            <span className="growth-month">{bar.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientGrowthChart;
