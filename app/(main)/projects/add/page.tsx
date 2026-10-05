import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import ProjectForm from "@/component/projects/ProjectForm";
import { canWriteProjects } from "@/component/projects/projectUi";

// The backend's page-size cap — the client picker offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

const AddProjectPage = async () => {
  const [session, clients] = await Promise.all([auth(), listClientsAction({ limit: CLIENT_OPTIONS_LIMIT })]);
  if (!canWriteProjects(session?.user?.role)) redirect("/projects");

  return <ProjectForm clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))} />;
};

export default AddProjectPage;
