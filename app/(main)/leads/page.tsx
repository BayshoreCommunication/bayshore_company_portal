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

      <div className="dash-main-grid" style={{ gridTemplateColumns: "2.2fr 1fr", alignItems: "stretch" }}>
        <LeadsTable />
        <LeadsSidePanel />
      </div>
    </>
  );
};

export default LeadsPage;
