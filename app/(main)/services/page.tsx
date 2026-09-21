import ServicesHeader from "@/component/services/ServicesHeader";
import ServiceStats from "@/component/services/ServiceStats";
import ServiceCategoryCard from "@/component/services/ServiceCategoryCard";
import ServicesSidePanel from "@/component/services/ServicesSidePanel";
import { serviceCategories } from "@/component/services/data";

const ServicesPage = () => {
  return (
    <>
      <ServicesHeader />
      <ServiceStats />

      <div className="dash-main-grid" style={{ gridTemplateColumns: "2.2fr 1fr" }}>
        <div className="dash-side-col">
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
