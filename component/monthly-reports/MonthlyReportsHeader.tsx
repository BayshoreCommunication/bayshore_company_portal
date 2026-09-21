import Link from "next/link";
import { Plus } from "lucide-react";
import RoleAlertBanner from "@/component/shared/RoleAlertBanner";
import { roleLabel } from "@/component/shared/roleLabels";
import { canReviewReports, canWriteReports } from "./reportUi";

const capability = (role: string) =>
  canReviewReports(role)
    ? "You can write reports, review them, and publish them to clients."
    : canWriteReports(role)
      ? "You can write reports and hand them in for review."
      : "You can view reports for the clients you have access to.";

const MonthlyReportsHeader = ({ role }: { role: string }) => {
  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <b>Monthly Reports</b>
        </div>
      </div>

      <RoleAlertBanner
        message={
          <>
            Signed in as <b>{roleLabel(role)}</b>. {capability(role)}
          </>
        }
      />

      <div className="page-header-row">
        <div>
          <div className="page-title">Monthly Reports</div>
          <div className="page-desc">
            View, edit and manage weekly and monthly performance reports for your clients.
          </div>
        </div>
        {canWriteReports(role) ? (
          <Link
            href="/monthly-reports/add"
            className="btn-create-report"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <Plus size={13} strokeWidth={2.5} /> Create New Report
          </Link>
        ) : null}
      </div>
    </>
  );
};

export default MonthlyReportsHeader;
