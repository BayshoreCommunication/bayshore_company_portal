import { auth } from "@/auth";
import { getClientAction, listClientsAction } from "@/app/actions/clients";
import { listServicesAction } from "@/app/actions/service";
import ServicesList from "@/component/services/ServicesList";
import { getServicesLockAction } from "@/app/actions/servicesLock";
import ServicesLock from "@/component/services/ServicesLock";
import { SERVICES_NEED_CODE } from "@/lib/servicesPass";
import { canManageClients } from "@/component/clients/clientUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The backend's page-size cap — the client picker offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

// ?client=<id> shows that client's services; without it, the catalog's totals.
const ServicesPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  // Behind the security code, when Services asks for it: nothing is loaded until it is entered.
  if (SERVICES_NEED_CODE) {
    const lock = await getServicesLockAction();
    if (!lock.unlocked) return <ServicesLock available={lock.available} />;
  }

  const params = await searchParams;
  const clientId = first(params.client) ?? "all";
  // From the client form's Services and pricing: open with the services being edited.
  const startEditing = first(params.edit) === "1";
  // Opened from the client's page or the client form: the way back to it shows.
  const fromClient = first(params.from) === "client";

  const [session, clients, catalog, client] = await Promise.all([
    auth(),
    listClientsAction({ limit: CLIENT_OPTIONS_LIMIT }),
    listServicesAction(),
    // The client's own record: the services recorded on their form, as on their page.
    clientId === "all" ? null : getClientAction(clientId),
  ]);

  return (
    <ServicesList
      catalog={catalog.ok ? catalog.data : undefined}
      clients={(clients.data?.clients ?? []).map(({ _id, companyName, contactName }) => ({ _id, companyName, contactName }))}
      clientId={clientId}
      client={client?.ok ? client.data : undefined}
      canEditClient={canManageClients(session?.user?.role)}
      startEditing={startEditing}
      fromClient={fromClient}
    />
  );
};

export default ServicesPage;
