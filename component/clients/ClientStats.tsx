import { Users, UserCheck, Hourglass, UserX } from "lucide-react";
import type { ClientListData } from "@/app/actions/clients";

const ClientStats = ({ summary }: { summary: ClientListData["summary"] }) => {
  const share = summary.total ? Math.round((summary.active / summary.total) * 100) : 0;
  const stopped = summary.on_hold + summary.closed;

  const stats = [
    {
      icon: Users,
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      label: "TOTAL CLIENTS",
      value: summary.total,
      note: "Across all statuses",
    },
    {
      icon: UserCheck,
      iconBg: "#dcf3e2",
      iconColor: "#16a34a",
      label: "ACTIVE CLIENTS",
      value: summary.active,
      note: `${share}% of total`,
    },
    {
      icon: Hourglass,
      iconBg: "#fdf1de",
      iconColor: "#c8973a",
      label: "PENDING ONBOARDING",
      value: summary.pending,
      note: "Need action",
    },
    {
      icon: UserX,
      iconBg: "#fbdada",
      iconColor: "#dc2626",
      label: "ON HOLD / CLOSED",
      value: stopped,
      note: `${summary.on_hold} on hold · ${summary.closed} closed`,
    },
  ];

  return (
    <div className="client-stats-grid">
      {stats.map((stat) => (
        <div className="client-stat-card" key={stat.label}>
          <div className="client-stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
            <stat.icon size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="dash-metric-lbl">{stat.label}</div>
            <div className="dash-metric-val" style={{ fontSize: 24 }}>
              {stat.value}
            </div>
            <div className="dash-pending-sub">{stat.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientStats;
