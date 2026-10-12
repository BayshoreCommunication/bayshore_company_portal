import type { Client, StaffOption } from "@/app/actions/clients";
import { ClientForm } from "./ClientAdd";

// The Edit Client page: the Add Client form (ClientAdd.tsx), filled in with the client as saved.
const ClientEdit = ({ client, staff }: { client: Client; staff?: StaffOption[] }) => <ClientForm client={client} staff={staff} />;

export default ClientEdit;
