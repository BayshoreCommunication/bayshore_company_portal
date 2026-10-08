"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Calendar, Check, ChevronDown, Loader2, Mail, MapPin, MessageSquare, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { deleteClientAction, updateClientAction, type Client, type ClientLogin, type ClientStatus } from "@/app/actions/clients";
import {
  CLIENT_STATUS_OPTIONS,
  avatarColorFor,
  formatDate,
  formatDateTime,
  initialsOf,
  staffName,
  statusClassName,
  statusLabel,
} from "./clientUi";
import OnboardingAnswerTabs from "./OnboardingAnswerTabs";
import { ONBOARDING_STATUS_LABELS } from "./onboardingRequestUi";
import {
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDanger,
  btnDangerOutline,
  btnDraft,
  deleteConfirm,
  dashPendingSub,
  dashSideCol,
  sectionCard,
  sectionHeader,
  sectionTitle,
} from "@/component/shared/ui";

const iconText = "inline-flex items-center gap-1.25";

// "Add New Content" / "Add New Report" in the sidebar's dark navy.
const btnDark =
  "inline-flex cursor-pointer items-center gap-1.25 whitespace-nowrap rounded-md bg-[#0b1522] px-5 py-2.75 text-[13px] font-bold text-white no-underline shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a]";

// Label / value rows: a fixed label column, the value beside it.
const infoTable =
  "flex flex-col gap-3 [&>div]:grid [&>div]:grid-cols-[110px_1fr] [&>div]:gap-2.5 [&>div]:text-[12.5px] [&>div>span]:font-semibold [&>div>span]:text-[#7a8e9b] [&>div>b]:font-bold [&>div>b]:text-[#17242f]";

// What a field holds — or "None", greyed, when the record has nothing in it.
const Value = ({ children }: { children?: string | null }) =>
  children?.trim() ? <b className="whitespace-pre-wrap break-words">{children}</b> : <b className="font-medium! text-[#a3b1ba]!">None</b>;

const sinceLabel = "mb-0.5 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]";
const sinceValue = "flex items-center gap-1.5 text-[12.5px] font-bold text-[#17242f]";

// Delete, then "Delete {name} and its portal login?" to confirm.
const DeleteClientButton = ({ clientId, name }: { clientId: string; name: string }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete client.");
        return;
      }
      toast.success("Client deleted successfully");
      router.push("/clients");
    });
  };

  if (!confirming) {
    return (
      <button type="button" className={btnDangerOutline} onClick={() => setConfirming(true)}>
        <Trash2 size={13} strokeWidth={2} /> Delete
      </button>
    );
  }

  return (
    <span className={deleteConfirm}>
      <span>Delete {name} and its portal login?</span>
      <button type="button" className={btnDanger} disabled={isPending} aria-busy={isPending} onClick={handleDelete}>
        {isPending ? (
          <>
            <Loader2 size={13} strokeWidth={2.5} className="animate-spin" /> Deleting…
          </>
        ) : (
          "Yes, delete"
        )}
      </button>
      <button type="button" className={btnDraft} disabled={isPending} onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
};

// What each status means for the client, said under its name in the status menu. Pausing or
// closing a client also switches off its portal logins (the backend does that).
const STATUS_NOTES: Record<ClientStatus, { dot: string; note: string }> = {
  active: { dot: "#16a34a", note: "Working with us — portal login on" },
  pending: { dot: "#d97706", note: "Not started yet" },
  on_hold: { dot: "#3457c9", note: "Paused — portal login off" },
  closed: { dot: "#94a3b8", note: "No longer a client — portal login off" },
};

