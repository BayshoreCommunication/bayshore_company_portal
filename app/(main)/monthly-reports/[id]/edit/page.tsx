import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getReportAction } from "@/app/actions/reports";
import EditReport from "@/component/monthly-reports/EditReport";
import { formErrorBanner } from "@/component/shared/ui";

const EditReportPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [session, result] = await Promise.all([auth(), getReportAction(id)]);

  // 404 = not found or not one of your clients; 422 = the id isn't even a valid id.
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div className={formErrorBanner} role="alert">
        {result.error ?? "Could not load this report."}
      </div>
    );
  }

  return <EditReport report={result.data.report} role={session?.user?.role ?? ""} userName={session?.user?.name ?? ""} />;
};

export default EditReportPage;
