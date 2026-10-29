import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ServiceForm from "@/component/services/ServiceForm";
import { getServicesLockAction } from "@/app/actions/servicesLock";
import ServicesLock from "@/component/services/ServicesLock";
import { SERVICES_NEED_CODE } from "@/lib/servicesPass";
import { canManageServices } from "@/component/services/serviceUi";

const AddServicePage = async () => {
  const session = await auth();
  if (!canManageServices(session?.user?.role)) redirect("/services");
  if (SERVICES_NEED_CODE) {
    const lock = await getServicesLockAction();
    if (!lock.unlocked) return <ServicesLock available={lock.available} />;
  }

  return <ServiceForm />;
};

export default AddServicePage;
