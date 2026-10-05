import { ReportListSkeleton } from "@/component/monthly-reports/ReportSkeletons";

// Shown while the Monthly Reports list renders on the server. It lives in the (list)
// group with the list's page.tsx so that add/ and [id]/edit don't borrow this skeleton;
// the group doesn't change the URL, which is still /monthly-reports.
const ReportsLoading = () => <ReportListSkeleton />;

export default ReportsLoading;
