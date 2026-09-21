import ReportEditor from "./ReportEditor";

const CreateMonthlyReports = ({
  clients,
  role,
  userName,
}: {
  clients: { _id: string; companyName: string }[];
  role: string;
  userName: string;
}) => <ReportEditor clients={clients} role={role} userName={userName} readOnly={false} />;

export default CreateMonthlyReports;
