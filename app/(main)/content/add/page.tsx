import { auth } from "@/auth";
import { listClientsAction } from "@/app/actions/clients";
import AddContent from "@/component/content/AddContent";
import { canDeleteContent, canWriteContent } from "@/component/content/contentUi";
import { breadcrumbRow, breadcrumbs, formErrorBanner } from "@/component/shared/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// ?client=<id> opens the page with that client already picked (from the Content list).
const AddContentPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const [params, session, clients] = await Promise.all([searchParams, auth(), listClientsAction({ limit: 100 })]);

  const problem = !canWriteContent(session?.user?.role)
    ? "Your role can view content but not add it."
    : !clients.ok
      ? (clients.error ?? "Could not load your clients.")
      : !clients.data?.clients.length
        ? "No clients yet — add a client before preparing content."
        : null;

  if (problem) {
    return (
      <>
        <div className={breadcrumbRow}>
          <div className={breadcrumbs}>
            Content / <b>Add Content</b>
          </div>
        </div>
        <div className={formErrorBanner} role="alert">
          {problem}
        </div>
      </>
    );
  }

  return (
    <AddContent
      clients={(clients.data?.clients ?? []).map(({ _id, companyName, contactName }) => ({ _id, companyName, contactName }))}
      initialClientId={first(params.client) ?? ""}
      canDelete={canDeleteContent(session?.user?.role)}
    />
  );
};

export default AddContentPage;
