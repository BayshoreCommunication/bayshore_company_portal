"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Handshake,
  Loader2,
  Pencil,
  PhoneCall,
  PieChart,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Trash2,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  deleteLeadAction,
  listLeadsAction,
  type LeadListData,
  type LeadListItem,
  type LeadStatus,
} from "@/app/actions/leads";
import { pageItems } from "@/component/shared/pageItems";
import TrendIndicator from "@/component/shared/TrendIndicator";
import {
  LEAD_CHANNELS as CHANNELS,
  LEAD_CHANNEL_KEYS,
  LEAD_PERIODS,
  LEAD_SOURCES as SOURCES,
  LEAD_STATUSES as STATUSES,
  LEAD_STATUS_KEYS,
  avatarColorOf,
  clientNameOf,
  formatDate,
  initialsOf,
  leadsHref,
  periodRange,
  type LeadFilters,
} from "./leadUi";

const SEARCH_DELAY_MS = 400;
// The backend's page-size cap, and how many pages an export will walk.
const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_PAGES = 50;

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3 text-[12px] whitespace-nowrap text-[#1f2530]";

const pageButtonClass = "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] font-medium no-underline";
const iconButtonClass =
  "inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md text-[#4b5260] no-underline hover:bg-[#f3f4f6] hover:text-[#0b0c24]";

type ClientOption = { _id: string; companyName: string };
type Summary = LeadListData["summary"];

// ── Small pieces ─────────────────────────────────────────────────────────────

const SelectBox = ({
  label,
  value,
  onChange,
  active = value !== "all",
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  // Whether the list is narrowed by this box; defaults to "anything but all".
  active?: boolean;
  children: React.ReactNode;
}) => (
  <div className="relative w-full sm:w-42">
    <select
      // A chosen filter gets a darker border so it's clear the list is narrowed.
      className={`${inputClass} ${active ? "border-[#0b0c24]" : "border-[#e2e5e9]"}`}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
    <ChevronDown size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#1f2530]" />
  </div>
);

// Percent change against the period before; nothing to compare with when it had none.
const trendOf = (current: number, previous?: number) =>
  previous === undefined || previous === 0
    ? undefined
    : {
        trend: (current >= previous ? "up" : "down") as "up" | "down",
        value: `${Math.abs(Math.round(((current - previous) / previous) * 100))}%`,
      };

const SummaryTile = ({
  icon: Icon,
  label,
  sub,
  value,
  color,
  background,
  trend,
  compareLabel,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  value: number;
  color: string;
  background: string;
  trend?: { trend: "up" | "down"; value: string };
  compareLabel?: string;
}) => (
  <div className={`${cardClass} px-4 pt-3.5 pb-4`}>
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background, color }}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold text-[#0b0c24] uppercase">{label}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{sub}</div>
      </div>
    </div>
    <div className="mt-3 flex items-end justify-between gap-2">
      <div className="text-[30px] leading-none font-semibold text-[#0b0c24]">{value}</div>
      {trend ? <TrendIndicator trend={trend.trend} value={trend.value} label={compareLabel} /> : null}
    </div>
  </div>
);

const qualifiedOrFurther = (summary: Summary) => summary.qualified + summary.consultation_set + summary.converted;

const SummaryTiles = ({ summary, previous, compareLabel }: { summary: Summary; previous?: Summary; compareLabel?: string }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <SummaryTile
      icon={Users}
      label="Total Leads"
      sub="Captured in this period"
      value={summary.total}
      color="#2f5fd8"
      background="#d9e0ef"
      trend={trendOf(summary.total, previous?.total)}
      compareLabel={compareLabel}
    />
    {/* More leads waiting isn't good news, so this one shows no ▲/▼. */}
    <SummaryTile icon={PhoneCall} label="Awaiting Contact" sub="New, not called back yet" value={summary.new} color="#4f46e5" background="#e3e7fb" />
    <SummaryTile
      icon={BadgeCheck}
      label="Qualified"
      sub="Qualified or further along"
      value={qualifiedOrFurther(summary)}
      color="#7c3aed"
      background="#ece4fb"
      trend={trendOf(qualifiedOrFurther(summary), previous ? qualifiedOrFurther(previous) : undefined)}
      compareLabel={compareLabel}
    />
    <SummaryTile
      icon={Handshake}
      label="Became Clients"
      sub={summary.total ? `${Math.round((summary.converted / summary.total) * 100)}% of all leads` : "No leads yet"}
      value={summary.converted}
      color="#16a34a"
      background="#d2e7d8"
      trend={trendOf(summary.converted, previous?.converted)}
      compareLabel={compareLabel}
    />
  </div>
);

