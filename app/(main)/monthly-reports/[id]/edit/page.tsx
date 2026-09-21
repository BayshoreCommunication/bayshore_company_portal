import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getReportAction } from "@/app/actions/reports";
import ReportEditor from "@/component/monthly-reports/ReportEditor";
import { canReviewReports, canWriteReports } from "@/component/monthly-reports/reportUi";

const EditReportPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [session, result] = await Promise.all([auth(), getReportAction(id)]);

  // 404 = not found or not one of your clients; 422 = the id isn't even a valid id.
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div className="form-error-banner" role="alert">
        {result.error ?? "Could not load this report."}
      </div>
    );
  }

  const role = session?.user?.role ?? "";
  const { report } = result.data;

  // Writers can only edit a draft; reviewers can edit at any stage; everyone else just reads.
  const readOnly = !canWriteReports(role) || (!canReviewReports(role) && report.status !== "draft");

  return <ReportEditor clients={[]} report={report} role={role} userName={session?.user?.name ?? ""} readOnly={readOnly} />;
};

export default EditReportPage;
