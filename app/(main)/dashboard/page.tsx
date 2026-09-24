import DashboardHeader from "@/component/dashbaord/DashboardHeader";
import MetricCards from "@/component/dashbaord/MetricCards";
import SupportTickets from "@/component/dashbaord/SupportTickets";
import UpcomingMeetings from "@/component/dashbaord/UpcomingMeetings";
import RecentReports from "@/component/dashbaord/RecentReports";
import ClientGrowthChart from "@/component/dashbaord/ClientGrowthChart";
import ReportStatusDonut from "@/component/dashbaord/ReportStatusDonut";
import RecentPayments from "@/component/dashbaord/RecentPayments";
import { dashSideCol } from "@/component/shared/ui";

const DashboardPage = () => {
  return (
    <>
      <DashboardHeader />
      <MetricCards />

      <div className="grid grid-cols-[1.6fr_1fr] items-stretch gap-5">
        <SupportTickets />
        <div className={dashSideCol}>
          <UpcomingMeetings />
          <RecentReports />
        </div>
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] items-start gap-5">
        <ClientGrowthChart />
        <ReportStatusDonut />
      </div>

      <RecentPayments />
    </>
  );
};

export default DashboardPage;
