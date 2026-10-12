import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listStaffAction } from "@/app/actions/clients";
import ClientAdd from "@/component/clients/ClientAdd";
import { canManageClients } from "@/component/clients/clientUi";

const AddClientPage = async () => {
  const session = await auth();
  if (!canManageClients(session?.user?.role)) redirect("/clients");

  return <ClientAdd staff={await listStaffAction()} />;
};

export default AddClientPage;
