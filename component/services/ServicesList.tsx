"use client";

import { Fragment, useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Building2,
  Check,
  ChevronDown,
  CircleDollarSign,
  Layers,
  ListChecks,
  Loader2,
  Minus,
  Pencil,
  PieChart,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { deleteServiceAction, type ClientServicesData, type Service, type ServiceListData, type ServicePlan } from "@/app/actions/service";
import AssignServices from "./AssignServices";
import { SERVICE_PLANS, SERVICE_PLAN_KEYS, dollars, plural, serviceColorOf, serviceIconOf } from "./serviceUi";

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3 text-[12px] whitespace-nowrap text-[#1f2530]";

const iconButtonClass =
  "inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md text-[#4b5260] no-underline hover:bg-[#eef0f2] hover:text-[#0b0c24]";
const darkButtonClass =
  "flex items-center gap-1.5 rounded-lg bg-[#0b0c24] text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]";
const outlineButtonClass =
  "flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6]";
const errorBannerClass = "rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]";

type ClientOption = { _id: string; companyName: string };
// A row of the table: a catalog service, what it costs here, and — in a client's
// view — which of its sub-services (by id) that client takes.
type Row = { service: Service; price: number; included?: string[]; clientCount?: number };

// ── Small pieces ─────────────────────────────────────────────────────────────

const SelectBox = ({
  label,
  value,
  onChange,
  wide = false,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
  children: React.ReactNode;
}) => (
  <div className={`relative w-full ${wide ? "sm:w-60" : "sm:w-42"}`}>
    <select
      // A chosen filter gets a darker border so it's clear the list is narrowed.
      className={`${inputClass} ${value === "all" ? "border-[#e2e5e9]" : "border-[#0b0c24]"}`}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
    <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
  </div>
);

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

// A list of colored bars — who takes each service, or where a monthly payment goes.
const BreakdownCard = ({
  icon: Icon,
  title,
  sub,
  empty,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  empty: string;
  rows: { key: string; label: string; color: string; amount: number; text: string }[];
}) => {
  const max = Math.max(1, ...rows.map((row) => row.amount));

  return (
    <div className={`${cardClass} p-4.5`}>
      <div className="mb-3.5 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9e0ef] text-[#2f5fd8]">
          <Icon size={17} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-[#0b0c24]">{title}</div>
          <div className="mt-0.5 text-[11px] text-[#6b7280]">{sub}</div>
        </div>
      </div>
      {rows.every((row) => row.amount === 0) ? (
        <div className="py-1 text-[12px] leading-normal text-[#6b7280]">{empty}</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[12px]">
                <span className="flex min-w-0 items-center gap-2 font-medium text-[#1f2530]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />
                  <span className="truncate" title={row.label}>
                    {row.label}
                  </span>
                </span>
                <span className="shrink-0 text-[#4b5260]">{row.text}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                <div className="h-full rounded-full" style={{ width: `${(row.amount / max) * 100}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// A service's sub-services, opened under its row. In a client's view (`included`),
// the ones they take are ticked and the ones left out are greyed.
const ServiceDetails = ({ service, price, included }: { service: Service; price: number; included?: string[] }) => (
  <div className="rounded-xl bg-[#f6f7f9] p-4 whitespace-normal">
    <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
      <div className="text-[11px] text-[#6b7280]">Sub-services</div>
      <div className="text-[11px] text-[#6b7280]">
        {included ? `${included.length} of ${service.subServices.length} included` : plural(service.subServices.length, "item")} · {dollars(price)}/mo
      </div>
    </div>
    <ul className="grid list-none grid-cols-1 gap-2 md:grid-cols-2">
      {service.subServices.map((item) => {
        const on = !included || included.includes(item._id);
        return (
          <li
            key={item._id}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[12px] ${on ? "border-[#e6e8eb] bg-white" : "border-dashed border-[#d5d9df] bg-transparent"}`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${on ? "bg-[#d6eadb] text-[#15803d]" : "bg-[#e8ecf1] text-[#64748b]"}`}>
              {on ? <Check size={12} strokeWidth={2.75} /> : <Minus size={12} strokeWidth={2.75} />}
            </span>
            <span className={`min-w-0 flex-1 ${on ? "text-[#1f2530]" : "text-[#6b7280]"}`}>
              {item.name}
              {on ? null : <span className="ml-1.5 text-[11px]">(not included)</span>}
            </span>
            <span className={`shrink-0 font-medium ${on ? "text-[#4b5260]" : "text-[#9aa3af] line-through"}`}>{dollars(item.price)}/mo</span>
          </li>
        );
      })}
    </ul>
  </div>
);

// Asks once in place before deleting. The backend refuses while a client still
// takes the service, and says how many do.
const DeleteService = ({ service }: { service: Service }) => {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteServiceAction(service._id);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete service.");
        setConfirming(false);
        return;
      }
      toast.success(`${service.title} was deleted`);
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className={`${iconButtonClass} hover:bg-[#fdecec] hover:text-[#b42318]`}
        aria-label={`Delete ${service.title}`}
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={15} strokeWidth={2} />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#b42318]">
      Delete?
      <button
        type="button"
        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-[#dc2626] px-2.5 text-white hover:bg-[#b91c1c] disabled:cursor-wait"
        disabled={isPending}
        aria-busy={isPending}
        onClick={handleDelete}
      >
        {isPending ? <Loader2 size={12} strokeWidth={2.5} className="animate-spin" /> : null} Yes
      </button>
      <button
        type="button"
        className="inline-flex h-7 cursor-pointer items-center rounded-md border border-[#e2e5e9] bg-white px-2.5 text-[#1f2530] hover:bg-[#f3f4f6]"
        disabled={isPending}
        onClick={() => setConfirming(false)}
      >
        No
      </button>
    </span>
  );
};

// ── The Services page ────────────────────────────────────────────────────────

// Two views in one page. The catalog: every service BayShore offers, with
// "Assign to Client" to choose which of them a client takes. And one client's view
// (`clientId`, from ?client=): the services that client takes and their monthly payment.
// `catalog` / `clientServices` are missing when they couldn't be loaded; the
// matching error says why. `canManage` (superadmins) shows the ways to add, edit
// and delete catalog services; `canAssign` shows the ways to give them to clients.
const ServicesList = ({
  catalog,
  catalogError,
  clientServices,
  clientError,
  clients,
  clientId,
  canManage,
  canAssign,
}: {
  catalog?: ServiceListData;
  catalogError?: string;
  clientServices?: ClientServicesData;
  clientError?: string;
  clients: ClientOption[];
  clientId: string;
  canManage: boolean;
  canAssign: boolean;
}) => {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();

  const [plan, setPlan] = useState<ServicePlan | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const closeAssign = useCallback(() => setAssigning(false), []);

  const clientView = clientId !== "all";
  const clientName = clients.find((option) => option._id === clientId)?.companyName ?? "This client";
  const services = useMemo(() => catalog?.services ?? [], [catalog]);

  // The rows of the current view, before the plan filter and search.
  const rows: Row[] = useMemo(
    () =>
      clientView
        ? (clientServices?.services ?? []).map((entry) => ({
            service: entry.service,
            price: entry.monthlyPrice,
            included: entry.subServices.map((item) => item.subService),
          }))
        : services.map((service) => ({ service, price: service.monthlyPrice, clientCount: service.clientCount })),
    [clientView, clientServices, services],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(
      ({ service }) =>
        (plan === "all" || service.plan === plan) &&
        // Search looks inside the services too, so "backlink" finds SEO.
        (!needle || [service.title, service.description ?? "", ...service.subServices.map((item) => item.name)].join(" ").toLowerCase().includes(needle)),
    );
  }, [rows, plan, query]);

  const monthlyTotal = clientServices?.monthlyTotal ?? 0;
  const hasFilters = plan !== "all" || query.trim() !== "";
  const clearFilters = () => {
    setPlan("all");
    setQuery("");
  };

  const chooseClient = (id: string) => {
    setOpenId(null);
    startNavigation(() => router.replace(id === "all" ? "/services" : `/services?client=${id}`, { scroll: false }));
  };

  const loadError = clientView ? clientError : catalogError;
  const loaded = clientView ? Boolean(clientServices) : Boolean(catalog);
  const columns = clientView ? 5 : 6;

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Services</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            {clientView ? (
              <>
                The services <span className="font-medium text-[#0b0c24]">{clientName}</span> takes, and what they pay each month.
              </>
            ) : (
              "Every service BayShore offers. Use Assign to Client to choose the ones a client takes."
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {clientView ? (
            canAssign && clientServices && catalog ? (
              <button type="button" className={`${darkButtonClass} h-9.5 cursor-pointer px-4`} onClick={() => setAssigning(true)}>
                <Pencil size={14} strokeWidth={2} /> Edit Services
              </button>
            ) : null
          ) : (
            <>
              {canAssign && catalog ? (
                <button type="button" className={outlineButtonClass} onClick={() => setAssigning(true)}>
                  <UserPlus size={14} strokeWidth={2} /> Assign to Client
                </button>
              ) : null}
              {canManage ? (
                <Link href="/services/add" className={`${darkButtonClass} h-9.5 px-4`}>
                  <Plus size={14} strokeWidth={2.5} /> Add Service
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>

      {loaded ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {clientView ? (
            <>
              <SummaryTile icon={Layers} label="Active Services" sub="This client takes" value={String(rows.length)} color="#2f5fd8" background="#d9e0ef" />
              <SummaryTile icon={CircleDollarSign} label="Monthly Payment" sub="Sum of what's included" value={dollars(monthlyTotal)} color="#16a34a" background="#d2e7d8" />
              <SummaryTile
                icon={ListChecks}
                label="Sub-services"
                sub="Included across their services"
                value={String(rows.reduce((sum, row) => sum + (row.included?.length ?? 0), 0))}
                color="#d97706"
                background="#f8e4c6"
              />
              <SummaryTile
                icon={Sparkles}
                label="Not Yet Added"
                sub="Catalog services they don't take"
                value={catalog ? String(Math.max(0, services.length - rows.length)) : "—"}
                color="#7c3aed"
                background="#ece4fb"
              />
            </>
          ) : (
            <>
              <SummaryTile icon={Layers} label="Services" sub="In the catalog" value={String(catalog?.summary.services ?? 0)} color="#2f5fd8" background="#d9e0ef" />
              <SummaryTile
                icon={ListChecks}
                label="Sub-services"
                sub="Across all services"
                value={String(catalog?.summary.subServices ?? 0)}
                color="#d97706"
                background="#f8e4c6"
              />
              <SummaryTile
                icon={Building2}
                label="Clients Served"
                sub="With at least one service"
                value={String(catalog?.summary.clientsServed ?? 0)}
                color="#7c3aed"
                background="#ece4fb"
              />
              <SummaryTile
                icon={CircleDollarSign}
                label="Monthly Payments"
                sub="All your clients together"
                value={dollars(catalog?.summary.monthlyTotal ?? 0)}
                color="#16a34a"
                background="#d2e7d8"
              />
            </>
          )}
        </div>
      ) : null}

      <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
        <SelectBox label="View" value={clientView ? clientId : "all"} onChange={chooseClient} wide>
          <option value="all">Service Catalog</option>
          {clients.length ? (
            <optgroup label="A client's services">
              {clients.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.companyName}
                </option>
              ))}
            </optgroup>
          ) : null}
        </SelectBox>
        <SelectBox label="Plan" value={plan} onChange={(value) => setPlan(value as ServicePlan | "all")}>
          <option value="all">All Plans</option>
          {SERVICE_PLAN_KEYS.map((key) => (
            <option key={key} value={key}>
              {SERVICE_PLANS[key]}
            </option>
          ))}
        </SelectBox>
        {hasFilters ? (
          <button
            type="button"
            className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-[#4b5260] hover:bg-[#f3f4f6] hover:text-[#0b0c24]"
            onClick={clearFilters}
          >
            <RotateCcw size={13} strokeWidth={2} /> Clear
          </button>
        ) : null}
        <div
          className="flex h-9.5 w-full items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af] xl:ml-auto xl:max-w-80"
          role="search"
        >
          <Search size={15} strokeWidth={2} className="shrink-0 text-[#1f2530]" />
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
              <X size={14} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      </div>

      {!loaded ? (
        <div role="alert" className={errorBannerClass}>
          {loadError ?? (clientView ? "Could not load this client's services." : "Could not load services.")} Please refresh the page to try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className={`${cardClass} p-3.5 transition-opacity ${isNavigating ? "opacity-60" : ""}`} aria-busy={isNavigating}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-11 text-center">
                <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
                  {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <Layers size={24} strokeWidth={1.8} />}
                </div>
                <div className="text-lg font-semibold text-[#0b0c24]">
                  {hasFilters ? "No services match these filters" : clientView ? `${clientName} has no services yet` : "No services in the catalog"}
                </div>
                <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                  {hasFilters
                    ? "Try a different plan or search."
                    : clientView
                      ? "Pick the services this client takes from the catalog."
                      : canManage
                        ? "Add the first service BayShore offers, with its sub-services and prices."
                        : "A super admin adds the services BayShore offers."}
                </div>
                {hasFilters ? (
                  <button type="button" className={`${darkButtonClass} cursor-pointer px-4.5 py-2.25`} onClick={clearFilters}>
                    <RotateCcw size={13} strokeWidth={2} /> Clear filters
                  </button>
                ) : clientView ? (
                  canAssign && catalog ? (
                    <button type="button" className={`${darkButtonClass} cursor-pointer px-4.5 py-2.25`} onClick={() => setAssigning(true)}>
                      <Plus size={13} strokeWidth={2.5} /> Assign Services
                    </button>
                  ) : null
                ) : canManage ? (
                  <Link href="/services/add" className={`${darkButtonClass} px-4.5 py-2.25`}>
                    <Plus size={13} strokeWidth={2.5} /> Add Service
                  </Link>
                ) : null}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={`${thClass} rounded-l-lg`}>Service</th>
                        <th className={thClass}>Plan</th>
                        <th className={thClass}>Sub-services</th>
                        {clientView ? null : <th className={thClass}>Clients</th>}
                        <th className={`${thClass} text-right`}>Monthly</th>
                        <th className={`${thClass} rounded-r-lg text-right`}>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => {
                        const { service, included } = row;
                        const Icon = serviceIconOf(service);
                        const open = openId === service._id;
                        const toggle = () => setOpenId(open ? null : service._id);

                        return (
                          <Fragment key={service._id}>
                            {/* The whole row opens the service; the chevron is the keyboard way in. */}
                            <tr className={`cursor-pointer ${open ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]"}`} onClick={toggle}>
                              <td className={tdClass}>
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: serviceColorOf(service) }}>
                                    <Icon size={16} strokeWidth={2} />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block max-w-72 truncate font-medium text-[#1f2530]" title={service.title}>
                                      {service.title}
                                    </span>
                                    {service.description ? (
                                      <span className="mt-0.5 block max-w-72 truncate text-[11px] text-[#6b7280]" title={service.description}>
                                        {service.description}
                                      </span>
                                    ) : null}
                                  </span>
                                </div>
                              </td>
                              <td className={tdClass}>
                                <span className="inline-block rounded-md bg-[#f3f4f6] px-2.5 py-1 text-[11px] font-medium text-[#4b5260]">
                                  {SERVICE_PLANS[service.plan] ?? service.plan}
                                </span>
                              </td>
                              <td className={`${tdClass} text-[#4b5260]`}>
                                {included ? `${included.length} of ${service.subServices.length}` : plural(service.subServices.length, "item")}
                              </td>
                              {clientView ? null : (
                                <td className={`${tdClass} text-[#4b5260]`}>
                                  {row.clientCount ? (
                                    <span className="inline-flex items-center gap-1.25">
                                      <Users size={13} strokeWidth={2} /> {row.clientCount}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              )}
                              <td className={`${tdClass} text-right`}>
                                <span className="text-[13.5px] font-semibold text-[#0b0c24]">{dollars(row.price)}</span>
                                <span className="text-[11px] text-[#6b7280]">/mo</span>
                              </td>
                              {/* Clicks on the buttons act on them, not on the row. */}
                              <td className={`${tdClass} text-right`} onClick={(event) => event.stopPropagation()}>
                                <div className="inline-flex items-center justify-end gap-1">
                                  {canManage && !clientView ? (
                                    <>
                                      <Link href={`/services/${service._id}/edit`} className={iconButtonClass} aria-label={`Edit ${service.title}`}>
                                        <Pencil size={15} strokeWidth={2} />
                                      </Link>
                                      <DeleteService service={service} />
                                    </>
                                  ) : null}
                                  <button
                                    type="button"
                                    className={iconButtonClass}
                                    aria-expanded={open}
                                    aria-label={`${open ? "Hide" : "Show"} the sub-services of ${service.title}`}
                                    onClick={toggle}
                                  >
                                    <ChevronDown size={16} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {open ? (
                              <tr>
                                <td colSpan={columns} className="border-b border-[#eef0f2] bg-[#f9fafb] px-3 pt-1 pb-3.5">
                                  <ServiceDetails service={service} price={row.price} included={included} />
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-[12px] text-[#1f2530]">
                  <span>
                    Showing {filtered.length} of {plural(rows.length, "service")}
                  </span>
                  {clientView ? (
                    <span>
                      Total <span className="font-semibold text-[#0b0c24]">{dollars(filtered.reduce((sum, row) => sum + row.price, 0))}</span>
                      <span className="text-[#6b7280]">/mo</span>
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4.5">
            {clientView ? (
              <BreakdownCard
                icon={PieChart}
                title="Where the Payment Goes"
                sub={`${dollars(monthlyTotal)} a month`}
                empty="Nothing to show until this client has a service."
                rows={rows.map((row) => ({
                  key: row.service._id,
                  label: row.service.title,
                  color: serviceColorOf(row.service),
                  amount: row.price,
                  text: `${dollars(row.price)} · ${monthlyTotal ? Math.round((row.price / monthlyTotal) * 100) : 0}%`,
                }))}
              />
            ) : (
              <BreakdownCard
                icon={Users}
                title="Who Takes What"
                sub="Clients on each service"
                empty="No service has been assigned to a client yet. Use Assign to Client to give a client their services."
                rows={services.map((service) => ({
                  key: service._id,
                  label: service.title,
                  color: serviceColorOf(service),
                  amount: service.clientCount,
                  text: `${plural(service.clientCount, "client")}${service.monthlyRevenue ? ` · ${dollars(service.monthlyRevenue)}` : ""}`,
                }))}
              />
            )}
          </div>
        </div>
      )}

      {assigning && catalog ? (
        <AssignServices
          clients={clients}
          services={services}
          locked={clientView && clientServices ? { clientId, current: clientServices.services } : undefined}
          onClose={closeAssign}
          onSaved={(id) => {
            setAssigning(false);
            // From the catalog, go and look at what the client now has. In the
            // client's view the saved action has already refreshed the page.
            if (!clientView) chooseClient(id);
          }}
        />
      ) : null}
    </div>
  );
};

export default ServicesList;
