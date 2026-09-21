"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Mail, Phone, MessageSquare, Pencil, Plus, Calendar } from "lucide-react";
import type { Client, ClientLogin } from "@/app/actions/clients";
import DeleteClientButton from "./DeleteClientButton";
import {
  avatarColorFor,
  formatDate,
  formatDateTime,
  initialsOf,
  staffName,
  statusClassName,
  statusLabel,
  statusStyle,
} from "./clientUi";

const iconTextStyle = { display: "inline-flex", alignItems: "center", gap: 5 } as const;

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
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/clients" className="breadcrumb-link">
            Clients
          </Link>{" "}
          / <b>{client.companyName}</b>
        </div>
      </div>

      <div className="client-detail-header">
        <div className="client-detail-left">
          <div
            className="client-avatar"
            style={{ background: avatarColorFor(client._id), width: 64, height: 64, fontSize: 18, borderRadius: 14 }}
          >
            {initialsOf(client.companyName)}
          </div>
          <div>
            <div className="client-detail-name-row">
              <div className="page-title" style={{ fontSize: 22 }}>
                {client.companyName}
              </div>
              <span className={statusClassName(client.status)} style={statusStyle(client.status)}>
                {statusLabel(client.status)}
              </span>
            </div>
            <div className="page-desc" style={{ marginTop: 2 }}>
              {client.contactName} · {client.serviceTypes.join(", ")}
            </div>
            <div className="client-contact-icons">
              {client.address ? (
                <span style={iconTextStyle}>
                  <MapPin size={12} strokeWidth={2} /> {client.address}
                </span>
              ) : null}
              <span style={iconTextStyle}>
                <Mail size={12} strokeWidth={2} /> {client.email}
              </span>
              {client.phone ? (
                <span style={iconTextStyle}>
                  <Phone size={12} strokeWidth={2} /> {client.phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="client-detail-right">
          <div className="client-header-actions">
            <button className="btn-draft" type="button" style={iconTextStyle}>
              <MessageSquare size={13} strokeWidth={2} /> Message
            </button>
            {canManage ? (
              <Link href={`/clients/${client._id}/edit`} className="btn-draft" style={iconTextStyle}>
                <Pencil size={13} strokeWidth={2} /> Edit Client
              </Link>
            ) : null}
            <button className="btn-add-client" type="button" style={iconTextStyle}>
              <Plus size={13} strokeWidth={2.5} /> Add New Content
            </button>
            <button className="btn-add-client" type="button" style={iconTextStyle}>
              <Plus size={13} strokeWidth={2.5} /> Add New Report
            </button>
            {canDelete ? <DeleteClientButton clientId={client._id} name={client.companyName} /> : null}
          </div>
          <div className="client-since-card">
            <div>
              <div className="dash-metric-lbl" style={{ marginBottom: 2 }}>
                Client Since
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#17242f", display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={12} strokeWidth={2} /> {formatDate(client.startDate)}
              </div>
            </div>
            <div>
              <div className="dash-metric-lbl" style={{ marginBottom: 2 }}>
                Account Manager
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#17242f", display: "flex", alignItems: "center", gap: 6 }}>
                {manager ? (
                  <>
                    <span className="avatar" style={{ width: 20, height: 20, fontSize: 9, background: "#0b1522" }}>
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

      <div className="detail-tabs-row">
        {TABS.map((tab) => (
          <span
            key={tab}
            className={`detail-tab${tab === activeTab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      {activeTab !== "Overview" ? (
        <div className="section-card">
          <div className="detail-coming-soon">
            <b>{activeTab}</b> for this client will appear here once that module is connected.
          </div>
        </div>
      ) : (
        <div className="dash-main-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="dash-side-col">
            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Client Information</span>
                {canManage ? (
                  <Link href={`/clients/${client._id}/edit`} className="btn-draft" style={iconTextStyle}>
                    <Pencil size={12} strokeWidth={2} /> Edit
                  </Link>
                ) : null}
              </div>
              <div className="client-info-table">
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
                    <span className={statusClassName(client.status)} style={statusStyle(client.status)}>
                      {statusLabel(client.status)}
                    </span>
                  </b>
                </div>
                <div>
                  <span>Notes</span>
                  <b className="client-detail-note" style={{ fontWeight: 500 }}>
                    {client.notes || "—"}
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-side-col">
            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Portal Login</span>
              </div>
              {login ? (
                <div className="client-info-table">
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
                <div className="dash-pending-sub">This client has no portal login.</div>
              )}
            </div>

            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Team</span>
              </div>
              <div className="client-info-table">
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
