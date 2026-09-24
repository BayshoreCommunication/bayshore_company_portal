import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ClientForm from "@/component/clients/ClientForm";
import { canManageClients } from "@/component/clients/clientUi";

const AddClientPage = async () => {
  const session = await auth();
  if (!canManageClients(session?.user?.role)) redirect("/clients");

  return <ClientForm />;
};

export default AddClientPage;
