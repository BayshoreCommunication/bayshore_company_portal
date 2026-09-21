import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import ClientsHeader from "@/component/clients/ClientsHeader";
import ClientStats from "@/component/clients/ClientStats";
import ClientsToolbar from "@/component/clients/ClientsToolbar";
import ClientsGrid from "@/component/clients/ClientsGrid";
import ClientsPagination from "@/component/clients/ClientsPagination";
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
  const canManage = canManageClients(session?.user?.role);

  if (!result.ok || !result.data) {
    return (
      <>
        <ClientsHeader canManage={canManage} />
        <div className="form-error-banner" role="alert">
          {result.error ?? "Could not load clients."}
        </div>
      </>
    );
  }

  const { clients, summary, pagination } = result.data;

  // A stale or hand-edited ?page=99 lands on the last page that exists instead of an empty list.
  if (pagination.totalPages > 0 && page > pagination.totalPages) {
    redirect(clientsHref({ status, q: search, page: pagination.totalPages }));
  }

  return (
    <>
      <ClientsHeader canManage={canManage} />
      <ClientStats summary={summary} />
      <ClientsToolbar status={status} search={search} summary={summary} />
      <ClientsGrid clients={clients} filtered={status !== "all" || search !== ""} canManage={canManage} />
      <ClientsPagination pagination={pagination} status={status} search={search} />
    </>
  );
};

export default ClientsPage;
