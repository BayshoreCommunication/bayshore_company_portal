"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MapPin, Mail, Phone, MessageSquare, Pencil, Plus, Calendar, Loader2, Trash2 } from "lucide-react";
import { deleteClientAction, type Client, type ClientLogin } from "@/app/actions/clients";
import {
  avatarColorFor,
  formatDate,
  formatDateTime,
  initialsOf,
  staffName,
  statusClassName,
  statusLabel,
} from "./clientUi";
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
              <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
            </div>
            <div className="mt-0.5 text-[13px] text-[#657787]">
              {client.contactName} · {client.serviceTypes.join(", ")}
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
                  <b>{client.contactName}</b>
                </div>
                <div>
                  <span>Company Name</span>
                  <b>{client.companyName}</b>
                </div>
                <div>
                  <span>Email</span>
                  <b>{client.email}</b>
                </div>
                <div>
                  <span>Phone</span>
                  <b>{client.phone || "—"}</b>
                </div>
                <div>
                  <span>Address</span>
                  <b>{client.address || "—"}</b>
                </div>
                <div>
                  <span>Service Types</span>
                  <b>{client.serviceTypes.join(", ")}</b>
                </div>
                <div>
                  <span>Start Date</span>
                  <b>{formatDate(client.startDate)}</b>
                </div>
                <div>
                  <span>Status</span>
                  <b>
                    <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
                  </b>
                </div>
                <div>
                  <span>Notes</span>
                  <b className="whitespace-pre-wrap font-medium!">
                    {client.notes || "—"}
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div className={dashSideCol}>
            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Portal Login</span>
              </div>
              {login ? (
                <div className={infoTable}>
                  <div>
                    <span>Sign-in email</span>
                    <b>{login.email}</b>
                  </div>
                  <div>
                    <span>Login status</span>
                    <b>{LOGIN_STATUS_LABEL[login.status]}</b>
                  </div>
                  <div>
                    <span>Last sign-in</span>
                    <b>{formatDateTime(login.lastLoginAt)}</b>
                  </div>
                </div>
              ) : (
                <div className={dashPendingSub}>This client has no portal login.</div>
              )}
            </div>

            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Team</span>
              </div>
              <div className={infoTable}>
                <div>
                  <span>Account Manager</span>
                  <b>{manager ?? "Unassigned"}</b>
                </div>
                <div>
                  <span>Assigned Staff</span>
                  <b>{team.length ? team.join(", ") : "—"}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientDetails;
