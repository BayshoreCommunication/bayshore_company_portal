"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CircleDollarSign, Inbox, Layers, ListChecks, Receipt, type LucideIcon } from "lucide-react";
import type { ServiceListData } from "@/app/actions/service";
import type { Client } from "@/app/actions/clients";
import ClientServicePlans, { servicePlansOf } from "@/component/clients/ClientServicePlans";
import { avatarColorFor, initialsOf, money } from "@/component/clients/clientUi";
import Picker from "@/component/shared/Picker";
import { dollars } from "./serviceUi";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";


type ClientOption = { _id: string; companyName: string; contactName?: string };

// ── Small pieces ─────────────────────────────────────────────────────────────

const SummaryTile = ({
  icon: Icon,
  label,
  sub,
  value,
  color,
  background,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: string;
  color: string;
  background: string;
}) => (
  <div className={`${cardClass} px-4 pt-3.5 pb-4`}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background, color }}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-[#0b0c24] uppercase">{label}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6b7280]" title={sub}>
          {sub}
        </div>
      </div>
    </div>
    <div className="mt-3 text-[30px] leading-none font-semibold text-[#0b0c24]">{value}</div>
  </div>
);

// ── The Services page ────────────────────────────────────────────────────────

// The Services page: a client is picked, and their services on their form show under it
// (ClientServicePlans). Without one (`clientId` "all"), the catalog's totals and a prompt to
// pick a client. `catalog` is missing when it couldn't be loaded. `canEditClient` shows the way to the
// client form; `startEditing` opens it (?edit=1, from that part of the client form).
const ServicesList = ({
  catalog,
  clients,
  clientId,
  client,
  canEditClient = false,
  startEditing = false,
  fromClient = false,
}: {
  catalog?: ServiceListData;
  clients: ClientOption[];
  clientId: string;
  client?: Client;
  canEditClient?: boolean;
  startEditing?: boolean;
  fromClient?: boolean;
}) => {
  const router = useRouter();
  const [, startNavigation] = useTransition();


  const clientView = clientId !== "all";
  const clientName = clients.find((option) => option._id === clientId)?.companyName ?? "This client";
  // The services on the picked client's form, for the totals.
  const plans = clientView && client ? servicePlansOf(client) : undefined;

  // Back to the page before: the client's page or the client form, which opened this one
  // (?from=client) — or, with nothing before it, the client's page.
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(clientView ? `/clients/${clientId}` : "/clients");
  };

  const chooseClient = (id: string) => {
    // Another client keeps the way back to the page this was opened from.
    startNavigation(() => router.replace(id === "all" ? "/services" : `/services?client=${id}${fromClient ? "&from=client" : ""}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Services</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            {clientView ? (
              <>
                The services <span className="font-medium text-[#0b0c24]">{clientName}</span> takes, and what they pay each month.
              </>
            ) : (
              "Pick a client to see their services and what they pay."
            )}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          {fromClient ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-9.5 cursor-pointer items-center gap-1.5 px-1.5 text-[13px] font-semibold text-[#475569] transition-colors hover:text-[#2563eb]"
            >
              <ArrowLeft size={15} strokeWidth={2} /> Back
            </button>
          ) : null}
          {/* Whose services: their totals and the services on their form show under it. */}
          <div className="w-full sm:w-72">
            <Picker
              id="services-client"
              value={clientId}
              // Only clients: the catalog's list of services isn't shown on this page.
              options={clients.map((option) => ({
                value: option._id,
                label: option.companyName,
                sub: option.contactName ? `Contact: ${option.contactName}` : undefined,
                initials: initialsOf(option.companyName),
                color: avatarColorFor(option._id),
              }))}
              onChange={chooseClient}
              placeholder="Select a client"
              placeholderIcon={Building2}
              searchable
              searchPlaceholder="Search clients…"
            />
          </div>
        </div>
      </div>

      {/* A client's totals come from the services on their form, as the card under them;
          without a client, the catalog's. */}
      {clientView ? (
        plans ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              icon={Layers}
              label="Active Services"
              sub="Running for this client"
              value={String(plans.services.length + plans.unpriced.length)}
              color="#2f5fd8"
              background="#d9e0ef"
            />
            <SummaryTile icon={CircleDollarSign} label="Monthly Payment" sub="Monthly total of their services" value={money(plans.monthly)} color="#16a34a" background="#d2e7d8" />
            <SummaryTile icon={Receipt} label="One-time Fees" sub="Custom services and logo design" value={money(plans.oneTime)} color="#d97706" background="#f8e4c6" />
            <SummaryTile icon={Inbox} label="Client Requests" sub="Asked for, not added yet" value={String(plans.openRequests.length)} color="#7c3aed" background="#ece4fb" />
          </div>
        ) : null
      ) : catalog ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile icon={Layers} label="Services" sub="In the catalog" value={String(catalog.summary.services)} color="#2f5fd8" background="#d9e0ef" />
          <SummaryTile icon={ListChecks} label="Sub-services" sub="Across all services" value={String(catalog.summary.subServices)} color="#d97706" background="#f8e4c6" />
          <SummaryTile icon={Building2} label="Clients Served" sub="With at least one service" value={String(catalog.summary.clientsServed)} color="#7c3aed" background="#ece4fb" />
          <SummaryTile icon={CircleDollarSign} label="Monthly Payments" sub="All your clients together" value={dollars(catalog.summary.monthlyTotal)} color="#16a34a" background="#d2e7d8" />
        </div>
      ) : null}

      {clientView ? null : (
        <div className={`${cardClass} px-6 py-12 text-center`}>
          <div className="text-[15px] font-semibold text-[#0b0c24]">Pick a client</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">Their services, prices and what they asked for show here.</div>
        </div>
      )}

      {clientView && client ? <ClientServicePlans key={client._id} client={client} canEdit={canEditClient} startEditing={startEditing} /> : null}
    </div>
  );
};

export default ServicesList;
