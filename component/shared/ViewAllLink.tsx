import { ArrowRight } from "lucide-react";
import { dashLink } from "./ui";

const ViewAllLink = ({ label = "View All" }: { label?: string }) => {
  return (
    <span className={`${dashLink} inline-flex items-center gap-1`}>
      {label} <ArrowRight size={13} strokeWidth={2.5} />
    </span>
  );
};

export default ViewAllLink;
