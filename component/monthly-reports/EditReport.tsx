import type { Report } from "@/app/actions/reports";
import ReportComments from "./ReportComments";
import ReportForm from "./ReportForm";
import { canReviewReports, canWriteReports } from "./reportUi";

// An existing report. Its client is fixed, so no client list is needed here.
const EditReport = ({ report, role, userName }: { report: Report; role: string; userName: string }) => {
  // Writers can only edit a draft; reviewers can edit at any stage; everyone else just reads.
  const readOnly = !canWriteReports(role) || (!canReviewReports(role) && report.status !== "draft");

  const clientId = typeof report.client === "string" ? report.client : report.client?._id;

  return (
    <div className="flex flex-col gap-5">
      <ReportForm clients={[]} report={report} role={role} userName={userName} readOnly={readOnly} />
      {/* What the client asked or said about it, and the team's replies. */}
      {clientId ? <ReportComments reportId={report._id} clientId={clientId} published={report.status === "published"} /> : null}
    </div>
  );
};

export default EditReport;
