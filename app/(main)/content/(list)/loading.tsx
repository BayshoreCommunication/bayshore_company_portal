import { ContentListSkeleton } from "@/component/content/ContentSkeletons";

// Shown while the Content list renders on the server. It lives in the (list) group with
// the list's page.tsx so that add/, edit/ and [id] don't borrow this skeleton; the group
// doesn't change the URL, which is still /content.
const ContentLoading = () => <ContentListSkeleton />;

export default ContentLoading;
