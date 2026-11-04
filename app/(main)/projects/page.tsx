import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import { listProjectsAction, listProjectsByClientAction } from "@/app/actions/projects";
import ProjectsList from "@/component/projects/ProjectsList";
import {
  PROJECTS_PER_PAGE,
  canDeleteProjects,
  canWriteProjects,
  isProjectPriority,
  isProjectStatusFilter,
  isProjectView,
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
  const rawView = first(params.view);
  const filters: ProjectFilters = {
    view: isProjectView(rawView) ? rawView : "clients",
    client: first(params.client) ?? "all",
    status: isProjectStatusFilter(rawStatus) ? rawStatus : "all",
    priority: isProjectPriority(rawPriority) ? rawPriority : "all",
    q: first(params.q)?.trim() ?? "",
  };
  const page = Math.max(1, Number(first(params.page)) || 1);

  const byClientView = filters.view === "clients";
  const [session, result, clients, grouped] = await Promise.all([
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
    byClientView
      ? listProjectsByClientAction({
          client: filters.client === "all" ? undefined : filters.client,
          status: filters.status,
          priority: filters.priority,
          search: filters.q,
        })
      : null,
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
      byClient={grouped?.ok ? grouped.data?.byClient : undefined}
    />
  );
};

export default ProjectsPage;
