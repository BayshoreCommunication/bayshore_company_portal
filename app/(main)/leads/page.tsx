import LeadsHeader from "@/component/leads/LeadsHeader";
import LeadStats from "@/component/leads/LeadStats";
import LeadsFilterRow from "@/component/leads/LeadsFilterRow";
import LeadsTable from "@/component/leads/LeadsTable";
import LeadsSidePanel from "@/component/leads/LeadsSidePanel";

const LeadsPage = () => {
  return (
    <>
      <LeadsHeader />
      <LeadStats />
      <LeadsFilterRow />

      <div className="grid grid-cols-[2.2fr_1fr] items-stretch gap-5">
        <LeadsTable />
        <LeadsSidePanel />
      </div>
    </>
  );
};

export default LeadsPage;
