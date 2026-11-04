import { getGoogleAccountsAction } from "@/app/actions/calendar";
import CalendarView from "@/component/calendar/CalendarView";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// /calendar — the meetings on the team's connected Google Calendars. ?google=<outcome> is how
// connecting an account went (backend: /calendar/google/callback sends the browser back here).
const CalendarPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { google: outcome } = await searchParams;
  const result = await getGoogleAccountsAction();
  return <CalendarView google={result.ok ? result.data : null} outcome={typeof outcome === "string" ? outcome : undefined} />;
};

export default CalendarPage;
