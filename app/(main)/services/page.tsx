import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import { getClientServicesAction, listServicesAction } from "@/app/actions/service";
import ServicesList from "@/component/services/ServicesList";
import { canAssignServices, canManageServices } from "@/component/services/serviceUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The backend's page-size cap — the client picker offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

// ?client=<id> shows that client's services and monthly payment; without it, the catalog.
// The catalog is loaded either way: the client's view needs it to offer more services.
const ServicesPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const clientId = first(params.client) ?? "all";

  const [session, clients, catalog, clientServices] = await Promise.all([
    auth(),
    listClientsAction({ limit: CLIENT_OPTIONS_LIMIT }),
    listServicesAction(),
    clientId === "all" ? null : getClientServicesAction(clientId),
  ]);

  return (
    <ServicesList
      catalog={catalog.ok ? catalog.data : undefined}
      catalogError={catalog.error}
      clientServices={clientServices?.ok ? clientServices.data : undefined}
      clientError={clientServices?.error}
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      clientId={clientId}
      canManage={canManageServices(session?.user?.role)}
      canAssign={canAssignServices(session?.user?.role)}
    />
  );
};

export default ServicesPage;
