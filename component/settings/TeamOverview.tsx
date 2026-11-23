import type { TeamMember } from "@/app/actions/team";

// The task manager's "Team Overview" on the settings page: each member with this month's KPI score,
// laid out like the task manager's own dashboard. Read-only — a static snapshot from the server.

// The task manager's roles, shown the way its dashboard labels them.
const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  o_level: "O Level",
  manager: "Manager",
  assistant_manager: "Asst. Manager",
  executive: "Executive",
};

// Green from 80, blue from 50, amber below — the same thresholds as the task manager.
const colorOf = (score: number) => (score >= 80 ? "#16a34a" : score >= 50 ? "#4f8ef7" : "#d97706");

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "U";

const card = "rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)]";

const MemberCard = ({ member }: { member: TeamMember }) => {
  const color = colorOf(member.score);
  return (
    <div className="rounded-xl border border-[#e8edf3] bg-[#f8fafc] p-3.5">
      <div className="mb-3 flex items-center gap-2.5">
        {member.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2563eb] text-[12px] font-bold text-white">{initialsOf(member.name)}</div>
        )}
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold text-[#0f172a]">{member.name.split(" ")[0]}</div>
          <div className="text-[11px] text-[#94a3b8]">{ROLE_LABELS[member.role] ?? member.role}</div>
        </div>
      </div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12px] text-[#64748b]">Score</span>
        <span className="text-[13px] font-bold tabular-nums" style={{ color }}>
          {member.score}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eef2f7]">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.max(0, Math.min(100, member.score))}%`, background: color }} />
      </div>
    </div>
  );
};

const TeamOverview = ({ members, error }: { members?: TeamMember[]; error?: string }) => (
  <section className={`${card} px-5.5 py-5`}>
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-bold text-[#0f172a]">Team Overview</h2>
      {members?.length ? <span className="text-[12px] text-[#94a3b8]">{members.length} members · this month</span> : null}
    </div>
    {error ? (
      <div className="rounded-lg bg-[#fff7ed] px-3.5 py-3 text-[13px] text-[#b45309]">{error}</div>
    ) : !members?.length ? (
      <div className="rounded-lg bg-[#f8fafc] px-3.5 py-3 text-[13px] text-[#64748b]">No team members to show yet.</div>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    )}
  </section>
);

export default TeamOverview;
