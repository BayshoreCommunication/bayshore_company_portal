import { LeadsListSkeleton } from "@/component/leads/LeadSkeletons";

// Shown while the Leads list renders on the server. Changing a filter doesn't show
// this — the list dims in place instead, so the filters stay where they are.
const LeadsLoading = () => <LeadsListSkeleton />;

export default LeadsLoading;
