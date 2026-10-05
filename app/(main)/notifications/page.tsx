import { redirect } from "next/navigation";
import { listNotificationsAction } from "@/app/actions/notifications";
import NotificationsList from "@/component/notifications/NotificationsList";
import { NOTIFICATIONS_PER_PAGE, isNotificationFilter, notificationsHref } from "@/component/notifications/notificationUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// /notifications, ?filter=unread, ?page=2
const NotificationsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const rawFilter = first(params.filter);
  const filter = isNotificationFilter(rawFilter) ? rawFilter : "all";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const result = await listNotificationsAction({ page, limit: NOTIFICATIONS_PER_PAGE, unread: filter === "unread" });

  // A stale or hand-edited ?page=99 lands on the last page that exists instead of an empty list.
  const totalPages = result.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(notificationsHref({ filter, page: totalPages }));

  return <NotificationsList data={result.ok ? result.data : undefined} error={result.error} filter={filter} />;
};

export default NotificationsPage;
