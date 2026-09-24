import { pageDesc } from "@/component/shared/ui";

const DashboardHeader = () => {
  return (
    <div>
      <div className="font-[Georgia,serif] text-[30px] font-bold text-[#0b1a26]">Good Morning, BayShore Communication!</div>
      <div className={pageDesc}>Here&apos;s what&apos;s happening with your clients today.</div>
    </div>
  );
};

export default DashboardHeader;
