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
    <div className={`dash-metric-trend trend-${trend}`}>
      <Icon size={12} strokeWidth={2.5} style={{ verticalAlign: "-1px" }} /> {value}{" "}
      {label ? <span>{label}</span> : null}
    </div>
  );
};

export default TrendIndicator;
