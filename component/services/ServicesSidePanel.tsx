import { contractOverview } from "./data";

const ServicesSidePanel = () => {
  return (
    <div className="dash-side-col">
      <div className="side-card">
        <div className="side-header">
          <div className="side-title">Contract Overview</div>
          <div className="side-sub">Your agreement with BayShore</div>
        </div>
        {contractOverview.map((row) => (
          <div className="contract-row" key={row.label}>
            <span>{row.label}</span>
            <b>{row.value}</b>
          </div>
        ))}
      </div>

      <div className="side-card">
        <div className="side-title" style={{ marginBottom: 8 }}>
          How This Works
        </div>
        <div className="dash-pending-sub">
          Click any category to see everything included in that package. Don&apos;t see what you need? Use{" "}
          <b style={{ color: "#17242f" }}>+ Add Service</b> under any category to request it.
        </div>
      </div>
    </div>
  );
};

export default ServicesSidePanel;
