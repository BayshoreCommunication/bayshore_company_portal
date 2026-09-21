import { ArrowRight } from "lucide-react";

const ViewAllLink = ({ label = "View All" }: { label?: string }) => {
  return (
    <span className="dash-link" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {label} <ArrowRight size={13} strokeWidth={2.5} />
    </span>
  );
};

export default ViewAllLink;
