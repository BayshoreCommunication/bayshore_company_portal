import type { Report } from "@/app/actions/reports";
import ReportForm from "./ReportForm";
import { canReviewReports, canWriteReports } from "./reportUi";

// An existing report. Its client is fixed, so no client list is needed here.
const EditReport = ({ report, role, userName }: { report: Report; role: string; userName: string }) => {
  // Writers can only edit a draft; reviewers can edit at any stage; everyone else just reads.
  const readOnly = !canWriteReports(role) || (!canReviewReports(role) && report.status !== "draft");

  return <ReportForm clients={[]} report={report} role={role} userName={userName} readOnly={readOnly} />;
};

export default EditReport;
