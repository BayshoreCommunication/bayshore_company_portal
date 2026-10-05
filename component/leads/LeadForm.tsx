"use client";

import { useEffect, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronDown, Eye, History, Loader2, Lock, Save, Trash2, UserRound } from "lucide-react";
import {
  createLeadAction,
  deleteLeadAction,
  listLeadsAction,
  updateLeadAction,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "@/app/actions/leads";
import { todayInputValue } from "@/component/clients/clientUi";
import {
  LEAD_CASE_TYPE_LIMIT,
  LEAD_CHANNELS as CHANNELS,
  LEAD_CHANNEL_KEYS,
  LEAD_NOTES_LIMIT,
  LEAD_SOURCES as SOURCES,
  LEAD_SOURCE_KEYS,
  LEAD_STATUSES as STATUSES,
  LEAD_STATUS_KEYS,
  avatarColorOf,
  clientNameOf,
  formatDate,
  formatDateTime,
  initialsOf,
  personNameOf,
} from "./leadUi";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const labelClass = "mb-1.5 block text-[12px] font-medium text-[#1f2530]";
const fieldClass =
  "h-10 w-full rounded-lg border border-[#e2e5e9] bg-white px-3 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9aa3af] focus:border-[#9aa3af] disabled:cursor-default disabled:bg-[#f9fafb] disabled:text-[#4b5260]";
const selectClass = `${fieldClass} cursor-pointer`;
const textareaClass = `${fieldClass} h-20 resize-y py-2.5`;
const hintClass = "mt-1 flex items-center gap-1 text-[11px] text-[#6b7280]";
const rowClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";
const star = <span className="text-[#dc2626]">*</span>;

type ClientOption = { _id: string; companyName: string };

const subscribeNever = () => () => {};

const pad = (value: number) => String(value).padStart(2, "0");
// Dates are shown and picked in the visitor's own timezone.
const toDateInput = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const toDateTimeInput = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  return `${toDateInput(iso)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
// A received day is sent as now when it's today (the backend refuses future times)
// and as midday otherwise, so the day doesn't shift for anyone within 12h of UTC.
const receivedIso = (value: string, today: string) =>
  value === today ? new Date().toISOString() : new Date(`${value}T12:00:00`).toISOString();

// Asks once in place before deleting; on success goes back to the list.
const DeleteLead = ({ lead }: { lead: Lead }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteLeadAction(lead._id);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete lead.");
        return;
      }
      toast.success(`${lead.fullName} was deleted`);
      router.push("/leads");
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#f0b8b8] bg-white px-4 text-[12.5px] font-medium text-[#b42318] hover:bg-[#fdecec]"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={14} strokeWidth={2} /> Delete
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#b42318]">
      Delete this lead for good?
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg bg-[#dc2626] px-4 text-[12.5px] font-medium text-white hover:bg-[#b91c1c] disabled:cursor-wait"
        disabled={isPending}
        aria-busy={isPending}
        onClick={handleDelete}
      >
        {isPending ? <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2} />}
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6]"
        disabled={isPending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </span>
  );
};

// How the lead will look in the list, filled in live as the form is typed.
const Preview = ({
  fullName,
  contact,
  clientName,
  caseType,
  source,
  received,
  status,
}: {
  fullName: string;
  contact: string;
  clientName?: string;
  caseType: string;
  source: LeadSource | "";
  received: string;
  status: LeadStatus;
}) => {
  const name = fullName.trim();
  const sourceMeta = source ? SOURCES[source] : undefined;
  const statusMeta = STATUSES[status];
  const rows: [string, React.ReactNode][] = [
    ["Client", clientName || "—"],
    ["Case type", caseType.trim() || "—"],
    [
      "Source",
      <span key="source" className="inline-flex items-center gap-1.5">
        {sourceMeta ? <span className="h-2 w-2 rounded-full" style={{ background: CHANNELS[sourceMeta.channel].color }} /> : null}
        {sourceMeta?.label ?? "—"}
      </span>,
    ],
    ["Received", received ? formatDate(`${received}T12:00:00`) : "—"],
    [
      "Status",
      <span
        key="status"
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
        style={{ background: statusMeta.background, color: statusMeta.color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta.dot }} />
        {statusMeta.label}
      </span>,
    ],
  ];

  return (
    <div className={`${cardClass} p-4.5`}>
      <div className="mb-3.5 flex items-center gap-2 text-[13px] font-semibold text-[#0b0c24]">
        <Eye size={15} strokeWidth={2} className="text-[#2f5fd8]" /> Preview
      </div>
      <div className="rounded-xl border border-[#eef0f2] bg-[#f9fafb] p-3.5">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: name ? avatarColorOf(name) : "#cbd2da" }}
          >
            {initialsOf(name) || <UserRound size={15} strokeWidth={2} />}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-medium text-[#1f2530]" title={name || undefined}>
              {name || "New lead"}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{contact || "No contact yet"}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 border-t border-[#eef0f2] pt-3 text-[11.5px]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-[#6b7280]">{label}</span>
              <span className="truncate font-medium text-[#1f2530]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Every status the lead has had, newest first — shown beside the form when editing.
const Timeline = ({ lead }: { lead: Lead }) => (
  <div className={`${cardClass} p-4.5`}>
    <div className="mb-3.5 flex items-center gap-2 text-[13px] font-semibold text-[#0b0c24]">
      <History size={15} strokeWidth={2} className="text-[#2f5fd8]" /> Timeline
    </div>
    <ol className="flex flex-col gap-3">
      {[...lead.statusHistory].reverse().map((change, index) => (
        <li key={`${change.at}-${index}`} className="flex gap-2.5">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: STATUSES[change.status]?.dot }} />
          <div className="min-w-0 text-[11.5px]">
            <div className="font-medium text-[#1f2530]">{STATUSES[change.status]?.label ?? change.status}</div>
            <div className="mt-0.5 text-[#6b7280]">
              {formatDateTime(change.at)}
              {personNameOf(change.by) ? ` · ${personNameOf(change.by)}` : ""}
            </div>
          </div>
        </li>
      ))}
    </ol>
    <div className="mt-3.5 border-t border-[#eef0f2] pt-3 text-[11px] text-[#6b7280]">
      Added {formatDateTime(lead.createdAt)}
      {personNameOf(lead.createdBy) ? ` by ${personNameOf(lead.createdBy)}` : ""}
    </div>
  </div>
);

// Pass `lead` to edit an existing one; leave it out to add a new one.
const LeadForm = ({ lead, clients, canDelete = false }: { lead?: Lead; clients: ClientOption[]; canDelete?: boolean }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(lead);

  const [client, setClient] = useState(lead ? "" : clients.length === 1 ? clients[0]._id : "");
  const [fullName, setFullName] = useState(lead?.fullName ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [caseType, setCaseType] = useState(lead?.caseType ?? "");
  const [source, setSource] = useState<LeadSource | "">(lead?.source ?? "");
  // A new lead was received today unless the user picks another day. "Today" depends
  // on the visitor's timezone, which the server can't know, so it is read in the
  // browser only (the server render leaves the field empty and the browser fills it in).
  const today = useSyncExternalStore(subscribeNever, todayInputValue, () => "");
  const initialReceived = useSyncExternalStore(subscribeNever, () => toDateInput(lead?.receivedAt), () => "");
  const [pickedReceived, setPickedReceived] = useState<string | null>(null);
  const received = pickedReceived ?? (lead ? initialReceived : today);
  const [status, setStatus] = useState<LeadStatus>(lead?.status ?? "new");
  const initialConsultation = useSyncExternalStore(subscribeNever, () => toDateTimeInput(lead?.consultationAt), () => "");
  const [pickedConsultation, setPickedConsultation] = useState<string | null>(null);
  const consultationAt = pickedConsultation ?? initialConsultation;
  const [lostReason, setLostReason] = useState(lead?.lostReason ?? "");
  const [notes, setNotes] = useState(lead?.notes ?? "");
  const [internalNotes, setInternalNotes] = useState(lead?.internalNotes ?? "");
  // A new lead starts as New with no internal note, so those wait behind "More options".
  // Editing is mostly about moving a lead along, so they're open there.
  const [showMore, setShowMore] = useState(isEdit);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // Case types are typed in per firm. Suggest the ones this client already uses, so
  // "Car Accident" isn't also saved as "car accident" or "Auto Accident".
  const clientId = lead ? (typeof lead.client === "object" ? lead.client._id : lead.client) : client;
  const [suggestions, setSuggestions] = useState<{ client: string; caseTypes: string[] }>({ client: "", caseTypes: [] });
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    listLeadsAction({ client: clientId, limit: 1 }).then((result) => {
      if (!cancelled && result.ok && result.data) setSuggestions({ client: clientId, caseTypes: result.data.caseTypes });
    });
    return () => {
      cancelled = true;
    };
  }, [clientId]);
  const caseTypeSuggestions = suggestions.client === clientId ? suggestions.caseTypes : [];

  // The same rules the backend applies, checked first so the message shows without a round trip.
  const problem = () => {
    if (!isEdit && !client) return "Choose which client this lead is for.";
    if (!fullName.trim()) return "Enter the lead's name.";
    if (!phone.trim() && !email.trim()) return "Add a phone number or an email address.";
    if (!caseType.trim()) return "Enter the case type.";
    if (!source) return "Choose where the lead came from.";
    if (status === "consultation_set" && !consultationAt) return "Pick the consultation date and time.";
    if (status === "lost" && !lostReason.trim()) return "Say why the lead was lost.";
    return null;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);

    const message = problem();
    if (message || !source) {
      setError(message);
      toast.error(message ?? "Fill in the required fields.");
      return;
    }

    // Empty optional fields are sent as null, which clears them on an edit.
    const fields = {
      fullName: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      caseType: caseType.trim(),
      source,
      status,
      ...(status === "consultation_set" ? { consultationAt: new Date(consultationAt).toISOString() } : {}),
      lostReason: status === "lost" ? lostReason.trim() : null,
      notes: notes.trim() || null,
      internalNotes: internalNotes.trim() || null,
    };

    startTransition(async () => {
      const result = lead
        ? await updateLeadAction(lead._id, {
            ...fields,
            // Re-sending an unchanged day would move the stored time to midday.
            ...(received !== initialReceived ? { receivedAt: receivedIso(received, today) } : {}),
          })
        : await createLeadAction({
            ...fields,
            client,
            phone: fields.phone ?? undefined,
            email: fields.email ?? undefined,
            receivedAt: receivedIso(received, today),
          });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors ?? []);
        toast.error(result.error ?? "Something went wrong.");
        return;
      }

      toast.success(lead ? "Lead updated successfully" : "Lead added successfully");
      router.push("/leads");
    });
  };

  const form = (
    <form onSubmit={handleSubmit} className={`${cardClass} p-5`} noValidate>
      <div className="flex flex-col gap-4">
        <div className={rowClass}>
          <div>
            <label className={labelClass} htmlFor="lead-client">
              Client {isEdit ? null : star}
            </label>
            {lead ? (
              <input id="lead-client" type="text" className={fieldClass} value={clientNameOf(lead.client) || "—"} disabled />
            ) : (
              <select id="lead-client" className={selectClass} value={client} onChange={(event) => setClient(event.target.value)}>
                <option value="" disabled>
                  {clients.length ? "Select a client" : "No clients available"}
                </option>
                {clients.map((option) => (
                  <option key={option._id} value={option._id}>
                    {option.companyName}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelClass} htmlFor="lead-name">
              Full Name {star}
            </label>
            <input
              id="lead-name"
              type="text"
              className={fieldClass}
              placeholder="e.g. Maria Alvarez"
              maxLength={120}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
        </div>

        <div>
          <div className={rowClass}>
            <div>
              <label className={labelClass} htmlFor="lead-phone">
                Phone
              </label>
              <input
                id="lead-phone"
                type="tel"
                className={fieldClass}
                placeholder="+1 987 654 3210"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="lead-email">
                Email
              </label>
              <input
                id="lead-email"
                type="email"
                className={fieldClass}
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>
          <div className={hintClass}>Add at least one — a phone number or an email.</div>
        </div>

        <div className={rowClass}>
          <div>
            <label className={labelClass} htmlFor="lead-case-type">
              Case Type {star}
            </label>
            <input
              id="lead-case-type"
              type="text"
              className={fieldClass}
              placeholder="e.g. Car Accident"
              maxLength={LEAD_CASE_TYPE_LIMIT}
              list={caseTypeSuggestions.length ? "lead-case-type-suggestions" : undefined}
              autoComplete="off"
              value={caseType}
              onChange={(event) => setCaseType(event.target.value)}
            />
            {caseTypeSuggestions.length ? (
              <datalist id="lead-case-type-suggestions">
                {caseTypeSuggestions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            ) : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="lead-source">
              Source {star}
            </label>
            <select id="lead-source" className={selectClass} value={source} onChange={(event) => setSource(event.target.value as LeadSource)}>
              <option value="" disabled>
                Select a source
              </option>
              {LEAD_CHANNEL_KEYS.map((channel) => (
                <optgroup key={channel} label={CHANNELS[channel].label}>
                  {LEAD_SOURCE_KEYS.filter((key) => SOURCES[key].channel === channel).map((key) => (
                    <option key={key} value={key}>
                      {SOURCES[key].label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className={rowClass}>
          <div>
            <label className={labelClass} htmlFor="lead-received">
              Received On {star}
            </label>
            <input
              id="lead-received"
              type="date"
              className={selectClass}
              max={today || undefined}
              value={received}
              onChange={(event) => setPickedReceived(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="lead-notes">
            Notes
          </label>
          <textarea
            id="lead-notes"
            className={textareaClass}
            placeholder="Anything the firm should know before calling back…"
            maxLength={LEAD_NOTES_LIMIT}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <div className={hintClass}>
            <Eye size={11} strokeWidth={2} /> The client can see these notes.
          </div>
        </div>

        {showMore ? (
          <div className="flex flex-col gap-4 border-t border-[#eef0f2] pt-4">
            <div className={rowClass}>
              <div>
                <label className={labelClass} htmlFor="lead-status">
                  Status
                </label>
                <select id="lead-status" className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as LeadStatus)}>
                  {LEAD_STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {STATUSES[key].label}
                    </option>
                  ))}
                </select>
              </div>
              {status === "consultation_set" ? (
                <div>
                  <label className={labelClass} htmlFor="lead-consultation">
                    Consultation {star}
                  </label>
                  <input
                    id="lead-consultation"
                    type="datetime-local"
                    className={selectClass}
                    value={consultationAt}
                    onChange={(event) => setPickedConsultation(event.target.value)}
                  />
                </div>
              ) : null}
              {status === "lost" ? (
                <div>
                  <label className={labelClass} htmlFor="lead-lost-reason">
                    Why Was It Lost? {star}
                  </label>
                  <input
                    id="lead-lost-reason"
                    type="text"
                    className={fieldClass}
                    placeholder="e.g. Couldn't reach them"
                    maxLength={300}
                    value={lostReason}
                    onChange={(event) => setLostReason(event.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <label className={labelClass} htmlFor="lead-internal-notes">
                Internal Notes
              </label>
              <textarea
                id="lead-internal-notes"
                className={`${textareaClass} bg-[#fffbeb]`}
                placeholder="Screening notes, follow-up reminders…"
                maxLength={LEAD_NOTES_LIMIT}
                value={internalNotes}
                onChange={(event) => setInternalNotes(event.target.value)}
              />
              <div className={hintClass}>
                <Lock size={11} strokeWidth={2} /> Team only — never shown to the client.
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="inline-flex w-fit cursor-pointer items-center gap-1 text-[12px] font-medium text-[#2f5fd8] hover:underline"
            onClick={() => setShowMore(true)}
          >
            More options <span className="font-normal text-[#6b7280]">— status, internal notes</span>
            <ChevronDown size={14} strokeWidth={2} />
          </button>
        )}

        {error ? (
          <div role="alert" className="rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b42318]">
            {error}
            {fieldErrors.length > 0 ? (
              <ul className="mt-1.5 list-disc pl-4.5 font-normal">
                {fieldErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-[#eef0f2] pt-4 sm:flex-row sm:items-center">
        {lead && canDelete ? <DeleteLead lead={lead} /> : null}
        <div className="flex flex-col-reverse gap-2.5 sm:ml-auto sm:flex-row">
          <Link
            href="/leads"
            className="flex h-9.5 items-center justify-center rounded-lg border border-[#e2e5e9] bg-white px-4.5 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] px-4.5 text-[12.5px] font-medium text-white hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-70"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Lead"}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">{isEdit ? "Edit Lead" : "Add Lead"}</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            {isEdit ? "Update the details or move the lead along." : "For a lead that came in by phone, referral or walk-in."}
          </div>
        </div>
        <Link
          href="/leads"
          className="flex h-9.5 items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
        >
          <ArrowLeft size={14} strokeWidth={2} /> Back to Leads
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {form}
        <div className="flex flex-col gap-4.5">
          <Preview
            fullName={fullName}
            contact={phone.trim() || email.trim()}
            clientName={lead ? clientNameOf(lead.client) : clients.find((option) => option._id === client)?.companyName}
            caseType={caseType}
            source={source}
            received={received}
            status={status}
          />
          {lead ? <Timeline lead={lead} /> : null}
        </div>
      </div>
    </div>
  );
};

export default LeadForm;
