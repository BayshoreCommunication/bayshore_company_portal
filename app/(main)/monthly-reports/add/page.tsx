import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import CreateMonthlyReports from "@/component/monthly-reports/CreateMonthlyReports";
import { canWriteReports } from "@/component/monthly-reports/reportUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// ?client=<id> opens the form with that client already picked (from a client's page).
const CreateMonthlyReportPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const client = Array.isArray(params.client) ? params.client[0] : params.client;
  const role = session?.user?.role ?? "";
  if (!canWriteReports(role)) redirect("/monthly-reports");

  // The clients this person can write reports for. A long list is cut at the API's page size.
  const clients = await listClientsAction({ limit: 100 });

  return (
    <CreateMonthlyReports
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      role={role}
      userName={session?.user?.name ?? ""}
      initialClientId={client ?? ""}
    />
  );
};

export default CreateMonthlyReportPage;
