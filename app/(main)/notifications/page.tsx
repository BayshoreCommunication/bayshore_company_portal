import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listNotificationsAction } from "@/app/actions/notifications";
import { canManageClients } from "@/component/clients/clientUi";
import NotificationsList from "@/component/notifications/NotificationsList";
import { NOTIFICATIONS_PER_PAGE, isNotificationFilter, notificationsHref } from "@/component/notifications/notificationUi";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// For those who manage clients: the way to choose which messages each client is sent.
const ManageButton = () => (
  <Link
    href="/notifications/manage"
    className="flex h-9.5 items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
  >
    <SlidersHorizontal size={14} strokeWidth={2} /> Notification management
  </Link>
);

// /notifications, ?filter=unread, ?page=2
const NotificationsPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const session = await auth();
  const canManage = canManageClients(session?.user?.role);

  const rawFilter = first(params.filter);
  const filter = isNotificationFilter(rawFilter) ? rawFilter : "all";
  const page = Math.max(1, Number(first(params.page)) || 1);

  const result = await listNotificationsAction({ page, limit: NOTIFICATIONS_PER_PAGE, unread: filter === "unread" });

  // A stale or hand-edited ?page=99 lands on the last page that exists instead of an empty list.
  const totalPages = result.data?.pagination.totalPages ?? 0;
  if (totalPages > 0 && page > totalPages) redirect(notificationsHref({ filter, page: totalPages }));

  return <NotificationsList data={result.ok ? result.data : undefined} error={result.error} filter={filter} actions={canManage ? <ManageButton /> : undefined} />;
};

export default NotificationsPage;
