import { recentReports } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";
import { btnDraft, dashPendingSub, dashPendingTitle, reportRowIcon, sideCard, sideHeader, sideTitle } from "@/component/shared/ui";

const RecentReports = () => {
  return (
    <div className={sideCard}>
      <div className={sideHeader}>
        <div className="flex items-center justify-between">
          <div className={sideTitle}>Recent Reports</div>
          <ViewAllLink />
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        {recentReports.map((report) => (
          <div
            className="flex items-center gap-2.5 border-b border-[#eef3ef] pb-3.5 last:border-b-0 last:pb-0"
            key={report.title}
          >
            <div className={reportRowIcon} style={{ background: report.iconBg, color: report.iconColor }}>
              <report.icon size={15} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className={dashPendingTitle}>{report.title}</div>
              <div className={dashPendingSub}>{report.detail}</div>
            </div>
            <button className={btnDraft}>Read</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentReports;
