import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getContentAction } from "@/app/actions/content";
import ContentEdit from "@/component/content/ContentEdit";
import { canReviewContent, canWriteContent } from "@/component/content/contentUi";
import { breadcrumbLink, breadcrumbRow, breadcrumbs, formErrorBanner } from "@/component/shared/ui";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const Problem = ({ message }: { message: string }) => (
  <>
    <div className={breadcrumbRow}>
      <div className={breadcrumbs}>
        <Link href="/content" className={breadcrumbLink}>
          Content
        </Link>{" "}
        <b>Edit</b>
      </div>
    </div>
    <div className={formErrorBanner} role="alert">
      {message}
    </div>
  </>
);

// /content/edit?id=<content id>
const EditContentPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const id = first((await searchParams).id) ?? "";
  if (!/^[0-9a-f]{24}$/i.test(id)) notFound();

  const [session, result] = await Promise.all([auth(), getContentAction(id)]);
  const role = session?.user?.role;

  if (result.status === 404 || result.status === 422) notFound();
  if (!result.ok || !result.data) return <Problem message={result.error ?? "Could not load this content."} />;
  if (!canWriteContent(role)) return <Problem message="Your role can view content but not edit it." />;

  return <ContentEdit item={result.data} canReview={canReviewContent(role)} />;
};

export default EditContentPage;
