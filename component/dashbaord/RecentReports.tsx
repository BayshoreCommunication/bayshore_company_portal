import { recentReports } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";

const RecentReports = () => {
  return (
    <div className="side-card">
      <div className="side-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="side-title">Recent Reports</div>
          <ViewAllLink />
        </div>
      </div>
      <div className="recent-reports-list">
        {recentReports.map((report) => (
          <div className="recent-report-item" key={report.title}>
            <div
              className="report-row-icon"
              style={{ background: report.iconBg, color: report.iconColor }}
            >
              <report.icon size={15} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="dash-pending-title">{report.title}</div>
              <div className="dash-pending-sub">{report.detail}</div>
            </div>
            <button className="btn-draft">Read</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentReports;
