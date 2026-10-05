import { ClientListSkeleton } from "@/component/clients/ClientSkeletons";

// Shown while the Clients list renders on the server. It lives in the (list) group with
// the list's page.tsx so that add/ and [slug] don't borrow this skeleton; the group
// doesn't change the URL, which is still /clients.
const ClientsLoading = () => <ClientListSkeleton />;

export default ClientsLoading;
