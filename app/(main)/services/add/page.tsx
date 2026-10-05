import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ServiceForm from "@/component/services/ServiceForm";
import { canManageServices } from "@/component/services/serviceUi";

const AddServicePage = async () => {
  const session = await auth();
  if (!canManageServices(session?.user?.role)) redirect("/services");

  return <ServiceForm />;
};

export default AddServicePage;
