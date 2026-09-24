import { sectionCard, sectionTitle } from "@/component/shared/ui";
import { reportStatus } from "./data";

const ReportStatusDonut = () => {
  return (
    <div className={sectionCard}>
      <div className={`${sectionTitle} mb-4`}>Report Status</div>
      <div className="flex items-center gap-6">
        <div className="flex h-30 w-30 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#16a34a_0deg_140.4deg,#2563eb_140.4deg_244.8deg,#c8973a_244.8deg_327.6deg,#dc2626_327.6deg_360deg)]">
          <div className="flex h-18.5 w-18.5 flex-col items-center justify-center rounded-full bg-white">
            <div className="text-[19px] font-bold text-[#0d1e2c]">{reportStatus.total}</div>
            <div className="text-[9.5px] font-semibold text-[#8496a3]">Total</div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 text-[12px] text-[#384955]">
          {reportStatus.legend.map((item) => (
            <div key={item.label}>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: item.color }} /> {item.label}{" "}
              <b className="ml-1 text-[#17242f]">{item.value}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportStatusDonut;
