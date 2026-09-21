import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CreateClients from "@/component/clients/CreateClients";
import { canManageClients } from "@/component/clients/clientUi";

const AddClientPage = async () => {
  const session = await auth();
  if (!canManageClients(session?.user?.role)) redirect("/clients");

  return (
    <div>
      <CreateClients />
    </div>
  );
};

export default AddClientPage;
