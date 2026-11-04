import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import ProjectForm from "@/component/projects/ProjectForm";
import { canWriteProjects } from "@/component/projects/projectUi";

// The backend's page-size cap — the client picker offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// /projects/add?client=<id> — opened from a client's group on Client Projects: that client chosen.
const AddProjectPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const [{ client }, session, clients] = await Promise.all([searchParams, auth(), listClientsAction({ limit: CLIENT_OPTIONS_LIMIT })]);
  if (!canWriteProjects(session?.user?.role)) redirect("/projects");

  return (
    <ProjectForm
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      defaultClient={typeof client === "string" ? client : undefined}
    />
  );
};

export default AddProjectPage;
