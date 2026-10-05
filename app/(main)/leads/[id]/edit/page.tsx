import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLeadAction } from "@/app/actions/leads";
import LeadForm from "@/component/leads/LeadForm";
import { canDeleteLeads, canWriteLeads } from "@/component/leads/leadUi";

const EditLeadPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [session, result] = await Promise.all([auth(), getLeadAction(id)]);

  if (!canWriteLeads(session?.user?.role)) redirect("/leads");
  if (result.status === 404 || result.status === 422) notFound();

  if (!result.ok || !result.data) {
    return (
      <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
        {result.error ?? "Could not load this lead."} Please refresh the page to try again.
      </div>
    );
  }

  // The lead's own client is shown read-only, so no client list is needed here.
  return <LeadForm lead={result.data} clients={[]} canDelete={canDeleteLeads(session?.user?.role)} />;
};

export default EditLeadPage;
