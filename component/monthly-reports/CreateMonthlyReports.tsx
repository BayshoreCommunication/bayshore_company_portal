import ReportEditor from "./ReportEditor";

const CreateMonthlyReports = ({
  clients,
  role,
  userName,
  initialClientId,
}: {
  clients: { _id: string; companyName: string }[];
  role: string;
  userName: string;
  initialClientId?: string;
}) => <ReportEditor clients={clients} role={role} userName={userName} readOnly={false} initialClientId={initialClientId} />;

export default CreateMonthlyReports;
