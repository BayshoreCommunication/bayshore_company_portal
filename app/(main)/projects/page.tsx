import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import { listProjectsAction } from "@/app/actions/projects";
import ProjectsList from "@/component/projects/ProjectsList";
import {
  PROJECTS_PER_PAGE,
  canDeleteProjects,
  canWriteProjects,
  isProjectPriority,
  isProjectStatus,
  projectsHref,
  type ProjectFilters,
} from "@/component/projects/projectUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The backend's page-size cap — the client filter offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

const ProjectsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const rawStatus = first(params.status);
  const rawPriority = first(params.priority);
  const filters: ProjectFilters = {
    client: first(params.client) ?? "all",
    status: isProjectStatus(rawStatus) ? rawStatus : "all",
    priority: isProjectPriority(rawPriority) ? rawPriority : "all",
    q: first(params.q)?.trim() ?? "",
  };
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [session, result, clients] = await Promise.all([
    auth(),
    listProjectsAction({
      page,
      limit: PROJECTS_PER_PAGE,
      client: filters.client === "all" ? undefined : filters.client,
      status: filters.status,
      priority: filters.priority,
      search: filters.q,
    }),
    listClientsAction({ limit: CLIENT_OPTIONS_LIMIT }),
  ]);

  // A stale or hand-edited ?page=99 — or deleting the last project on a page —
  // lands on the last page that exists instead of an empty list.
  const totalPages = result.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(projectsHref({ ...filters, page: totalPages }));

  return (
    <ProjectsList
      data={result.ok ? result.data : undefined}
      error={result.error}
      filters={filters}
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      canWrite={canWriteProjects(session?.user?.role)}
      canDelete={canDeleteProjects(session?.user?.role)}
    />
  );
};

export default ProjectsPage;