// The client's status as a pill that opens a menu: pick another status and it is saved there
// and then, without a trip to the edit page.
const StatusPicker = ({ clientId, name, status }: { clientId: string; name: string; status: ClientStatus }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // A click anywhere else, or Escape, closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: ClientStatus) => {
    setOpen(false);
    if (next === status) return;
    startTransition(async () => {
      const result = await updateClientAction(clientId, { status: next });
      if (!result.ok) {
        toast.error([result.error, ...(result.fieldErrors ?? [])].filter(Boolean).join(" — ") || "Couldn't change the status.");
        return;
      }
      toast.success(`${name} is now ${statusLabel(next)}`);
      router.refresh();
    });
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${statusLabel(status)}. Change status`}
        disabled={isPending}
        onClick={() => setOpen((shown) => !shown)}
        className={`${statusClassName(status)} cursor-pointer ring-1 ring-black/5 transition-shadow hover:shadow-[0_1px_4px_rgba(11,21,34,0.15)] disabled:cursor-wait`}
      >
        {isPending ? <Loader2 size={11} strokeWidth={2.5} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_NOTES[status].dot }} />}
        {statusLabel(status)}
        <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="listbox" aria-label="Change status" className="absolute top-full left-0 z-30 mt-1.5 w-64 rounded-[10px] border border-[#dbe3de] bg-white p-1.5 shadow-[0_12px_32px_rgba(11,21,34,0.16)]">
          <div className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3] uppercase">Change status</div>
          {CLIENT_STATUS_OPTIONS.map((option) => {
            const current = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={current}
                onClick={() => choose(option.value)}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-[#f4f7f5] ${current ? "bg-[#f7f9f8]" : ""}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_NOTES[option.value].dot }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold text-[#17242f]">{option.label}</span>
                  <span className="block text-[11px] text-[#7a8e9b]">{STATUS_NOTES[option.value].note}</span>
                </span>
                {current ? <Check size={14} strokeWidth={2.5} className="shrink-0 text-[#2563eb]" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const TABS = ["Overview", "Reports", "Content", "Meetings", "Messages", "Payments"];

const LOGIN_STATUS_LABEL: Record<ClientLogin["status"], string> = {
  pending: "Pending",
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
};

const ClientDetails = ({
  client,
  canManage,
  canDelete,
}: {
  client: Client;
  canManage: boolean;
  canDelete: boolean;
}) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const login = client.user && typeof client.user === "object" ? client.user : undefined;
  const manager = staffName(client.accountManager);
  const team = client.team.map((member) => staffName(member)).filter(Boolean) as string[];

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/clients" className={breadcrumbLink}>
            Clients
          </Link>{" "}
          / <b>{client.companyName}</b>
        </div>
      </div>

      <div className="flex items-start justify-between rounded-[10px] border border-[#dbe3de] bg-white px-5.5 py-5">
        <div className="flex gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[14px] text-[18px] font-bold text-white"
            style={{ background: avatarColorFor(client._id) }}
          >
            {initialsOf(client.companyName)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="font-[Georgia,serif] text-[22px] font-bold text-[#0b1a26]">{client.companyName}</div>
              {/* Those who manage clients change the status right here; everyone else just sees it. */}
              {canManage ? (
                <StatusPicker clientId={client._id} name={client.companyName} status={client.status} />
              ) : (
                <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
              )}
            </div>
            <div className="mt-0.5 text-[13px] text-[#657787]">
              {[client.contactName, client.serviceTypes.join(", ")].filter(Boolean).join(" · ")}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-[#556977]">
              {client.address ? (
                <span className={iconText}>
                  <MapPin size={12} strokeWidth={2} /> {client.address}
                </span>
              ) : null}
              <span className={iconText}>
                <Mail size={12} strokeWidth={2} /> {client.email}
              </span>
              {client.phone ? (
                <span className={iconText}>
                  <Phone size={12} strokeWidth={2} /> {client.phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <button className={`${btnDraft} ${iconText}`} type="button">
              <MessageSquare size={13} strokeWidth={2} /> Message
            </button>
            {canManage ? (
              <Link href={`/clients/${client._id}/edit`} className={`${btnDraft} ${iconText}`}>
                <Pencil size={13} strokeWidth={2} /> Edit Client
              </Link>
            ) : null}
            {/* Both open with this client already picked. */}
            <Link href={`/content/add?client=${client._id}`} className={btnDark}>
              <Plus size={13} strokeWidth={2.5} /> Add New Content
            </Link>
            <Link href={`/monthly-reports/add?client=${client._id}`} className={btnDark}>
              <Plus size={13} strokeWidth={2.5} /> Add New Report
            </Link>
            {canDelete ? <DeleteClientButton clientId={client._id} name={client.companyName} /> : null}
          </div>
          <div className="flex gap-5 rounded-lg border border-[#eef3ef] bg-[#f7f9f8] px-4 py-2.5">
            <div>
              <div className={sinceLabel}>Client Since</div>
              <div className={sinceValue}>
                <Calendar size={12} strokeWidth={2} /> {formatDate(client.startDate)}
              </div>
            </div>
            <div>
              <div className={sinceLabel}>Account Manager</div>
              <div className={sinceValue}>
                {manager ? (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1522] text-[9px] font-bold text-white">
                      {initialsOf(manager)}
                    </span>{" "}
                    {manager}
                  </>
                ) : (
                  "Unassigned"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-5.5 border-b border-[#dbe3de] px-1">
        {TABS.map((tab) => (
          <span
            key={tab}
            className={`cursor-pointer pb-2.5 text-[13px] font-semibold ${
              tab === activeTab ? "border-b-2 border-[#2563eb] text-[#2563eb]" : "text-[#7a8e9b]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      {activeTab !== "Overview" ? (
        <div className={sectionCard}>
          <div className="px-5 py-12 text-center text-[13px] text-[#657787]">
            <b>{activeTab}</b> for this client will appear here once that module is connected.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 items-start gap-5">
          <div className={dashSideCol}>
            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Client Information</span>
                {canManage ? (
                  <Link href={`/clients/${client._id}/edit`} className={`${btnDraft} ${iconText}`}>
                    <Pencil size={12} strokeWidth={2} /> Edit
                  </Link>
                ) : null}
              </div>
              <div className={infoTable}>
                <div>
                  <span>Client Name</span>
                  <Value>{client.contactName}</Value>
                </div>
                <div>
                  <span>Company Name</span>
                  <Value>{client.companyName}</Value>
                </div>
                <div>
                  <span>Email</span>
                  <Value>{client.email}</Value>
                </div>
                <div>
                  <span>Phone</span>
                  <Value>{client.phone}</Value>
                </div>
                <div>
                  <span>Address</span>
                  <Value>{client.address}</Value>
                </div>
                <div>
                  <span>Service Types</span>
                  <Value>{client.serviceTypes.join(", ")}</Value>
                </div>
                <div>
                  <span>Start Date</span>
                  <Value>{client.startDate ? formatDate(client.startDate) : undefined}</Value>
                </div>
                <div>
                  <span>Status</span>
                  <b>
                    {canManage ? (
                      <StatusPicker clientId={client._id} name={client.companyName} status={client.status} />
                    ) : (
                      <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
                    )}
                  </b>
                </div>
                <div>
                  <span>Notes</span>
                  <Value>{client.notes}</Value>
                </div>
                <div>
                  <span>Added On</span>
                  <Value>{client.createdAt ? formatDate(client.createdAt) : undefined}</Value>
                </div>
                <div>
                  <span>Last Updated</span>
                  <Value>{client.updatedAt ? formatDate(client.updatedAt) : undefined}</Value>
                </div>
              </div>
            </div>
          </div>

          <div className={dashSideCol}>
            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Portal Login</span>
              </div>
              {/* Without a login the fields are still listed, as "None". */}
              <div className={infoTable}>
                <div>
                  <span>Sign-in email</span>
                  <Value>{login?.email}</Value>
                </div>
                <div>
                  <span>Login status</span>
                  <Value>{login ? LOGIN_STATUS_LABEL[login.status] : undefined}</Value>
                </div>
                <div>
                  <span>Last sign-in</span>
                  <Value>{login ? formatDateTime(login.lastLoginAt) : undefined}</Value>
                </div>
              </div>
              {login ? null : <div className={`${dashPendingSub} mt-3`}>This client has no portal login.</div>}
            </div>

            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Team</span>
              </div>
              <div className={infoTable}>
                <div>
                  <span>Account Manager</span>
                  <Value>{manager}</Value>
                </div>
                <div>
                  <span>Assigned Staff</span>
                  <Value>{team.join(", ")}</Value>
                </div>
              </div>
            </div>

            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Onboarding</span>
              </div>
              <div className={infoTable}>
                <div>
                  <span>Form status</span>
                  <Value>{client.onboarding ? ONBOARDING_STATUS_LABELS[client.onboarding.status] : undefined}</Value>
                </div>
                <div>
                  <span>Submitted on</span>
                  <Value>{client.onboarding?.submittedAt ? formatDate(client.onboarding.submittedAt) : undefined}</Value>
                </div>
              </div>
              {client.onboarding ? null : <div className={`${dashPendingSub} mt-3`}>This client didn&apos;t go through the onboarding form.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Everything the onboarding form asks — a tab for each of its steps, every field filled in or not. */}
      {activeTab === "Overview" ? (
        <>
          <div className="mt-1 font-[Georgia,serif] text-[18px] font-bold text-[#0b1a26]">Onboarding answers</div>
          <OnboardingAnswerTabs onboarding={client.onboarding} />
        </>
      ) : null}
    </>
  );
};

export default ClientDetails;
