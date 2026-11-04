import { listClientsAction } from "@/app/actions/clients";
import { listClientMessagesAction, listConversationsAction } from "@/app/actions/messages";
import Messages from "@/component/messages/Messages";

// The clients' conversations with the team. `?client=` opens one.
const MessagesPage = async ({ searchParams }: { searchParams: Promise<{ client?: string | string[] }> }) => {
  const { client } = await searchParams;
  const selected = typeof client === "string" && /^[0-9a-f]{24}$/i.test(client) ? client : null;
  const [conversations, clients, initial] = await Promise.all([
    listConversationsAction(),
    listClientsAction({ limit: 100 }),
    selected ? listClientMessagesAction(selected) : null,
  ]);

  return (
    <Messages
      conversations={conversations?.items ?? []}
      clients={(clients.data?.clients ?? []).map(({ _id, companyName, contactName }) => ({ _id, companyName, contactName }))}
      selected={selected}
      initial={initial}
    />
  );
};

export default MessagesPage;
