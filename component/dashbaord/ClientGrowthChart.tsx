import { sectionCard, sectionTitle } from "@/component/shared/ui";
import { growthBars } from "./data";

const ClientGrowthChart = () => {
  return (
    <div className={sectionCard}>
      <div className={`${sectionTitle} mb-4`}>Client Growth</div>
      <div className="flex h-40 items-end gap-4 px-1.5">
        {growthBars.map((bar) => (
          <div
            className={`relative min-h-1.5 flex-1 rounded-t-[5px] ${bar.active ? "bg-[#2563eb]" : "bg-[#dbeafe]"}`}
            style={{ height: `${bar.height}%` }}
            key={bar.month}
          >
            {bar.tooltip ? (
              <span className="absolute -top-6.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-[#0d1e2e] px-2.25 py-0.75 text-[10.5px] font-bold text-white">
                {bar.tooltip}
              </span>
            ) : null}
            <span
              className={`absolute inset-x-0 -bottom-5 text-center text-[11px] ${
                bar.active ? "font-bold text-[#17242f]" : "font-medium text-[#8496a3]"
              }`}
            >
              {bar.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientGrowthChart;
