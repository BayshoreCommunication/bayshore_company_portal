import { redirect } from "next/navigation";

// The root has no page of its own: proxy.ts sends a signed-in visitor to the dashboard and
// anyone else to sign in. Should a request reach here anyway, it goes to the dashboard.
const RootPage = () => redirect("/dashboard");

export default RootPage;
