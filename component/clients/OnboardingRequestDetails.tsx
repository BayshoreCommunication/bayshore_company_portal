import Link from "next/link";
import { ArrowUpRight, Calendar, Mail, Pencil, Phone } from "lucide-react";
import type { OnboardingRequest } from "@/app/actions/onboarding";
import { breadcrumbLink, breadcrumbRow, breadcrumbs, btnDraft } from "@/component/shared/ui";
import { avatarColorFor, formatDate, initialsOf, statusClassName, statusLabel } from "./clientUi";
import OnboardingAnswerTabs, { Fields } from "./OnboardingAnswerTabs";
import { NONE, ONBOARDING_STATUS_COLORS, ONBOARDING_STATUS_LABELS, TONES, TONE_ORDER, countsOf, groupsOf } from "./onboardingRequestUi";

const iconText = "inline-flex items-center gap-1.25";
const pill = "inline-flex shrink-0 items-center whitespace-nowrap rounded-xl px-2.5 py-0.75 text-[11px] font-bold";

// An onboarding request in full: who sent it, how much they answered, and then a tab for
// each step of the form — where each thing stands for the team, and every field with what the
// client put in it. A field they left empty still shows, as "None".
// `canOpenClient` is for those who can open the client record it made (admins: the client has
// no account manager or team yet, so nobody else can see it there).
const OnboardingRequestDetails = ({ request, canOpenClient }: { request: OnboardingRequest; canOpenClient: boolean }) => {
  const { onboarding } = request;
  const groups = groupsOf(request);
  const counts = countsOf(groups);
  const takenOn = request.status !== "pending";

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/clients" className={breadcrumbLink}>
            Clients
          </Link>{" "}
          / Onboarding request / <b>{request.companyName}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[10px] border border-[#dbe3de] bg-white px-5.5 py-5">
        <div className="flex min-w-0 gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] text-[18px] font-bold text-white"
            style={{ background: avatarColorFor(request._id) }}
          >
            {initialsOf(request.companyName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="font-[Georgia,serif] text-[22px] font-bold text-[#0b1a26]">{request.companyName}</div>
              <span className={`${pill} ${ONBOARDING_STATUS_COLORS[onboarding.status]}`}>{ONBOARDING_STATUS_LABELS[onboarding.status]}</span>
            </div>
            <div className="mt-0.5 text-[13px] text-[#657787]">{request.contactName}</div>
            <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-[#556977]">
              <a href={`mailto:${request.email}`} className={`${iconText} text-inherit hover:text-[#2563eb]`}>
                <Mail size={13} strokeWidth={2} /> {request.email}
              </a>
              {request.phone ? (
                <span className={iconText}>
                  <Phone size={13} strokeWidth={2} /> {request.phone}
                </span>
              ) : null}
              <span className={iconText}>
                <Calendar size={13} strokeWidth={2} />
                {onboarding.status === "submitted" ? `Submitted ${formatDate(onboarding.submittedAt)}` : `Started ${formatDate(request.createdAt)} · last saved ${formatDate(request.updatedAt)}`}
              </span>
            </div>
          </div>
        </div>

        {canOpenClient ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/clients/${request._id}`} className={`${btnDraft} ${iconText}`}>
              Open client record <ArrowUpRight size={13} strokeWidth={2} />
            </Link>
            <Link href={`/clients/${request._id}/edit`} className={`${btnDraft} ${iconText}`}>
              <Pencil size={13} strokeWidth={2} /> Edit client
            </Link>
          </div>
        ) : null}
      </div>

      {takenOn ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#cfe9d6] bg-[#f0faf3] px-4 py-2.75 text-[12.5px] text-[#14532d]">
          This client has already been taken on <span className={statusClassName(request.status)}>{statusLabel(request.status)}</span> — their answers stay here to work from.
        </div>
      ) : onboarding.status === "in_progress" ? (
        <div className="rounded-lg border border-[#f1dfbf] bg-[#fdf6ea] px-4 py-2.75 text-[12.5px] text-[#7a4b0f]">
          They haven&apos;t handed this in yet — what you see is what they have saved so far, and it can still change.
        </div>
      ) : null}

      {/* The request at a glance: how much was answered, and what kind of work it adds up to. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] border border-[#dbe3de] bg-white px-5 py-3.5">
        <span className="text-[12.5px] text-[#657787]">
          <b className="text-[15px] font-bold text-[#0d1e2c]">{counts.answered}</b> of {counts.total} answered
        </span>
        {TONE_ORDER.map((tone) => (
          <span key={tone} className="inline-flex items-center gap-2 text-[12.5px] text-[#556977]">
            <span className="h-2 w-2 rounded-full" style={{ background: TONES[tone].dot }} />
            <b className="font-bold text-[#17242f]">{counts.byTone[tone]}</b> {TONES[tone].label.toLowerCase()}
          </span>
        ))}
      </div>

      <OnboardingAnswerTabs
        onboarding={onboarding}
        first={{
          title: "About them",
          content: (
            <Fields
              rows={[
                ["Name", request.contactName || NONE],
                ["Company", request.companyName || NONE],
                ["Email", request.email || NONE],
                ["Phone", request.phone || NONE],
              ]}
            />
          ),
        }}
      />
    </>
  );
};

export default OnboardingRequestDetails;
