import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getClientAction } from "@/app/actions/clients";
import { listOnboardingCommentsAction } from "@/app/actions/onboarding";
import OnboardingReview from "@/component/clients/OnboardingReview";
import { canManageClients } from "@/component/clients/clientUi";
import { formErrorBanner } from "@/component/shared/ui";

// A client's onboarding and transfer, on a page of its own — opened from that part of the
// client's page (ClientDetails → RecordSections), or with `?edit=1` from the client form, to
// fill the answers in.
const ClientOnboardingPage = async ({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ edit?: string }> }) => {
  const [{ slug }, { edit }] = await Promise.all([params, searchParams]);
  const [session, result] = await Promise.all([auth(), getClientAction(slug)]);

  // 404 = not found or not one of your clients; 422 = the id isn't even a valid id.
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div className={formErrorBanner} role="alert">
        {result.error ?? "Could not load this client."}
      </div>
    );
  }

  const comments = await listOnboardingCommentsAction(result.data._id);

  return (
    <OnboardingReview
      client={result.data}
      canManage={canManageClients(session?.user?.role)}
      comments={comments.ok && comments.data ? comments.data : []}
      editMode={edit === "1"}
    />
  );
};

export default ClientOnboardingPage;
