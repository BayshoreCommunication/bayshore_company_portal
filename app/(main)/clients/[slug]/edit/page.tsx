import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientAction, listStaffAction } from "@/app/actions/clients";
import ClientEdit from "@/component/clients/ClientEdit";
import { canManageClients } from "@/component/clients/clientUi";
import { formErrorBanner } from "@/component/shared/ui";

const EditClientPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const [session, result, staff] = await Promise.all([auth(), getClientAction(slug), listStaffAction()]);

  if (!canManageClients(session?.user?.role)) redirect(`/clients/${slug}`);
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div className={formErrorBanner} role="alert">
        {result.error ?? "Could not load this client."}
      </div>
    );
  }

  return <ClientEdit client={result.data} staff={staff} />;
};

export default EditClientPage;
