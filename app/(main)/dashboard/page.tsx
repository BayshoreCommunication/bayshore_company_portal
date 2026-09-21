import DashboardHeader from "@/component/dashbaord/DashboardHeader";
import MetricCards from "@/component/dashbaord/MetricCards";
import SupportTickets from "@/component/dashbaord/SupportTickets";
import UpcomingMeetings from "@/component/dashbaord/UpcomingMeetings";
import RecentReports from "@/component/dashbaord/RecentReports";
import ClientGrowthChart from "@/component/dashbaord/ClientGrowthChart";
import ReportStatusDonut from "@/component/dashbaord/ReportStatusDonut";
import RecentPayments from "@/component/dashbaord/RecentPayments";

const DashboardPage = () => {
  return (
    <>
      <DashboardHeader />
      <MetricCards />

      <div className="dash-main-grid" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "stretch" }}>
        <SupportTickets />
        <div className="dash-side-col">
          <UpcomingMeetings />
          <RecentReports />
        </div>
      </div>

      <div className="dash-main-grid" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <ClientGrowthChart />
        <ReportStatusDonut />
      </div>

      <RecentPayments />
    </>
  );
};

export default DashboardPage;
