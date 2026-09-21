import type { Client } from "@/app/actions/clients";
import ClientCard from "./ClientCard";
import ClientsEmptyState from "./ClientsEmptyState";

const ClientsGrid = ({
  clients,
  filtered,
  canManage,
}: {
  clients: Client[];
  filtered: boolean;
  canManage: boolean;
}) => {
  if (clients.length === 0) {
    return <ClientsEmptyState filtered={filtered} canManage={canManage} />;
  }

  return (
    <div className="client-cards-grid">
      {clients.map((client) => (
        <ClientCard client={client} key={client._id} />
      ))}
    </div>
  );
};

export default ClientsGrid;
