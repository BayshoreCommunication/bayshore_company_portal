import Link from "next/link";
import { Users, SearchX, Plus, RotateCcw } from "lucide-react";

// Shown when there is nothing to list: either no clients exist yet, or the
// current search / status filter matches none of them.
const ClientsEmptyState = ({ filtered, canManage }: { filtered: boolean; canManage: boolean }) => {
  const Icon = filtered ? SearchX : Users;

  return (
    <div className="clients-empty-state">
      <div className="clients-empty-icon">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <div className="empty-title">{filtered ? "No clients match your search" : "No clients yet"}</div>
      <div className="empty-desc">
        {filtered
          ? "Try a different name or email, or switch to another status tab."
          : canManage
            ? "Add your first client to start managing their reports, content and meetings in one place."
            : "Clients assigned to you will show up here."}
      </div>
      {filtered ? (
        <Link href="/clients" className="btn-draft clients-empty-action">
          <RotateCcw size={13} strokeWidth={2} /> Clear filters
        </Link>
      ) : canManage ? (
        <Link href="/clients/add" className="btn-add-client clients-empty-action">
          <Plus size={14} strokeWidth={2.5} /> Add Client
        </Link>
      ) : null}
    </div>
  );
};

export default ClientsEmptyState;
