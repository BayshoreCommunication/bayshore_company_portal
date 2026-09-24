import { TrendingUp, TrendingDown } from "lucide-react";

const TrendIndicator = ({
  trend,
  value,
  label,
}: {
  trend: "up" | "down";
  value: string;
  label?: string;
}) => {
  const Icon = trend === "up" ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-1.25 text-[12px] font-bold ${trend === "up" ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
      <Icon size={12} strokeWidth={2.5} className="align-[-1px]" /> {value}{" "}
      {label ? <span className="font-medium text-[#8496a3]">{label}</span> : null}
    </div>
  );
};

export default TrendIndicator;
