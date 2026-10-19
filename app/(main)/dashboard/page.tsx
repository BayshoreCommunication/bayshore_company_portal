import { auth } from "@/auth";
import { getDashboardOverviewAction } from "@/app/actions/dashboard";
import DashboardOverview from "@/component/dashbaord/DashboardOverview";

const DashboardPage = async () => {
  const [session, result] = await Promise.all([auth(), getDashboardOverviewAction()]);

  if (!result.ok) {
    return (
      <div className="rounded-2xl border border-[#fecaca] bg-[#fff7f7] px-5 py-10 text-center text-[13px] text-[#b91c1c]">
        Couldn&apos;t load the dashboard: {result.error}
      </div>
    );
  }

  return <DashboardOverview name={session?.user?.name ?? ""} data={result.data} />;
};

export default DashboardPage;
