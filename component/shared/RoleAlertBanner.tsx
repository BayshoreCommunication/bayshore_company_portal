import type { ReactNode } from "react";
import { User } from "lucide-react";

const RoleAlertBanner = ({ message, action }: { message: ReactNode; action?: ReactNode }) => {
  return (
    <div className="role-alert-banner">
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <User size={14} strokeWidth={2} /> <span>{message}</span>
      </div>
      {action}
    </div>
  );
};

export default RoleAlertBanner;
