"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DollarSign, FolderKanban, Pencil } from "lucide-react";
import type { Client } from "@/app/actions/clients";
import { ClientForm } from "./ClientAdd";
import { SERVICES, formatDate, money, sharedOf } from "./clientUi";
import { btnDraft, dashPendingSub } from "@/component/shared/ui";

const listed = (values?: string[]) => (values?.length ? values.join(", ") : undefined);
// A date the form saved as yyyy-mm-dd.
const day = (value?: string) => (value ? formatDate(value) : undefined);

// A quantity or a price, as its field on the form holds it.
const fieldValue = (service: string, label: string, value: number) =>
  SERVICES.find((entry) => entry.name === service)?.fields.find((field) => field.label === label)?.money ? money(value) : String(value);

// The project a custom service goes with: where it stands.
const PROJECT_LOOK = {
  new: { label: "Project: New", style: { background: "#e3e7fb", color: "#4f46e5" } },
  in_progress: { label: "Project: In progress", style: { background: "#f8e4c6", color: "#b45309" } },
  completed: { label: "Project: Completed", style: { background: "#d2e7d8", color: "#15803d" } },
} as const;

// A custom service is paid once (one saved as monthly before counts as once too).
const onceOf = (plan: { custom?: boolean; oneTime?: number; monthly: number }) => (plan.custom ? plan.oneTime || plan.monthly : 0);

// The services recorded on the client form, worked out once — for the card below and the
// totals over it on the Services page.
export const servicePlansOf = (client: Client) => {
  const recorded = client.details?.services ?? [];
  // Running now; the finished ones are their history, shown apart and not counted.
  const services = recorded.filter((plan) => plan.status !== "done");
  const finished = recorded.filter((plan) => plan.status === "done").sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
  const monthly = services.reduce((sum, plan) => sum + (plan.custom ? 0 : plan.monthly), 0);
  const logoDesign = client.details?.business?.logoDesign;
  // Paid once: a logo designed for them, and the team's own services priced once.
  const oneTime = (sharedOf(client).hasLogo === false && logoDesign?.add ? (logoDesign.price ?? 0) : 0) + services.reduce((sum, plan) => sum + onceOf(plan), 0);
  // What the client asked for and doesn't have yet (a service of the same name answers it).
  const taken = new Set([...recorded.map((plan) => plan.name.trim().toLowerCase()), ...client.serviceTypes.map((name) => name.trim().toLowerCase())]);
  const openRequests = (client.serviceRequests ?? []).filter((request) => request.status === "open" && !taken.has(request.name.trim().toLowerCase()));
  // Services on the client that were never priced on the form.
  const unpriced = client.serviceTypes.filter((name) => !recorded.some((plan) => plan.name === name));
  return { services, finished, monthly, oneTime, openRequests, unpriced };
};

