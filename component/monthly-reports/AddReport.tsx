import ReportForm from "./ReportForm";

// A new report: pick the client and the period, then fill in the sections.
// `initialClientId` opens the form with that client already picked (from a client's page).
const AddReport = ({
  clients,
  role,
  userName,
  initialClientId,
}: {
  clients: { _id: string; companyName: string }[];
  role: string;
  userName: string;
  initialClientId?: string;
}) => <ReportForm clients={clients} role={role} userName={userName} readOnly={false} initialClientId={initialClientId} />;

export default AddReport;
