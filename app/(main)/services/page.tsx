import ServicesHeader from "@/component/services/ServicesHeader";
import ServiceStats from "@/component/services/ServiceStats";
import ServiceCategoryCard from "@/component/services/ServiceCategoryCard";
import ServicesSidePanel from "@/component/services/ServicesSidePanel";
import { serviceCategories } from "@/component/services/data";
import { dashSideCol } from "@/component/shared/ui";

const ServicesPage = () => {
  return (
    <>
      <ServicesHeader />
      <ServiceStats />

      <div className="grid grid-cols-[2.2fr_1fr] items-start gap-5">
        <div className={dashSideCol}>
          {serviceCategories.map((category) => (
            <ServiceCategoryCard category={category} key={category.key} />
          ))}
        </div>
        <ServicesSidePanel />
      </div>
    </>
  );
};

export default ServicesPage;
