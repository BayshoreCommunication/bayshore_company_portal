import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import { listContentAction } from "@/app/actions/content";
import ContentList from "@/component/content/ContentList";
import {
  CONTENT_PER_PAGE,
  canDeleteContent,
  canWriteContent,
  contentListHref,
  isBatchType,
  isContentStatus,
  isContentType,
  type ContentListFilters,
} from "@/component/content/contentUi";
import { breadcrumbRow, breadcrumbs, formErrorBanner } from "@/component/shared/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const ContentPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  // Anything unrecognised in the URL is simply ignored.
  const rawClient = first(params.client) ?? "";
  const rawType = first(params.type);
  const rawStatus = first(params.status);
  const rawBatch = first(params.batch);
  const filters: ContentListFilters = {
    client: /^[0-9a-f]{24}$/i.test(rawClient) ? rawClient : "",
    type: isContentType(rawType) ? rawType : "",
    status: isContentStatus(rawStatus) ? rawStatus : "",
    month: first(params.month)?.trim() ?? "",
    batchType: isBatchType(rawBatch) ? rawBatch : "",
    search: first(params.q)?.trim() ?? "",
  };
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [session, content, clients] = await Promise.all([
    auth(),
    listContentAction({
      page,
      limit: CONTENT_PER_PAGE,
      client: filters.client || undefined,
      type: isContentType(filters.type) ? filters.type : undefined,
      status: isContentStatus(filters.status) ? filters.status : "all",
      batchMonth: filters.month || undefined,
      batchType: isBatchType(filters.batchType) ? filters.batchType : undefined,
      search: filters.search,
    }),
    // For the client filter. A long client list is cut at the API's page size.
    listClientsAction({ limit: 100 }),
  ]);

  if (!content.ok || !content.data) {
    return (
      <>
        <div className={breadcrumbRow}>
          <div className={breadcrumbs}>
            <b>Content</b>
          </div>
        </div>
        <div className={formErrorBanner} role="alert">
          {content.error ?? "Could not load content."}
        </div>
      </>
    );
  }

  // A stale or hand-edited ?page=99 lands on the last page that exists.
  const { totalPages } = content.data.pagination;
  if (totalPages > 0 && page > totalPages) redirect(contentListHref({ ...filters, page: totalPages }));

  return (
    <ContentList
      data={content.data}
      filters={filters}
      clients={(clients.data?.clients ?? []).map(({ _id, companyName }) => ({ _id, companyName }))}
      canWrite={canWriteContent(session?.user?.role)}
      canDelete={canDeleteContent(session?.user?.role)}
    />
  );
};

export default ContentPage;
