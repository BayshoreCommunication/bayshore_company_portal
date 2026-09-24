import Link from "next/link";
import { Plus } from "lucide-react";
import RoleAlertBanner from "@/component/shared/RoleAlertBanner";
import { roleLabel } from "@/component/shared/roleLabels";
import { breadcrumbRow, breadcrumbs, pageDesc, pageHeaderRow, pageTitle } from "@/component/shared/ui";
import { canReviewReports, canWriteReports } from "./reportUi";

// "Create New Report" in the sidebar's dark navy, like "Add Content" and "Add Client".
const btnCreateReport =
  "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-[#0b1522] px-4.5 py-2.5 text-[13px] font-semibold text-white no-underline shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a]";

const capability = (role: string) =>
  canReviewReports(role)
    ? "You can write reports, review them, and publish them to clients."
    : canWriteReports(role)
      ? "You can write reports and hand them in for review."
      : "You can view reports for the clients you have access to.";

const MonthlyReportsHeader = ({ role }: { role: string }) => (
  <>
    <div className={breadcrumbRow}>
      <div className={breadcrumbs}>
        <b>Monthly Reports</b>
      </div>
    </div>

    <div className={pageHeaderRow}>
      <div>
        <div className={pageTitle}>Monthly Reports</div>
        <div className={pageDesc}>View, edit and manage weekly and monthly performance reports for your clients.</div>
      </div>
      {canWriteReports(role) ? (
        <Link href="/monthly-reports/add" className={btnCreateReport}>
          <Plus size={14} strokeWidth={2.5} /> Create New Report
        </Link>
      ) : null}
    </div>

    <RoleAlertBanner
      message={
        <>
          Signed in as <b>{roleLabel(role)}</b>. {capability(role)}
        </>
      }
    />
  </>
);

export default MonthlyReportsHeader;
