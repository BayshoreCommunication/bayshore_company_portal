import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOnboardingRequestAction } from "@/app/actions/onboarding";
import OnboardingRequestDetails from "@/component/clients/OnboardingRequestDetails";
import { canDeleteClients } from "@/component/clients/clientUi";
import { formErrorBanner } from "@/component/shared/ui";

// One onboarding request in full — opened from the list at the top of the Clients page.
const OnboardingRequestPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [session, result] = await Promise.all([auth(), getOnboardingRequestAction(id)]);

  // 404 = no onboarding under this id; 422 = it isn't even a valid id.
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div className={formErrorBanner} role="alert">
        {result.error ?? "Could not load this onboarding request."}
      </div>
    );
  }

  // The client an onboarding makes has no account manager or team yet, so only those who see
  // every client (the same roles that can delete one) can open its record.
  return <OnboardingRequestDetails request={result.data} canOpenClient={canDeleteClients(session?.user?.role)} />;
};

export default OnboardingRequestPage;
