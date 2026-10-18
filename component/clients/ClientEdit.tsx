import type { Client, StaffOption } from "@/app/actions/clients";
import { ClientForm } from "./ClientAdd";

// The Edit Client page: the Add Client form (ClientAdd.tsx), filled in with the client as saved.
// `backHref` is where Cancel goes, when not the client's own page.
const ClientEdit = ({ client, staff, backHref }: { client: Client; staff?: StaffOption[]; backHref?: string }) => <ClientForm client={client} staff={staff} backHref={backHref} />;

export default ClientEdit;
