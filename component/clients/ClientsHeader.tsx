import Link from "next/link";
import { Plus } from "lucide-react";

const ClientsHeader = ({ canManage }: { canManage: boolean }) => {
  return (
    <div className="headline-row">
      <div>
        <div className="page-title">Clients</div>
        <div className="page-desc">
          Manage all your clients, track their activity and access their reports, meetings and more.
        </div>
      </div>
      {canManage ? (
        <Link
          href="/clients/add"
          className="btn-add-client"
          style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <Plus size={14} strokeWidth={2.5} /> Add Client
        </Link>
      ) : null}
    </div>
  );
};

export default ClientsHeader;
