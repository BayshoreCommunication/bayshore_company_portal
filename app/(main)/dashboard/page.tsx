import { auth } from "@/auth";
import DashboardOverview from "@/component/dashbaord/DashboardOverview";

const DashboardPage = async () => {
  const session = await auth();

  return <DashboardOverview name={session?.user?.name ?? ""} />;
};

export default DashboardPage;
