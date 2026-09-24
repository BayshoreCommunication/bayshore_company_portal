import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import { listReportsAction } from "@/app/actions/reports";
import MonthlyReportsHeader from "@/component/monthly-reports/MonthlyReportsHeader";
import ReportFilters from "@/component/monthly-reports/ReportFilters";
import ReportsTable, { ReportStats } from "@/component/monthly-reports/ReportsTable";
import {
  REPORTS_PER_PAGE,
  canDeleteReports,
  canWriteReports,
  isMonthValue,
  isReportStatus,
  monthRange,
  reportsHref,
} from "@/component/monthly-reports/reportUi";
import { formErrorBanner } from "@/component/shared/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const MonthlyReportsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const client = /^[0-9a-f]{24}$/i.test(first(params.client) ?? "") ? (first(params.client) as string) : "";
  const rawMonth = first(params.month);
  const month = isMonthValue(rawMonth) ? rawMonth : "";
  const rawStatus = first(params.status);
  const status = isReportStatus(rawStatus) ? rawStatus : "";
  const search = first(params.q)?.trim() ?? "";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [session, reports, clients] = await Promise.all([
    auth(),
    listReportsAction({
      page,
      limit: REPORTS_PER_PAGE,
      client: client || undefined,
      status: status || "all",
      search,
      ...(month ? monthRange(month) : {}),
    }),
    // For the client filter. A long client list is cut at the API's page size.
    listClientsAction({ limit: 100 }),
  ]);

  const role = session?.user?.role ?? "";

  if (!reports.ok || !reports.data) {
    return (
      <>
        <MonthlyReportsHeader role={role} />
        <div className={formErrorBanner} role="alert">
          {reports.error ?? "Could not load reports."}
        </div>
      </>
    );
  }

  // A stale or hand-edited ?page=99 lands on the last page that exists.
  if (reports.data.pagination.totalPages > 0 && page > reports.data.pagination.totalPages) {
    redirect(reportsHref({ client, month, status, q: search, page: reports.data.pagination.totalPages }));
  }

  return (
    <>
      <MonthlyReportsHeader role={role} />
      <ReportStats summary={reports.data.summary} filters={{ client, month, status, search }} />
      <ReportFilters
        clients={clients.data?.clients ?? []}
        client={client}
        month={month}
        status={status}
        search={search}
      />
      <ReportsTable
        data={reports.data}
        filters={{ client, month, status, search }}
        canWrite={canWriteReports(role)}
        canDelete={canDeleteReports(role)}
      />
    </>
  );
};

export default MonthlyReportsPage;
