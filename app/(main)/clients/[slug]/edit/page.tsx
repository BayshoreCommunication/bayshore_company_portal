import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientAction } from "@/app/actions/clients";
import ClientForm from "@/component/clients/ClientForm";
import { canManageClients } from "@/component/clients/clientUi";

const EditClientPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const [session, result] = await Promise.all([auth(), getClientAction(slug)]);

  if (!canManageClients(session?.user?.role)) redirect(`/clients/${slug}`);
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div className="form-error-banner" role="alert">
        {result.error ?? "Could not load this client."}
      </div>
    );
  }

  return <ClientForm client={result.data} />;
};

export default EditClientPage;
