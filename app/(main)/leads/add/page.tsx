import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import LeadForm from "@/component/leads/LeadForm";
import { canWriteLeads } from "@/component/leads/leadUi";

// The backend's page-size cap — the client picker offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

const AddLeadPage = async () => {
  const [session, clients] = await Promise.all([auth(), listClientsAction({ limit: CLIENT_OPTIONS_LIMIT })]);
  if (!canWriteLeads(session?.user?.role)) redirect("/leads");

  return <LeadForm clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))} />;
};

export default AddLeadPage;
