"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownRight, ArrowUpRight, Building2, ChevronDown, Layers, Loader2, Save, Search, SearchX, UserPlus, X } from "lucide-react";
import { getClientServicesAction, setClientServicesAction, type ClientService, type Service } from "@/app/actions/service";
import { SERVICE_PLANS, dollars, serviceColorOf, serviceIconOf, servicePrice } from "./serviceUi";
import TriCheckbox from "./TriCheckbox";

type ClientOption = { _id: string; companyName: string };
// Service id → the ids of the sub-services included; a service that isn't here isn't taken.
type Picks = Record<string, string[]>;

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// What a client already takes — where ticking starts from for that client.
const picksOf = (current: ClientService[]): Picks =>
  Object.fromEntries(current.map((entry) => [entry.service._id, entry.subServices.map((item) => item.subService)]));

const totalOf = (services: Service[], picks: Picks) =>
  services.reduce((sum, service) => (picks[service._id] ? sum + servicePrice(service, picks[service._id]) : sum), 0);

const linkButtonClass =
  "cursor-pointer rounded-md px-2 py-1 text-[11.5px] font-medium text-[#2f5fd8] hover:bg-[#eef3fd] disabled:cursor-default disabled:text-[#9aa3af] disabled:hover:bg-transparent";

// Chooses which catalog services a client takes, and which sub-services of each.
// It edits the client's whole set: what's ticked when saved is what they have.
// `locked` fixes the client (opened from that client's view, with what they take
// now); otherwise one is picked here and their services are fetched.
const AssignServices = ({
  clients,
  services,
  locked,
  onSaved,
  onClose,
}: {
  clients: ClientOption[];
  services: Service[];
  locked?: { clientId: string; current: ClientService[] };
  onSaved: (clientId: string) => void;
  onClose: () => void;
}) => {
  const [clientId, setClientId] = useState(locked?.clientId ?? "");
  // What the chosen client takes now, as loaded — the baseline for "more / less than now".
  const [before, setBefore] = useState<Picks>(() => picksOf(locked?.current ?? []));
  const [picks, setPicks] = useState<Picks>(() => picksOf(locked?.current ?? []));
  // Which service cards show their sub-services. The ones a client already takes
  // start open; ticking a service opens it.
  const [opened, setOpened] = useState<string[]>(() => Object.keys(picksOf(locked?.current ?? [])));
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Counts client choices, so a slow answer for an earlier client can't overwrite a later one.
  const request = useRef(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Another client has another set: load what that client takes and start from it.
  const chooseClient = async (id: string) => {
    const mine = ++request.current;
    setClientId(id);
    setError(null);
    setLoading(true);
    const result = await getClientServicesAction(id);
    if (mine !== request.current) return;

    const current = result.ok && result.data ? picksOf(result.data.services) : {};
    if (!result.ok) setError(result.error ?? "Couldn't load this client's services.");
    setBefore(current);
    setPicks(current);
    setOpened(Object.keys(current));
    setLoading(false);
  };

  // The main checkbox: everything under the service, or nothing. A partly ticked
  // service goes to everything first.
  const toggleService = (service: Service) => {
    const full = picks[service._id]?.length === service.subServices.length;
    setPicks((previous) => {
      const next = { ...previous };
      if (full) delete next[service._id];
      else next[service._id] = service.subServices.map((item) => item._id);
      return next;
    });
    if (!full) setOpened((previous) => (previous.includes(service._id) ? previous : [...previous, service._id]));
  };

  // Unticking a service's last sub-service drops the service itself.
  const toggleItem = (service: Service, id: string) =>
    setPicks((previous) => {
      const current = previous[service._id] ?? [];
      const items = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
      const next = { ...previous };
      if (items.length) next[service._id] = items;
      else delete next[service._id];
      return next;
    });

  const toggleOpen = (id: string) => setOpened((previous) => (previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id]));

  // Every service with every sub-service, or nothing at all.
  const selectAll = () => setPicks(Object.fromEntries(services.map((service) => [service._id, service.subServices.map((item) => item._id)])));
  const clearAll = () => setPicks({});

  const needle = query.trim().toLowerCase();
  // Search looks inside the services too, so "backlink" finds SEO.
  const shown = needle
    ? services.filter((service) => [service.title, ...service.subServices.map((item) => item.name)].join(" ").toLowerCase().includes(needle))
    : services;

  const chosen = services.filter((service) => picks[service._id]);
  const everything = services.length > 0 && services.every((service) => picks[service._id]?.length === service.subServices.length);
  const total = totalOf(services, picks);
  const subCount = chosen.reduce((sum, service) => sum + picks[service._id].length, 0);

  const client = clients.find((option) => option._id === clientId);
  const hadServices = Object.keys(before).length > 0;
  // What saving would do to the client's monthly payment.
  const change = total - totalOf(services, before);
  const busy = loading || saving;

  const handleSave = async () => {
    if (!client) {
      toast.error("Choose the client first.");
      return;
    }
    if (chosen.length === 0 && !hadServices) {
      toast.error("Tick at least one service.");
      return;
    }

    setError(null);
    setSaving(true);
    const result = await setClientServicesAction(
      client._id,
      // Sub-services go in catalog order.
      chosen.map((service) => ({
        service: service._id,
        subServices: service.subServices.map((item) => item._id).filter((id) => picks[service._id].includes(id)),
      })),
    );
    setSaving(false);

    if (!result.ok) {
      const message = [result.error ?? "Couldn't save the services.", ...(result.fieldErrors ?? [])].join(" ");
      setError(message);
      toast.error(result.error ?? "Couldn't save the services.");
      return;
    }

    toast.success(chosen.length ? `${client.companyName}'s services were saved` : `${client.companyName} no longer has any services`);
    onSaved(client._id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0b1522]/60 p-4 backdrop-blur-[2px] sm:items-center sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-services-title"
    >
      <div
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(11,21,34,0.28)] sm:max-h-[88vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#eef0f2] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9e0ef] text-[#2f5fd8]">
              <UserPlus size={19} strokeWidth={2} />
            </span>
            <div>
              <div id="assign-services-title" className="text-[16px] font-semibold text-[#0b0c24]">
                Assign Services
              </div>
              <div className="mt-0.5 text-[12px] text-[#4b5563]">Choose a client, then tick the services and sub-services they take.</div>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#4b5260] hover:bg-[#f3f4f6] hover:text-[#0b0c24]"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_280px]">
          {/* Left: the client and the catalog to tick from. */}
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-4.5">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-[#1f2530]" htmlFor="assign-client">
                Client <span className="text-[#dc2626]">*</span>
              </label>
              <div className="relative">
                <Building2 size={15} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#4b5260]" />
                <select
                  id="assign-client"
                  className="h-10.5 w-full cursor-pointer appearance-none rounded-lg border border-[#e2e5e9] bg-white pr-9 pl-9 text-[12.5px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af] disabled:cursor-default disabled:bg-[#f9fafb] disabled:text-[#4b5260]"
                  value={clientId}
                  disabled={Boolean(locked) || saving}
                  onChange={(event) => chooseClient(event.target.value)}
                >
                  <option value="" disabled>
                    {clients.length ? "Select a client" : "No clients available"}
                  </option>
                  {clients.map((option) => (
                    <option key={option._id} value={option._id}>
                      {option.companyName}
                    </option>
                  ))}
                </select>
                {loading ? (
                  <Loader2 size={14} strokeWidth={2.5} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-[#4b5260]" />
                ) : (
                  <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
                )}
              </div>
            </div>

            {error ? (
              <div role="alert" className="rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12px] font-medium text-[#b42318]">
                {error}
              </div>
            ) : null}

            <div className={loading ? "pointer-events-none opacity-50" : ""} aria-busy={loading}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[12px] font-medium text-[#1f2530]">
                  Services <span className="font-normal text-[#6b7280]">· {services.length} in the catalog</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className={linkButtonClass} disabled={everything} onClick={selectAll}>
                    Select all
                  </button>
                  <button type="button" className={linkButtonClass} disabled={chosen.length === 0} onClick={clearAll}>
                    Clear all
                  </button>
                </div>
              </div>

              {services.length > 4 || query ? (
                <div className="mb-2.5 flex h-9.5 items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af]" role="search">
                  <Search size={14} strokeWidth={2} className="shrink-0 text-[#4b5260]" />
                  <input
                    type="search"
                    placeholder="Search services or sub-services..."
                    aria-label="Search services"
                    autoComplete="off"
                    className="w-full border-none bg-transparent text-[12px] text-[#1f2530] outline-none placeholder:text-[#6b7280] [&::-webkit-search-cancel-button]:hidden"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  {query ? (
                    <button type="button" className="inline-flex cursor-pointer text-[#6b7280] hover:text-[#0b0c24]" aria-label="Clear search" onClick={() => setQuery("")}>
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  ) : null}
                </div>
              ) : null}

              {shown.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-[#d5d9df] px-4 py-8 text-center">
                  <SearchX size={22} strokeWidth={1.8} className="mb-2 text-[#6b7280]" />
                  <div className="text-[12.5px] font-medium text-[#0b0c24]">{services.length ? "No service matches that search" : "The catalog is empty"}</div>
                  <div className="mt-1 text-[11.5px] text-[#6b7280]">
                    {services.length ? "Try another word." : "A super admin adds services to the catalog first."}
                  </div>
                </div>
              ) : (
                <ul className="flex list-none flex-col gap-2.5">
                  {shown.map((service) => {
                    const included = picks[service._id] ?? [];
                    const on = included.length > 0;
                    const full = included.length === service.subServices.length;
                    const open = opened.includes(service._id);
                    const Icon = serviceIconOf(service);

                    return (
                      <li
                        key={service._id}
                        className={`overflow-hidden rounded-xl border transition-colors ${on ? "border-[#0b0c24] bg-[#fbfcfd]" : "border-[#e6e8eb] bg-white hover:border-[#c9ced6]"}`}
                      >
                        <div className="flex items-center gap-3 px-3.5 py-3">
                          <TriCheckbox
                            label={`${service.title} with all its sub-services`}
                            checked={on && full}
                            partial={on}
                            onChange={() => toggleService(service)}
                          />
                          {/* The rest of the header opens and closes the sub-services. */}
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                            aria-expanded={open}
                            onClick={() => toggleOpen(service._id)}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: serviceColorOf(service) }}>
                              <Icon size={16} strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12.5px] font-medium text-[#1f2530]">{service.title}</span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6b7280]">
                                <span className="rounded bg-[#f3f4f6] px-1.5 py-px font-medium text-[#4b5260]">{SERVICE_PLANS[service.plan] ?? service.plan}</span>
                                {on ? (
                                  <span className="font-medium text-[#0b0c24]">
                                    {included.length} of {service.subServices.length} sub-services
                                  </span>
                                ) : (
                                  <span>{service.subServices.length} sub-services</span>
                                )}
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className={`text-[13.5px] font-semibold ${on ? "text-[#0b0c24]" : "text-[#6b7280]"}`}>
                                {dollars(servicePrice(service, on ? included : undefined))}
                              </span>
                              <span className="text-[11px] text-[#6b7280]">/mo</span>
                            </span>
                            <ChevronDown size={16} strokeWidth={2} className={`shrink-0 text-[#4b5260] transition-transform ${open ? "rotate-180" : ""}`} />
                          </button>
                        </div>

                        {open ? (
                          <ul className="grid list-none grid-cols-1 gap-1.5 border-t border-[#eef0f2] bg-[#f9fafb] px-3.5 py-3 sm:grid-cols-2">
                            {service.subServices.map((item) => {
                              const ticked = included.includes(item._id);
                              return (
                                <li key={item._id}>
                                  <label
                                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[12px] transition-colors ${
                                      ticked ? "border-[#c9ced6] bg-white" : "border-transparent hover:bg-white"
                                    }`}
                                  >
                                    <TriCheckbox label={item.name} checked={ticked} onChange={() => toggleItem(service, item._id)} />
                                    <span className={`min-w-0 flex-1 ${ticked ? "text-[#1f2530]" : "text-[#4b5260]"}`}>{item.name}</span>
                                    <span className={`shrink-0 ${ticked ? "font-medium text-[#1f2530]" : "text-[#6b7280]"}`}>{dollars(item.price)}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right: what the client will have — and pay — once this is saved. */}
          <div className="flex min-h-0 flex-col border-t border-[#eef0f2] bg-[#f9fafb] md:border-t-0 md:border-l">
            <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4.5 py-4.5">
              <div className="text-[11px] font-semibold tracking-[0.4px] text-[#6b7280] uppercase">Summary</div>

              <div className="flex items-center gap-2.5 rounded-xl border border-[#e6e8eb] bg-white px-3 py-2.5">
                <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-[#0b0c24] text-[10.5px] font-semibold text-white">
                  {client ? initialsOf(client.companyName) : <Building2 size={14} strokeWidth={2} />}
                </span>
                <div className="min-w-0">
                  <div className={`truncate text-[12.5px] font-medium ${client ? "text-[#1f2530]" : "text-[#6b7280]"}`}>
                    {client ? client.companyName : "No client chosen yet"}
                  </div>
                  {client ? (
                    <div className="text-[11px] text-[#6b7280]">
                      {loading ? "Loading their services…" : hadServices ? `Has ${Object.keys(before).length} now` : "No services yet"}
                    </div>
                  ) : null}
                </div>
              </div>

              {chosen.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-[#d5d9df] px-3 py-6 text-center">
                  <Layers size={20} strokeWidth={1.8} className="mb-1.5 text-[#6b7280]" />
                  <div className="text-[11.5px] leading-normal text-[#6b7280]">Tick a service on the left and it will be listed here.</div>
                </div>
              ) : (
                <ul className="flex list-none flex-col gap-2">
                  {chosen.map((service) => (
                    <li key={service._id} className="flex items-start gap-2.5 text-[12px]">
                      <span className="mt-1.25 h-2 w-2 shrink-0 rounded-full" style={{ background: serviceColorOf(service) }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-[#1f2530]" title={service.title}>
                          {service.title}
                        </span>
                        <span className="block text-[11px] text-[#6b7280]">
                          {picks[service._id].length} of {service.subServices.length} sub-services
                        </span>
                      </span>
                      <span className="shrink-0 font-medium text-[#1f2530]">{dollars(servicePrice(service, picks[service._id]))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-[#e6e8eb] px-4.5 py-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <div className="text-[11.5px] text-[#6b7280]">Monthly payment</div>
                  <div className="text-[11px] text-[#6b7280]">
                    {chosen.length} {chosen.length === 1 ? "service" : "services"} · {subCount} sub-{subCount === 1 ? "service" : "services"}
                  </div>
                </div>
                <div>
                  <span className="text-[24px] leading-none font-semibold text-[#0b0c24]">{dollars(total)}</span>
                  <span className="text-[11.5px] text-[#6b7280]">/mo</span>
                </div>
              </div>
              {client && hadServices && change !== 0 ? (
                <div
                  className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                    change > 0 ? "bg-[#d6eadb] text-[#15803d]" : "bg-[#fbecd3] text-[#a35a12]"
                  }`}
                >
                  {change > 0 ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
                  {dollars(Math.abs(change))}/mo {change > 0 ? "more" : "less"} than now
                </div>
              ) : null}
              <div className="mt-3.5 flex gap-2.5">
                <button
                  type="button"
                  className="flex h-9.5 flex-1 cursor-pointer items-center justify-center rounded-lg border border-[#e2e5e9] bg-white text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6]"
                  disabled={saving}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex h-9.5 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] text-[12.5px] font-medium text-white hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-70"
                  disabled={busy}
                  aria-busy={saving}
                  onClick={handleSave}
                >
                  {saving ? <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignServices;
