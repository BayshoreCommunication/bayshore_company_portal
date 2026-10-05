import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import { listLeadsAction } from "@/app/actions/leads";
import LeadsList from "@/component/leads/LeadsList";
import {
  DEFAULT_PERIOD,
  LEADS_PER_PAGE,
  canDeleteLeads,
  canWriteLeads,
  isLeadChannel,
  isLeadPeriod,
  isLeadStatus,
  leadsHref,
  periodRange,
  type LeadFilters,
} from "@/component/leads/leadUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The backend's page-size cap — the client filter offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

const LeadsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const rawPeriod = first(params.period);
  const rawStatus = first(params.status);
  const rawChannel = first(params.channel);
  const filters: LeadFilters = {
    period: isLeadPeriod(rawPeriod) ? rawPeriod : DEFAULT_PERIOD,
    client: first(params.client) ?? "all",
    status: isLeadStatus(rawStatus) ? rawStatus : "all",
    channel: isLeadChannel(rawChannel) ? rawChannel : "all",
    caseType: first(params.caseType)?.trim() || "all",
    q: first(params.q)?.trim() ?? "",
  };
  const page = Math.max(1, Number(first(params.page)) || 1);
  const range = periodRange(filters.period);
  const client = filters.client === "all" ? undefined : filters.client;

  const [session, result, previous, clients] = await Promise.all([
    auth(),
    listLeadsAction({
      page,
      limit: LEADS_PER_PAGE,
      client,
      status: filters.status,
      channel: filters.channel,
      caseType: filters.caseType,
      search: filters.q,
      from: range.from,
      to: range.to,
    }),
    // Only the counts are needed from the period before, for the ▲/▼ on the tiles.
    range.previous ? listLeadsAction({ limit: 1, client, ...range.previous }) : null,
    listClientsAction({ limit: CLIENT_OPTIONS_LIMIT }),
  ]);

  // A stale or hand-edited ?page=99 lands on the last page that exists instead of an empty list.
  const totalPages = result.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(leadsHref({ ...filters, page: totalPages }));

  return (
    <LeadsList
      data={result.ok ? result.data : undefined}
      error={result.error}
      previousSummary={previous?.ok ? previous.data?.summary : undefined}
      compareLabel={range.compareLabel}
      filters={filters}
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      canWrite={canWriteLeads(session?.user?.role)}
      canDelete={canDeleteLeads(session?.user?.role)}
    />
  );
};

export default LeadsPage;
