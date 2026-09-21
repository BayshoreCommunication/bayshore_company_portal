import { leadSources } from "./data";

const LeadsSidePanel = () => {
  return (
    <div className="dash-side-col">
      <div className="side-card">
        <div className="side-header">
          <div className="side-title">Lead Sources</div>
          <div className="side-sub">September, month to date</div>
        </div>
        <div className="lead-source-list">
          {leadSources.map((source) => (
            <div className="lead-source-row" key={source.label}>
              <span className="source-dot" style={{ background: source.color }} />
              <span className="ls-label">{source.label}</span>
              <div className="ls-bar-track">
                <div className="ls-bar-fill" style={{ width: source.width, background: source.color }} />
              </div>
              <span className="ls-count">{source.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="side-card">
        <div className="side-title" style={{ marginBottom: 8 }}>
          Follow-Up Reminder
        </div>
        <div className="dash-pending-sub">
          3 leads have had no contact logged in over 48 hours — Tyrell Jenkins, Latoya Freeman, and 1 more.
          Consider following up today.
        </div>
      </div>
    </div>
  );
};

export default LeadsSidePanel;
