import type { Client, StaffOption } from "@/app/actions/clients";
import { ClientForm } from "./ClientAdd";

// The Edit Client page: the Add Client form (ClientAdd.tsx), filled in with the client as saved.
// `backHref` is where Cancel goes, when not the client's own page.
// `only` is the one part to show (1–5), when opened from that part's Edit on the client's page.
const ClientEdit = ({ client, staff, backHref, only }: { client: Client; staff?: StaffOption[]; backHref?: string; only?: number }) => (
  <ClientForm client={client} staff={staff} backHref={backHref} only={only} />
);

export default ClientEdit;
