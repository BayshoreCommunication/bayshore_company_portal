"use client";

import { createElement, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Check, Eye, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { createServiceAction, updateServiceAction, type Service, type ServicePlan } from "@/app/actions/service";
import {
  SERVICE_DESCRIPTION_LIMIT,
  SERVICE_PLANS,
  SERVICE_PLAN_KEYS,
  SERVICE_TITLE_LIMIT,
  SUB_SERVICE_MAX_PRICE,
  SUB_SERVICE_NAME_LIMIT,
  colorForTitle,
  dollars,
  serviceIconOf,
} from "./serviceUi";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const labelClass = "mb-1.5 block text-[12px] font-medium text-[#1f2530]";
const fieldClass =
  "h-10 w-full rounded-lg border border-[#e2e5e9] bg-white px-3 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9aa3af] focus:border-[#9aa3af]";
const selectClass = `${fieldClass} cursor-pointer`;
const rowClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";
const star = <span className="text-[#dc2626]">*</span>;

// One row of the sub-service list while it's being typed. `id` only keeps React's
// rows straight as they're added and removed; the price stays text until saved.
// `_id` is the sub-service's id in the catalog when it already exists — sent back
// so a rename or a new price reaches the clients who take it.
type Draft = { id: number; text: string; price: string; _id?: string };

// "250" → 250; anything that isn't a whole number of dollars → null.
const priceOf = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : null);

