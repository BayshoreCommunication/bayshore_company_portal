import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import CreateMonthlyReports from "@/component/monthly-reports/CreateMonthlyReports";
import { canWriteReports } from "@/component/monthly-reports/reportUi";

const CreateMonthlyReportPage = async () => {
  const session = await auth();
  const role = session?.user?.role ?? "";
  if (!canWriteReports(role)) redirect("/monthly-reports");

  // The clients this person can write reports for. A long list is cut at the API's page size.
  const clients = await listClientsAction({ limit: 100 });

  return (
    <CreateMonthlyReports
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      role={role}
      userName={session?.user?.name ?? ""}
    />
  );
};

export default CreateMonthlyReportPage;