// ── Search box ───────────────────────────────────────────────────────────────

// Sends the search to the URL a moment after typing stops (or on Enter).
const SearchBox = ({ search, onSearch }: { search: string; onSearch: (value: string) => void }) => {
  const [text, setText] = useState(search);
  // What this box last sent, so a change to `search` we didn't cause (Back button,
  // "Clear filters") can be told apart from our own.
  const [pushed, setPushed] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (search !== seenSearch) {
    setSeenSearch(search);
    if (search !== pushed) {
      setText(search);
      setPushed(search);
    }
  }

  const apply = (value: string) => {
    clearTimeout(timer.current);
    const next = value.trim();
    setPushed(next);
    onSearch(next);
  };

  const handleChange = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apply(value), SEARCH_DELAY_MS);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") apply(text);
    if (event.key === "Escape" && text) {
      setText("");
      apply("");
    }
  };

  return (
    <div
      className="flex h-9.5 w-full items-center gap-2.5 rounded-lg border border-[#e2e5e9] bg-white px-3 focus-within:border-[#9aa3af] xl:ml-auto xl:max-w-72"
      role="search"
    >
      <Search size={15} strokeWidth={2} className="shrink-0 text-[#1f2530]" />
      <input
        type="search"
        placeholder="Search name, email or phone..."
        aria-label="Search leads"
        autoComplete="off"
        className="w-full border-none bg-transparent text-[12px] text-[#1f2530] outline-none placeholder:text-[#6b7280] [&::-webkit-search-cancel-button]:hidden"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {text ? (
        <button
          type="button"
          className="inline-flex cursor-pointer text-[#6b7280] hover:text-[#0b0c24]"
          aria-label="Clear search"
          onClick={() => {
            setText("");
            apply("");
          }}
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
};

// ── One row's delete button ──────────────────────────────────────────────────

// Asks once in place before deleting, so a stray click can't remove a lead.
const DeleteLead = ({ lead }: { lead: LeadListItem }) => {
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
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className={`${iconButtonClass} hover:bg-[#fdecec] hover:text-[#b42318]`}
        aria-label={`Delete ${lead.fullName}`}
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

// ── CSV export ───────────────────────────────────────────────────────────────

// Quote every cell so commas, quotes and line breaks in a value can't break a row.
const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

// Every lead matching the current filters, across all pages — not just the one on screen.
const exportCsv = async (filters: LeadFilters) => {
  const range = periodRange(filters.period);
  const rows: LeadListItem[] = [];
  for (let page = 1; page <= EXPORT_MAX_PAGES; page++) {
    const result = await listLeadsAction({
      page,
      limit: EXPORT_PAGE_SIZE,
      client: filters.client === "all" ? undefined : filters.client,
      status: filters.status,
      channel: filters.channel,
      caseType: filters.caseType,
      search: filters.q,
      from: range.from,
      to: range.to,
    });
    if (!result.ok || !result.data) throw new Error(result.error ?? "Failed to fetch leads.");
    rows.push(...result.data.leads);
    if (!result.data.pagination.hasNextPage) break;
  }

  const lines = [
    ["Name", "Phone", "Email", "Client", "Case Type", "Source", "Channel", "Received", "Status", "Notes"],
    ...rows.map((lead) => [
      lead.fullName,
      lead.phone ?? "",
      lead.email ?? "",
      clientNameOf(lead.client),
      lead.caseType,
      SOURCES[lead.source]?.label ?? lead.source,
      CHANNELS[lead.channel]?.label ?? lead.channel,
      lead.receivedAt.slice(0, 10),
      STATUSES[lead.status]?.label ?? lead.status,
      lead.notes ?? "",
    ]),
  ].map((row) => row.map(csvCell).join(","));

  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  return rows.length;
};

// ── Side cards ───────────────────────────────────────────────────────────────

const BreakdownCard = ({
  icon: Icon,
  title,
  sub,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  rows: { key: string; label: string; color: string; count: number }[];
}) => {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className={`${cardClass} p-4.5`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9e0ef] text-[#2f5fd8]">
          <Icon size={17} strokeWidth={2} />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-[#0b0c24]">{title}</div>
          <div className="mt-0.5 text-[11px] text-[#6b7280]">{sub}</div>
        </div>
      </div>
      {total === 0 ? (
        <div className="py-2 text-[12px] text-[#6b7280]">No leads in this period.</div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 font-medium text-[#1f2530]">
                  <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                  {row.label}
                </span>
                <span className="text-[#4b5260]">
                  <span className="font-semibold text-[#0b0c24]">{row.count}</span> · {Math.round((row.count / total) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f3f4f6]">
                <div className="h-full rounded-full" style={{ width: `${(row.count / max) * 100}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Page numbers ─────────────────────────────────────────────────────────────

const Pagination = ({ pagination, filters }: { pagination: LeadListData["pagination"]; filters: LeadFilters }) => {
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const href = (target: number) => leadsHref({ ...filters, page: target });
  const idle = "border-[#e2e5e9] bg-white text-[#1f2530] hover:bg-[#f3f4f6]";
  const disabled = `${pageButtonClass} border-[#e2e5e9] bg-white text-[#0b0c24] opacity-35`;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-[12px] text-[#1f2530]">
      <span>
        Showing {from}–{to} of {total} {total === 1 ? "lead" : "leads"}
      </span>
      {/* One page of results needs no page buttons. */}
      {totalPages > 1 ? (
        <nav className="flex items-center gap-1.5" aria-label="Leads pagination">
          {hasPreviousPage ? (
            <Link className={`${pageButtonClass} ${idle}`} href={href(page - 1)} rel="prev" aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2.25} />
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true" aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2.25} />
            </span>
          )}
          {pageItems(page, totalPages).map((item) =>
            typeof item === "string" ? (
              <span key={item} className="px-1 text-[#6b7280]" aria-hidden="true">
                …
              </span>
            ) : (
              <Link
                key={item}
                className={`${pageButtonClass} ${item === page ? "border-[#0b0c24] bg-[#0b0c24] text-white" : idle}`}
                href={href(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Link>
            ),
          )}
          {hasNextPage ? (
            <Link className={`${pageButtonClass} ${idle}`} href={href(page + 1)} rel="next" aria-label="Next page">
              <ChevronRight size={16} strokeWidth={2.25} />
            </Link>
          ) : (
            <span className={disabled} aria-disabled="true" aria-label="Next page">
              <ChevronRight size={16} strokeWidth={2.25} />
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
};

// ── The Leads page ───────────────────────────────────────────────────────────

// Every lead the signed-in staff member can see, filtered and paged by the backend.
// The filters live in the URL, so a filtered view can be shared or bookmarked.
// `data` is missing when the list couldn't be loaded; `error` says why.
const LeadsList = ({
  data,
  error,
  previousSummary,
  compareLabel,
  filters,
  clients,
  canWrite,
  canDelete,
}: {
  data?: LeadListData;
  error?: string;
  previousSummary?: Summary;
  compareLabel?: string;
  filters: LeadFilters;
  clients: ClientOption[];
  canWrite: boolean;
  canDelete: boolean;
}) => {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const hasFilters =
    filters.client !== "all" || filters.status !== "all" || filters.channel !== "all" || filters.caseType !== "all" || filters.q !== "";
  const showActions = canWrite || canDelete;
  // One client's page doesn't need a column repeating its name.
  const showClient = filters.client === "all";

  const navigate = (patch: Partial<LeadFilters>) =>
    startNavigation(() => router.replace(leadsHref({ ...filters, ...patch, page: undefined }), { scroll: false }));

  const clearFilters = () => navigate({ client: "all", status: "all", channel: "all", caseType: "all", q: "" });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const count = await exportCsv(filters);
      toast.success(`Exported ${count} ${count === 1 ? "lead" : "leads"}`);
    } catch (exportError) {
      toast.error((exportError as Error).message || "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const periodLabel = LEAD_PERIODS[filters.period];
  // Case types are typed in per firm, so the filter offers the ones in use — plus the
  // chosen one, in case it isn't in this period's list (a shared link, a new period).
  const caseTypeOptions = [
    ...new Set([...(data?.caseTypes ?? []), ...(filters.caseType !== "all" ? [filters.caseType] : [])]),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Leads</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">Every inquiry captured for your clients, from first contact to signed case.</div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-white"
            disabled={!data || data.pagination.total === 0 || isExporting}
            aria-busy={isExporting}
            onClick={handleExport}
          >
            {isExporting ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : <Download size={14} strokeWidth={2} />}
            {isExporting ? "Exporting…" : "Export CSV"}
          </button>
          {canWrite ? (
            <Link
              href="/leads/add"
              className="flex h-9.5 items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
            >
              <Plus size={14} strokeWidth={2.5} /> Add Lead
            </Link>
          ) : null}
        </div>
      </div>

      {!data ? (
        <div role="alert" className="rounded-xl border border-[#f5c2c2] bg-[#fdecec] px-4 py-3 text-[12.5px] font-medium text-[#b42318]">
          {error ?? "Could not load leads."} Please refresh the page to try again.
        </div>
      ) : (
        <>
          <SummaryTiles summary={data.summary} previous={previousSummary} compareLabel={compareLabel} />

          <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
            <SelectBox
              label="Period"
              value={filters.period}
              active={false}
              onChange={(value) => navigate({ period: value as LeadFilters["period"] })}
            >
              {(Object.keys(LEAD_PERIODS) as LeadFilters["period"][]).map((key) => (
                <option key={key} value={key}>
                  {LEAD_PERIODS[key]}
                </option>
              ))}
            </SelectBox>
            {clients.length > 1 ? (
              <SelectBox label="Client" value={filters.client} onChange={(value) => navigate({ client: value })}>
                <option value="all">All Clients</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.companyName}
                  </option>
                ))}
              </SelectBox>
            ) : null}
            <SelectBox label="Lead status" value={filters.status} onChange={(value) => navigate({ status: value as LeadFilters["status"] })}>
              <option value="all">All Statuses</option>
              {LEAD_STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {STATUSES[key].label}
                </option>
              ))}
            </SelectBox>
            <SelectBox label="Lead source" value={filters.channel} onChange={(value) => navigate({ channel: value as LeadFilters["channel"] })}>
              <option value="all">All Sources</option>
              {LEAD_CHANNEL_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CHANNELS[key].label}
                </option>
              ))}
            </SelectBox>
            {caseTypeOptions.length ? (
              <SelectBox label="Case type" value={filters.caseType} onChange={(value) => navigate({ caseType: value })}>
                <option value="all">All Case Types</option>
                {caseTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectBox>
            ) : null}
            {hasFilters ? (
              <button
                type="button"
                className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-[#4b5260] hover:bg-[#f3f4f6] hover:text-[#0b0c24]"
                onClick={clearFilters}
              >
                <RotateCcw size={13} strokeWidth={2} /> Clear
              </button>
            ) : null}
            <SearchBox search={filters.q} onSearch={(q) => navigate({ q })} />
          </div>

          <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className={`${cardClass} p-3.5 transition-opacity ${isNavigating ? "opacity-60" : ""}`} aria-busy={isNavigating}>
              {data.leads.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-11 text-center">
                  <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
                    {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <Users size={24} strokeWidth={1.8} />}
                  </div>
                  <div className="text-lg font-semibold text-[#0b0c24]">
                    {hasFilters ? "No leads match these filters" : `No leads for ${periodLabel.toLowerCase()}`}
                  </div>
                  <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                    {hasFilters
                      ? "Try a different client, status, source, case type or search."
                      : "Pick a longer period, or add a lead that came in by phone, referral or walk-in."}
                  </div>
                  {hasFilters ? (
                    <button
                      type="button"
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4.5 py-2.25 text-[12.5px] font-medium text-white hover:bg-[#1e2140]"
                      onClick={clearFilters}
                    >
                      <RotateCcw size={13} strokeWidth={2} /> Clear filters
                    </button>
                  ) : canWrite ? (
                    <Link
                      href="/leads/add"
                      className="flex items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4.5 py-2.25 text-[12.5px] font-medium text-white no-underline hover:bg-[#1e2140]"
                    >
                      <Plus size={13} strokeWidth={2.5} /> Add Lead
                    </Link>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr>
                          <th className={`${thClass} rounded-l-lg`}>Lead</th>
                          {showClient ? <th className={thClass}>Client</th> : null}
                          <th className={thClass}>Case Type</th>
                          <th className={thClass}>Source</th>
                          <th className={thClass}>Received</th>
                          <th className={`${thClass} ${showActions ? "" : "rounded-r-lg"}`}>Status</th>
                          {showActions ? (
                            <th className={`${thClass} rounded-r-lg text-right`}>
                              <span className="sr-only">Actions</span>
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {data.leads.map((lead) => {
                          const statusMeta = STATUSES[lead.status];
                          const source = SOURCES[lead.source];
                          const contact = lead.phone ?? lead.email;

                          return (
                            <tr key={lead._id}>
                              <td className={tdClass}>
                                <div className="flex items-center gap-3">
                                  <span
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                                    style={{ background: avatarColorOf(lead.fullName) }}
                                  >
                                    {initialsOf(lead.fullName)}
                                  </span>
                                  <span className="min-w-0">
                                    {canWrite ? (
                                      <Link
                                        href={`/leads/${lead._id}/edit`}
                                        className="block max-w-56 truncate font-medium text-[#1f2530] no-underline hover:text-[#2f5fd8]"
                                        title={lead.fullName}
                                      >
                                        {lead.fullName}
                                      </Link>
                                    ) : (
                                      <span className="block max-w-56 truncate font-medium text-[#1f2530]" title={lead.fullName}>
                                        {lead.fullName}
                                      </span>
                                    )}
                                    {contact ? <span className="mt-0.5 block text-[11px] text-[#6b7280]">{contact}</span> : null}
                                  </span>
                                </div>
                              </td>
                              {showClient ? (
                                <td className={`${tdClass} max-w-44 truncate`} title={clientNameOf(lead.client)}>
                                  {clientNameOf(lead.client) || "—"}
                                </td>
                              ) : null}
                              <td className={`${tdClass} max-w-44 truncate`} title={lead.caseType}>
                                {lead.caseType}
                              </td>
                              <td className={tdClass}>
                                <span className="inline-flex items-center gap-2">
                                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHANNELS[lead.channel]?.color }} />
                                  {source?.label ?? lead.source}
                                </span>
                              </td>
                              <td className={`${tdClass} text-[#4b5260]`}>{formatDate(lead.receivedAt)}</td>
                              <td className={tdClass}>
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
                                  style={{ background: statusMeta.background, color: statusMeta.color }}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta.dot }} />
                                  {statusMeta.label}
                                </span>
                              </td>
                              {showActions ? (
                                <td className={`${tdClass} text-right`}>
                                  <div className="inline-flex items-center justify-end gap-1">
                                    {canWrite ? (
                                      <Link href={`/leads/${lead._id}/edit`} className={iconButtonClass} aria-label={`Edit ${lead.fullName}`}>
                                        <Pencil size={15} strokeWidth={2} />
                                      </Link>
                                    ) : null}
                                    {canDelete ? <DeleteLead lead={lead} /> : null}
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination pagination={data.pagination} filters={filters} />
                </>
              )}
            </div>

            <div className="flex flex-col gap-4.5">
              <BreakdownCard
                icon={PieChart}
                title="Where Leads Come From"
                sub={periodLabel}
                rows={LEAD_CHANNEL_KEYS.map((key) => ({ key, ...CHANNELS[key], count: data.channels[key] }))}
              />
              <BreakdownCard
                icon={Workflow}
                title="Pipeline"
                sub={`Where ${periodLabel.toLowerCase()}'s leads are now`}
                rows={LEAD_STATUS_KEYS.map((key: LeadStatus) => ({
                  key,
                  label: STATUSES[key].label,
                  color: STATUSES[key].dot,
                  count: data.summary[key],
                }))}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadsList;
