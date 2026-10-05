import { LeadFormSkeleton } from "@/component/leads/LeadSkeletons";

// Without this, the form would borrow the list's skeleton from leads/loading.tsx.
const LeadFormLoading = () => <LeadFormSkeleton />;

export default LeadFormLoading;
