import type { ReactNode } from "react";
import { User } from "lucide-react";
import { roleAlertBanner } from "./ui";

const RoleAlertBanner = ({ message, action }: { message: ReactNode; action?: ReactNode }) => {
  return (
    <div className={roleAlertBanner}>
      <div className="flex items-center gap-1.5">
        <User size={14} strokeWidth={2} /> <span>{message}</span>
      </div>
      {action}
    </div>
  );
};

export default RoleAlertBanner;
