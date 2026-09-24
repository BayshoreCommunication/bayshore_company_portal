import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getClientAction } from "@/app/actions/clients";
import ClientDetails from "@/component/clients/ClientDetails";
import { canDeleteClients, canManageClients } from "@/component/clients/clientUi";
import { formErrorBanner } from "@/component/shared/ui";

const ClientDetailPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
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

  const role = session?.user?.role;

  return (
    <ClientDetails client={result.data} canManage={canManageClients(role)} canDelete={canDeleteClients(role)} />
  );
};

export default ClientDetailPage;
