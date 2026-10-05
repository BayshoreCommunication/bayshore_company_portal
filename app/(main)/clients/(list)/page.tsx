import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import ClientCard from "@/component/clients/ClientCard";
import { CLIENTS_PER_PAGE, canManageClients, clientsHref, isClientStatus } from "@/component/clients/clientUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const ClientsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const status = isClientStatus(rawStatus) ? rawStatus : "all";
  const search = first(params.q)?.trim() ?? "";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [session, result] = await Promise.all([
    auth(),
    listClientsAction({ page, limit: CLIENTS_PER_PAGE, status, search }),
  ]);

  // A stale or hand-edited ?page=99 lands on the last page that exists instead of an empty list.
  const totalPages = result.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(clientsHref({ status, q: search, page: totalPages }));

  return (
    <ClientCard
      data={result.ok ? result.data : undefined}
      error={result.error}
      status={status}
      search={search}
      canManage={canManageClients(session?.user?.role)}
    />
  );
};

export default ClientsPage;
