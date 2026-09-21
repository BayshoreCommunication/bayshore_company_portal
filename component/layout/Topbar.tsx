import { Search, Bell, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { roleLabel as labelForRole } from "@/component/shared/roleLabels";

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

type TopbarUser = {
  name?: string | null;
  role: string;
};

const Topbar = ({ user }: { user: TopbarUser }) => {
  const name = user.name ?? "Account";
  const roleLabel = labelForRole(user.role);

  return (
    <div className="top-bar">
      <div className="search-wrapper">
        <Search size={14} strokeWidth={2} className="search-icon-pos" />
        <input
          type="text"
          className="top-search-input"
          placeholder="Search clients, reports, meetings..."
        />
      </div>
      <div className="top-right">
        <div className="bell-btn">
          <Bell size={16} strokeWidth={2} />
          <span className="bell-dot">1</span>
        </div>
        <div className="user-pill">
          <div className="avatar">{initialsFromName(name)}</div>
          <div>
            <div className="user-name">{name}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            title="Sign out"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "white",
              border: "1px solid #dbe3de",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#556877",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Topbar;
