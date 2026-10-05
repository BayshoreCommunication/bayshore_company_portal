import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectAction } from "@/app/actions/projects";
import ProjectForm from "@/component/projects/ProjectForm";
import { canDeleteProjects, canWriteProjects } from "@/component/projects/projectUi";

const EditProjectPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [session, result] = await Promise.all([auth(), getProjectAction(id)]);

  if (!canWriteProjects(session?.user?.role)) redirect("/projects");
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
        {result.error ?? "Could not load this project."} Please refresh the page to try again.
      </div>
    );
  }

  // The project's own client is shown read-only, so no client list is needed here.
  return <ProjectForm project={result.data} canDelete={canDeleteProjects(session?.user?.role)} />;
};

export default EditProjectPage;
