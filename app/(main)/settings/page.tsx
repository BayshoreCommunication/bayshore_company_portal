import { getTeamOverviewAction } from "@/app/actions/team";
import TeamOverview from "@/component/settings/TeamOverview";

// The team overview — each member with this month's KPI score. Profile lives on /profile now.
const SettingsPage = async () => {
  const team = await getTeamOverviewAction();
  return (
    <div className="flex flex-col gap-5">
      <TeamOverview members={team.ok ? team.members : undefined} error={team.ok ? undefined : team.error} />
    </div>
  );
};

export default SettingsPage;
