import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import { listReportsAction } from "@/app/actions/reports";
import ReportList from "@/component/monthly-reports/ReportList";
import { REPORTS_PER_PAGE, isMonthValue, isReportStatus, monthRange, reportsHref } from "@/component/monthly-reports/reportUi";

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

  // A stale or hand-edited ?page=99 lands on the last page that exists.
  const totalPages = reports.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(reportsHref({ client, month, status, q: search, page: totalPages }));

  return (
    <ReportList
      data={reports.ok ? reports.data : undefined}
      error={reports.error}
      filters={{ client, month, status, search }}
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      role={session?.user?.role ?? ""}
    />
  );
};

export default MonthlyReportsPage;