// The services recorded on the client form (Services and pricing): each with its quantities,
// prices and what is included, the finished ones, what the client asked for, and the totals.
// On the Services page for one client. `canEdit` shows Edit, which opens that part of the
// client form here, in place of the card — as the onboarding page's answers are edited in place.
// `startEditing`: opened in edit mode, from that part of the client form (?edit=1).
const ClientServicePlans = ({ client, canEdit, startEditing = false }: { client: Client; canEdit: boolean; startEditing?: boolean }) => {
  const router = useRouter();
  const [editing, setEditing] = useState(startEditing);
  // Done editing: back to the card, and off ?edit=1 so a reload doesn't open the form again.
  const doneEditing = () => {
    setEditing(false);
    if (startEditing) router.replace(`/services?client=${client._id}&from=client`, { scroll: false });
  };
  const { services, finished, monthly, oneTime, openRequests, unpriced } = servicePlansOf(client);

  if (editing && canEdit) return <ClientForm client={client} only={3} embedded={{ onDone: doneEditing }} />;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)]">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-5.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef3e2] text-[#d97706]">
          <DollarSign size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] leading-tight font-bold text-[#0f172a]">Services and pricing</h2>
          <p className="mt-1 text-[12.5px] text-[#64748b]">The services the client agreed to, with their quantities and prices.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {canEdit ? (
            <button type="button" onClick={() => setEditing(true)} className={`${btnDraft} inline-flex cursor-pointer items-center gap-1.25`}>
              <Pencil size={12} strokeWidth={2} /> Edit
            </button>
          ) : null}
          <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap text-[#15803d] tabular-nums">{money(monthly)}/mo</span>
        </div>
      </div>

      <div className="border-t border-[#eef2f7] px-5 py-5 sm:px-5.5">
        {services.map((plan) => (
          <div key={plan.name} className="mb-3 rounded-xl border border-[#bbf7d0] bg-[#f4fbf6] p-3.5 text-[12.5px] last:mb-0">
            <div className="flex items-baseline justify-between gap-3 text-[13.5px] font-semibold text-[#14532d]">
              <span>
                {plan.name}
                {plan.custom ? <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-[#15803d]">Custom</span> : null}
                {/* A custom service is the client's project too: where it stands, and the way to it. */}
                {plan.custom ? (
                  <Link
                    href={`/projects?client=${client._id}`}
                    className="ml-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold no-underline"
                    style={PROJECT_LOOK[plan.status === "done" ? "completed" : (plan.stage ?? "new")].style}
                  >
                    <FolderKanban size={11} strokeWidth={2.25} /> {PROJECT_LOOK[plan.status === "done" ? "completed" : (plan.stage ?? "new")].label}
                  </Link>
                ) : null}
              </span>
              <span className="tabular-nums whitespace-nowrap">{plan.custom ? `${money(onceOf(plan))} one-time` : `${money(plan.monthly)}/mo`}</span>
            </div>
            {plan.addedAt || (plan.custom && (plan.deadline || plan.duration)) ? (
              <div className="mt-1 text-[12px] leading-normal text-[#3f6212]">
                {[plan.addedAt ? `Added ${formatDate(plan.addedAt)}` : "", plan.custom && plan.deadline ? `Due ${day(plan.deadline)}` : "", plan.custom && plan.duration ? `Takes ${plan.duration}` : ""].filter(Boolean).join(" · ")}
              </div>
            ) : null}
            {plan.custom ? (
              plan.included.length ? (
                <div className="mt-1.5 text-[12px] leading-normal text-[#3f6212]">
                  <b className="font-semibold text-[#15803d]">Included:</b> {listed(plan.included)}
                </div>
              ) : null
            ) : (
              <>
                <div className="mt-1 text-[12px] leading-normal text-[#3f6212]">{plan.fields.map((field) => `${field.label}: ${fieldValue(plan.name, field.label, field.value)}`).join(" · ")}</div>
                <div className="mt-1.5 text-[12px] leading-normal text-[#3f6212]">
                  <b className="font-semibold text-[#15803d]">Included:</b> {listed(plan.included) ?? "Nothing ticked"}
                </div>
              </>
            )}
            {plan.addons.length ? (
              <div className="mt-1 text-[12px] leading-normal text-[#3f6212]">
                <b className="font-semibold text-[#15803d]">Add-on rates (not billed now):</b> {plan.addons.map((addon) => `${addon.label} ${money(addon.price)}`).join(" · ")}
              </div>
            ) : null}
          </div>
        ))}
        {unpriced.length ? (
          <div className="rounded-xl border border-[#fecaca] bg-[#fff7f7] p-3.5 text-[12.5px]">
            <b className="text-[13.5px] font-semibold text-[#b91c1c]">{unpriced.join(", ")}</b>
            <div className={`${dashPendingSub} mt-1`}>No quantities or prices were recorded for {unpriced.length === 1 ? "this service" : "these services"}.</div>
          </div>
        ) : null}
        {services.length || unpriced.length ? null : <div className="rounded-xl border border-[#fecaca] bg-[#fff7f7] p-3.5 text-[13px] font-medium text-[#b91c1c]">No services yet.</div>}
        {finished.length ? (
          <div className="mt-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 text-[12.5px]">
            <div className="flex items-baseline justify-between gap-3">
              <b className="text-[13.5px] font-semibold text-[#334155]">Completed · history</b>
              <span className="text-[11.5px] text-[#64748b]">Not billed or counted</span>
            </div>
            <ul className="mt-2 flex list-none flex-col divide-y divide-[#e2e8f0]">
              {finished.map((plan) => (
                <li key={plan.name} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 text-[#334155]">
                    <span className="font-semibold">{plan.name}</span>
                    <span className="text-[#64748b]">
                      {plan.addedAt ? ` · Added ${formatDate(plan.addedAt)}` : ""}
                      {plan.doneAt ? ` · Done ${formatDate(plan.doneAt)}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[#64748b] tabular-nums">{plan.custom ? `${money(onceOf(plan))} one-time` : `${money(plan.monthly)}/mo`}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {openRequests.length ? (
          <div className="mt-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3.5 text-[12.5px]">
            <b className="text-[13.5px] font-semibold text-[#92400e]">Requested by the client</b>
            <ul className="mt-1.5 flex list-none flex-col gap-1">
              {openRequests.map((request) => (
                <li key={request._id} className="text-[#78350f]">
                  <span className="font-semibold">{request.name}</span> · {formatDate(request.requestedAt)}
                  {request.note ? ` · ${request.note}` : ""}
                </li>
              ))}
            </ul>
            {canEdit ? <div className={`${dashPendingSub} mt-1.5`}>Add them as custom services with Edit.</div> : null}
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-[#86efac] bg-[#dcfce7] px-4 py-3 text-[12.5px] text-[#14532d]">
          <div className="flex items-baseline justify-between gap-3">
            <span>Monthly total</span>
            <b className="text-[16px] font-semibold tabular-nums">{money(monthly)}</b>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-[#bbf7d0] pt-1.5 text-[#3f6212]">
            <span>One-time fees</span>
            <span className="tabular-nums">{money(oneTime)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientServicePlans;