// A main service in the catalog, built from the sub-services under it; its monthly
// price is the sum of theirs. Pass `service` to edit an existing one; leave it out
// to add a new one. Only superadmins reach this form (the pages check, and the
// backend refuses anyone else).
const ServiceForm = ({ service }: { service?: Service }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(service);

  const [title, setTitle] = useState(service?.title ?? "");
  const [plan, setPlan] = useState<ServicePlan>(service?.plan ?? "core");
  const [desc, setDesc] = useState(service?.description ?? "");
  const [drafts, setDrafts] = useState<Draft[]>(
    service?.subServices.length
      ? service.subServices.map((item, index) => ({ id: index + 1, text: item.name, price: String(item.price), _id: item._id }))
      : [{ id: 1, text: "", price: "" }],
  );
  const nextId = useRef(drafts.length + 1);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // Rows left completely empty are ignored rather than complained about.
  const filled = drafts.filter((draft) => draft.text.trim() || draft.price.trim());
  const total = filled.reduce((sum, draft) => sum + (priceOf(draft.price) ?? 0), 0);

  const updateDraft = (id: number, patch: Partial<Draft>) =>
    setDrafts((previous) => previous.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));

  const addDraft = () => setDrafts((previous) => [...previous, { id: nextId.current++, text: "", price: "" }]);

  const removeDraft = (id: number) =>
    setDrafts((previous) => (previous.length === 1 ? [{ ...previous[0], text: "", price: "" }] : previous.filter((draft) => draft.id !== id)));

  const problem = () => {
    if (!title.trim()) return "Give the service a name.";
    if (filled.length === 0) return "Add at least one sub-service with its monthly price.";
    const names = filled.map((draft) => draft.text.trim().toLowerCase());
    for (const [index, draft] of filled.entries()) {
      if (!draft.text.trim()) return "Every sub-service needs a name.";
      if (names.indexOf(names[index]) !== index) return `"${draft.text.trim()}" is listed twice.`;
      const price = priceOf(draft.price);
      if (price === null) return `Enter a monthly price in whole dollars for "${draft.text.trim()}".`;
      if (price > SUB_SERVICE_MAX_PRICE) return `"${draft.text.trim()}" is priced over ${dollars(SUB_SERVICE_MAX_PRICE)} a month — check the amount.`;
    }
    return null;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    const message = problem();
    if (message) {
      setError(message);
      toast.error(message);
      return;
    }

    const details = {
      title: title.trim(),
      plan,
      description: desc.trim(),
      // Existing sub-services go back with their ids; new rows without one.
      subServices: filled.map((draft) => ({ ...(draft._id ? { _id: draft._id } : {}), name: draft.text.trim(), price: priceOf(draft.price) ?? 0 })),
    };

    startTransition(async () => {
      const result = service
        ? await updateServiceAction(service._id, details)
        : await createServiceAction({ ...details, color: colorForTitle(details.title) });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors ?? []);
        toast.error(result.error ?? "Something went wrong.");
        return;
      }

      // Editing tells how many clients' payments followed the change.
      const clients = service && result.data && "clients" in result.data ? result.data.clients : undefined;
      const touched = clients ? clients.updated + clients.removed : 0;
      toast.success(
        service
          ? touched
            ? `Service updated — ${touched} ${touched === 1 ? "client's services" : "clients' services"} followed`
            : "Service updated successfully"
          : "Service added successfully",
      );
      router.push("/services");
    });
  };

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">{isEdit ? "Edit Service" : "Add Service"}</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            {isEdit
              ? "Change the service, its sub-services or their prices. Clients who take it follow: a renamed sub-service stays theirs, a removed one is dropped, and new prices change their monthly payment."
              : "A new main service for the catalog, with the sub-services it includes and what each costs a month. Once added, it can be assigned to any client."}
          </div>
        </div>
        <Link
          href="/services"
          className="flex h-9.5 items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
        >
          <ArrowLeft size={14} strokeWidth={2} /> Back to Services
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={handleSubmit} className={`${cardClass} p-5`} noValidate>
          <div className="mb-3 text-[14px] font-semibold text-[#0b0c24]">Main Service</div>
          <div className="flex flex-col gap-4">
            <div className={rowClass}>
              <div>
                <label className={labelClass} htmlFor="service-title">
                  Service Name {star}
                </label>
                <input
                  id="service-title"
                  type="text"
                  className={fieldClass}
                  placeholder="e.g. Paid Search"
                  maxLength={SERVICE_TITLE_LIMIT}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="service-plan">
                  Plan
                </label>
                <select id="service-plan" className={selectClass} value={plan} onChange={(event) => setPlan(event.target.value as ServicePlan)}>
                  {SERVICE_PLAN_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {SERVICE_PLANS[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="service-desc">
                Description
              </label>
              <textarea
                id="service-desc"
                className={`${fieldClass} h-18 resize-y py-2.5`}
                placeholder="What this service does for the client, in a sentence."
                maxLength={SERVICE_DESCRIPTION_LIMIT}
                value={desc}
                onChange={(event) => setDesc(event.target.value)}
              />
            </div>
          </div>

          <div className="my-5 border-t border-[#eef0f2]" />

          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <div className="text-[14px] font-semibold text-[#0b0c24]">
              Sub-services {star}
            </div>
            <div className="text-[11.5px] text-[#6b7280]">Each one is priced per month, in whole dollars.</div>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {drafts.map((draft, index) => (
              <div key={draft.id} className="flex items-center gap-2.5">
                <span className="hidden w-5 shrink-0 text-right text-[11.5px] text-[#6b7280] sm:block">{index + 1}.</span>
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="e.g. Google Ads campaign management"
                  aria-label={`Sub-service ${index + 1} name`}
                  maxLength={SUB_SERVICE_NAME_LIMIT}
                  value={draft.text}
                  onChange={(event) => updateDraft(draft.id, { text: event.target.value })}
                />
                <div className="relative w-36 shrink-0">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[12.5px] text-[#6b7280]">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`${fieldClass} pr-10 pl-6 text-right`}
                    placeholder="0"
                    aria-label={`Sub-service ${index + 1} monthly price in dollars`}
                    value={draft.price}
                    // Digits only, so a price can't pick up a stray letter or minus sign.
                    onChange={(event) => updateDraft(draft.id, { price: event.target.value.replace(/\D/g, "").slice(0, 7) })}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-[#6b7280]">/mo</span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#4b5260] hover:bg-[#fdecec] hover:text-[#b42318]"
                  aria-label={`Remove sub-service ${index + 1}`}
                  onClick={() => removeDraft(draft.id)}
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#b9c6ee] bg-white px-3 py-2.5 text-[12px] font-medium text-[#2f5fd8] hover:bg-[#f3f6fd]"
            onClick={addDraft}
          >
            <Plus size={13} strokeWidth={2.5} /> Add Another Sub-service
          </button>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f6f7f9] px-4 py-3">
            <div>
              <div className="text-[12.5px] font-medium text-[#0b0c24]">Monthly price of this service</div>
              <div className="mt-0.5 text-[11px] text-[#6b7280]">
                The sum of {filled.length === 1 ? "its 1 sub-service" : `its ${filled.length} sub-services`}
              </div>
            </div>
            <div>
              <span className="text-[22px] font-semibold text-[#0b0c24]">{dollars(total)}</span>
              <span className="text-[11.5px] text-[#6b7280]">/mo</span>
            </div>
          </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b42318]">
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

          <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-[#eef0f2] pt-4 sm:flex-row sm:justify-end">
            <Link
              href="/services"
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
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Service"}
            </button>
          </div>
        </form>

        {/* How the service will look on the Services page, filled in live as the form is typed. */}
        <div className={`${cardClass} p-4.5`}>
          <div className="mb-3.5 flex items-center gap-2 text-[13px] font-semibold text-[#0b0c24]">
            <Eye size={15} strokeWidth={2} className="text-[#2f5fd8]" /> Preview
          </div>
          <div className="rounded-xl border border-[#eef0f2] bg-[#f9fafb] p-3.5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: service?.color || colorForTitle(title || "service") }}
              >
                {/* Looked up, not defined here — createElement keeps that clear to the linter. */}
                {createElement(serviceIconOf({ title }), { size: 16, strokeWidth: 2 })}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium text-[#1f2530]" title={title.trim() || undefined}>
                  {title.trim() || "New service"}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{SERVICE_PLANS[plan]}</div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[13.5px] font-semibold text-[#0b0c24]">{dollars(total)}</span>
                <span className="text-[11px] text-[#6b7280]">/mo</span>
              </div>
            </div>
            <div className="mt-3 border-t border-[#eef0f2] pt-3">
              {filled.length === 0 ? (
                <div className="text-[11.5px] text-[#6b7280]">Sub-services will be listed here.</div>
              ) : (
                <ul className="flex list-none flex-col gap-2">
                  {filled.map((draft) => (
                    <li key={draft.id} className="flex items-start gap-2 text-[11.5px]">
                      <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d6eadb] text-[#15803d]">
                        <Check size={10} strokeWidth={3} />
                      </span>
                      <span className="min-w-0 flex-1 text-[#1f2530]">{draft.text.trim() || <span className="text-[#6b7280]">Unnamed</span>}</span>
                      <span className="shrink-0 font-medium text-[#4b5260]">{dollars(priceOf(draft.price) ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;
