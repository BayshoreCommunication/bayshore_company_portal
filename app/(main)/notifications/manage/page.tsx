import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { getClientAction, listClientsAction } from "@/app/actions/clients";
import { canManageClients } from "@/component/clients/clientUi";
import ClientMessages from "@/component/notifications/ClientMessages";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// The backend's page-size cap — the client picker offers this many clients.
const CLIENT_OPTIONS_LIMIT = 100;

// /notifications/manage?client=<id> — which emails and portal notifications each client is sent.
// Every client gets every one until it is switched off here. For those who manage clients.
const NotificationManagementPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const session = await auth();
  if (!canManageClients(session?.user?.role)) redirect("/notifications");

  const clientId = first((await searchParams).client);
  const [clients, client] = await Promise.all([listClientsAction({ limit: CLIENT_OPTIONS_LIMIT }), clientId ? getClientAction(clientId) : null]);

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Notification management</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">Choose which emails and portal notifications each client gets. Every client gets all of them until you turn some off.</div>
        </div>
        <Link
          href="/notifications"
          className="inline-flex h-9.5 items-center gap-1.5 px-1.5 text-[13px] font-semibold text-[#475569] no-underline transition-colors hover:text-[#2563eb]"
        >
          <ArrowLeft size={15} strokeWidth={2} /> Back to notifications
        </Link>
      </div>
      <ClientMessages
        key={clientId ?? "none"}
        clients={(clients.data?.clients ?? []).map(({ _id, companyName, contactName }) => ({ _id, companyName, contactName }))}
        client={client?.ok ? client.data : undefined}
      />
    </div>
  );
};

export default NotificationManagementPage;
