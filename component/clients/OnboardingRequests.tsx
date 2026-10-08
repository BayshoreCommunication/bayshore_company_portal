import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import type { OnboardingRequestList } from "@/app/actions/onboarding";
import { avatarColorFor, formatDate, initialsOf } from "./clientUi";
import { ONBOARDING_STATUS_COLORS, ONBOARDING_STATUS_LABELS } from "./onboardingRequestUi";

const pill = "inline-flex shrink-0 items-center whitespace-nowrap rounded-xl px-2.5 py-0.75 text-[11px] font-bold";

// At the top of the Clients page: the people who filled in the onboarding form and haven't
// been taken on yet — those who handed it in first. Each row opens the request in full.
// Nothing is shown when nobody is waiting.
const OnboardingRequests = ({ data }: { data: OnboardingRequestList }) => {
  const { requests, summary, pagination } = data;
  if (summary.total === 0) return null;

  return (
    <section aria-label="Onboarding requests" className="overflow-hidden rounded-[10px] border border-[#cfe0fb] bg-[#f5f9ff]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#2563eb] text-white">
            <ClipboardList size={19} strokeWidth={2} />
          </span>
          <div>
            <div className="text-[15px] font-bold text-[#0d1e2c]">Onboarding requests</div>
            <div className="text-[12px] text-[#657787]">New clients who filled in the onboarding form and are waiting to be taken on.</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`${pill} ${ONBOARDING_STATUS_COLORS.submitted}`}>{summary.submitted} submitted</span>
          {summary.in_progress ? <span className={`${pill} ${ONBOARDING_STATUS_COLORS.in_progress}`}>{summary.in_progress} still filling in</span> : null}
        </div>
      </div>

      <ul className="flex flex-col border-t border-[#dbe7fb] bg-white">
        {requests.map((request) => {
          const { status, submittedAt } = request.onboarding;
          return (
            <li key={request._id} className="border-b border-[#eef3ef] last:border-b-0">
              <Link href={`/clients/onboarding/${request._id}`} className="group flex items-center gap-3.5 px-5 py-3 text-inherit no-underline hover:bg-[#f7faff]">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: avatarColorFor(request._id) }}
                >
                  {initialsOf(request.companyName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold text-[#0d1e2c] group-hover:text-[#2563eb]">{request.companyName}</span>
                  <span className="block truncate text-[11.5px] text-[#7a8e9b]">
                    {request.contactName} · {request.email}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[11.5px] text-[#7a8e9b] max-[900px]:hidden">
                  {status === "submitted" ? `Submitted ${formatDate(submittedAt)}` : `Last saved ${formatDate(request.updatedAt)}`}
                </span>
                <span className={`${pill} ${ONBOARDING_STATUS_COLORS[status]}`}>{ONBOARDING_STATUS_LABELS[status]}</span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] font-bold text-[#2563eb]">
                  View details <ArrowRight size={13} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {pagination.total > requests.length ? (
        <div className="border-t border-[#dbe7fb] px-5 py-2.5 text-[11.5px] text-[#657787]">
          Showing the first {requests.length} of {pagination.total} requests.
        </div>
      ) : null}
    </section>
  );
};

export default OnboardingRequests;
