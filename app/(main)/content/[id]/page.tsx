import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getContentAction, listContentAction } from "@/app/actions/content";
import ContentDetails from "@/component/content/ContentDetails";
import { canWriteContent, clientIdOf } from "@/component/content/contentUi";
import { breadcrumbLink, breadcrumbRow, breadcrumbs, formErrorBanner } from "@/component/shared/ui";

const RELATED_LIMIT = 5;

const ContentDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  // Anything that isn't a content id is simply not found.
  if (!/^[0-9a-f]{24}$/i.test(id)) notFound();

  const [session, result] = await Promise.all([auth(), getContentAction(id)]);

  // 404 = gone, or a client you can't see.
  if (result.status === 404 || result.status === 422) notFound();
  if (!result.ok || !result.data) {
    return (
      <>
        <div className={breadcrumbRow}>
          <div className={breadcrumbs}>
            <Link href="/content" className={breadcrumbLink}>
              Content
            </Link>
          </div>
        </div>
        <div className={formErrorBanner} role="alert">
          {result.error ?? "Could not load this content."}
        </div>
      </>
    );
  }

  const item = result.data;
  // Other pieces prepared for the same client, newest first.
  const related = await listContentAction({ client: clientIdOf(item.client), limit: RELATED_LIMIT + 1 });
  const others = (related.data?.items ?? []).filter((other) => other._id !== item._id).slice(0, RELATED_LIMIT);

  return (
    <ContentDetails
      item={item}
      related={others}
      canWrite={canWriteContent(session?.user?.role)}
    />
  );
};

export default ContentDetailsPage;
