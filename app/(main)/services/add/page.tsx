import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ServiceForm from "@/component/services/ServiceForm";
import { getServicesLockAction } from "@/app/actions/servicesLock";
import ServicesLock from "@/component/services/ServicesLock";
import { canManageServices } from "@/component/services/serviceUi";

const AddServicePage = async () => {
  const session = await auth();
  if (!canManageServices(session?.user?.role)) redirect("/services");
  const lock = await getServicesLockAction();
  if (!lock.unlocked) return <ServicesLock available={lock.available} />;

  return <ServiceForm />;
};

export default AddServicePage;
