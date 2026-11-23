import { listMeetingsAction } from "@/app/actions/meetings";
import MeetingsList from "@/component/meetings/MeetingsList";

// The team's meetings. A super user (admin) sees all; everyone else sees only the ones they're on.
const MeetingsPage = async () => {
  const result = await listMeetingsAction();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0f172a]">Meetings</h1>
        <p className="mt-0.5 text-[13px] text-[#64748b]">Meetings clients have booked with you.</p>
      </div>
      <MeetingsList meetings={result.ok ? result.data.meetings : undefined} error={result.ok ? undefined : result.error} />
    </div>
  );
};

export default MeetingsPage;
