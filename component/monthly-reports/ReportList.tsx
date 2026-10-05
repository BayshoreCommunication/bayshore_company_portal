"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  Clock,
  Eye,
  FilePen,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import { deleteReportAction, type ReportListData, type ReportListItem } from "@/app/actions/reports";
import { avatarColorFor, initialsOf } from "@/component/clients/clientUi";
import { pageItems } from "@/component/shared/pageItems";
import {
  actionWrap,
  btnDraft,
  clientAvatarBadge,
  clientFlex,
  dashMetricLbl,
  dashPendingSub,
  emptyAction,
  emptyDesc,
  emptyIcon,
  emptyStateBare,
  emptyTitle,
  filterLeftGroup,
  filterSearchBox,
  filterSearchClear,
  filterSearchIcon,
  filterSearchInput,
  filterSelect,
  filtersCard,
  formErrorBanner,
  pageBtn,
  pageGap,
  paginationGroup,
  reportsTable,
  reportsTd,
  reportsTh,
  reportsTr,
  tableCard,
  tableFooter,
} from "@/component/shared/ui";
import {
  STATUS_BADGES,
  STATUS_OPTIONS,
  canDeleteReports,
  canWriteReports,
  clientIdOf,
  clientNameOf,
  formatDateTime,
  monthOptions,
  periodLabel,
  reportsHref,
} from "./reportUi";

const SEARCH_DELAY_MS = 400;

// "Create New Report" in the page header, like "Add Lead" and "Add Project".
const btnCreateReport =
  "flex h-9.5 items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4 text-[12.5px] font-medium whitespace-nowrap text-white no-underline hover:bg-[#1e2140]";

const btnCreateFirstReport =
  "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-[#0b1522] px-4.5 py-2.5 text-[13px] font-semibold text-white no-underline hover:bg-[#17263a]";

// A square icon-only button for the row actions, like the Content list.
const btnIconAction =
  "inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md border border-[#cbd6d0] bg-white text-[#273847] no-underline hover:border-[#0b1522] hover:bg-[#f1f5f3]";

export type ReportFilters = { client: string; month: string; status: string; search: string };

type ClientOption = { _id: string; companyName: string };

const personNameOf = (person: ReportListItem["createdBy"]) => (person && typeof person === "object" ? person.fullName : undefined);

// ── Summary cards — each one also filters the list to its status ────────────

const Stats = ({ summary, filters }: { summary: ReportListData["summary"]; filters: ReportFilters }) => {
  const cards = [
    {
      status: "",
      icon: FileText,
      color: "#2563eb",
      background: "#dbeafe",
      label: "TOTAL REPORTS",
      value: summary.total,
      note: "Weekly and monthly",
    },
    {
      status: "draft",
      icon: FilePen,
      color: "#64748b",
      background: "#eef2f6",
      label: "DRAFTS",
      value: summary.draft,
      note: "Still being written",
    },
    {
      status: "submitted",
      icon: Clock,
      color: "#d97706",
      background: "#fdf1de",
      label: "IN REVIEW",
      value: summary.submitted,
      note: "Waiting for a manager",
    },
    {
      status: "published",
      icon: BadgeCheck,
      color: "#16a34a",
      background: "#dcf3e2",
      label: "PUBLISHED",
      value: summary.published,
      note: summary.approved
        ? `${summary.approved} approved, not yet published`
        : summary.total
          ? `${Math.round((summary.published / summary.total) * 100)}% of total`
          : "Nothing published yet",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => {
        const active = filters.status === card.status;
        return (
          <Link
            key={card.label}
            href={reportsHref({ ...filters, q: filters.search, status: active && card.status ? "" : card.status })}
            aria-current={active ? "true" : undefined}
            className={`flex items-start gap-3 rounded-[10px] border bg-white px-4.5 py-4 no-underline transition-shadow hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)] ${
              active ? "border-[#94a3b8]" : "border-[#dbe3de]"
            }`}
          >
            <span
              className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg"
              style={{ background: card.background, color: card.color }}
            >
              <card.icon size={18} strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className={`${dashMetricLbl} block`}>{card.label}</span>
              <span className="mb-1.5 block text-[24px] font-bold text-[#0d1e2c]">{card.value}</span>
              <span className={`${dashPendingSub} block truncate`}>{card.note}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
};

// ── Client, month and status selects, and the search box ────────────────────

const FilterBar = ({ clients, client, month, status, search }: { clients: ClientOption[] } & ReportFilters) => {
  const router = useRouter();
  const [text, setText] = useState(search);
  // What this box last sent to the URL, so a change we didn't cause (Back, "Clear filters")
  // can be told apart from our own and followed instead of fought.
  const [pushed, setPushed] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const current = useRef({ client, month, status });

  useEffect(() => {
    current.current = { client, month, status };
  }, [client, month, status]);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (search !== seenSearch) {
    setSeenSearch(search);
    if (search !== pushed) {
      setText(search);
      setPushed(search);
    }
  }

  const go = (next: Partial<ReportFilters>) => router.replace(reportsHref({ ...current.current, q: pushed, ...next }));

  const applySearch = (value: string) => {
    clearTimeout(timer.current);
    const next = value.trim();
    setPushed(next);
    router.replace(reportsHref({ ...current.current, q: next }));
  };

  const handleChange = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => applySearch(value), SEARCH_DELAY_MS);
  };

  return (
    <div className={filtersCard}>
      <div className={filterLeftGroup}>
        <select className={filterSelect} aria-label="Client" value={client} onChange={(event) => go({ client: event.target.value })}>
          <option value="">All Clients</option>
          {clients.map((option) => (
            <option key={option._id} value={option._id}>
              {option.companyName}
            </option>
          ))}
        </select>
        <select className={filterSelect} aria-label="Report month" value={month} onChange={(event) => go({ month: event.target.value })}>
          <option value="">All Dates</option>
          {monthOptions(month || undefined).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select className={filterSelect} aria-label="Status" value={status} onChange={(event) => go({ status: event.target.value })}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className={filterSearchBox}>
        <span className={filterSearchIcon}>
          <Search size={13} strokeWidth={2} />
        </span>
        <input
          type="search"
          className={filterSearchInput}
          placeholder="Search client or report..."
          aria-label="Search reports"
          autoComplete="off"
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") applySearch(text);
            if (event.key === "Escape" && text) {
              setText("");
              applySearch("");
            }
          }}
        />
        {text ? (
          <button type="button" className={filterSearchClear} aria-label="Clear search" onClick={() => { setText(""); applySearch(""); }}>
            <X size={13} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

// ── Delete, from a row ───────────────────────────────────────────────────────

// A red icon button, like the Content list's: confirm, then it spins until the
// refreshed list drops the row.
const DeleteReport = ({ reportId, name }: { reportId: string; name: string }) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    setDeleting(true);
    const result = await deleteReportAction(reportId);
    if (!result.ok) {
      setDeleting(false);
      toast.error(result.error ?? "Failed to delete report.");
      return;
    }
    toast.success("Report deleted successfully");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-busy={deleting}
      aria-label={`Delete ${name}`}
      className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md border border-[#f0c4c4] bg-white text-[#b42318] hover:border-[#b42318] hover:bg-[#fdecec] disabled:cursor-wait"
    >
      {deleting ? <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2} />}
    </button>
  );
};

// ── Nothing to list ──────────────────────────────────────────────────────────

const EmptyState = ({ filtered, canWrite }: { filtered: boolean; canWrite: boolean }) => {
  const Icon = filtered ? SearchX : FileText;

  return (
    <div className={emptyStateBare}>
      <div className={emptyIcon}>
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <div className={emptyTitle}>{filtered ? "No reports match your filters" : "No reports yet"}</div>
      <div className={emptyDesc}>
        {filtered
          ? "Try another client, month or status, or search for something else."
          : canWrite
            ? "Create the first report for one of your clients to see it here."
            : "Reports for the clients you have access to will show up here."}
      </div>
      {filtered ? (
        <Link href="/monthly-reports" className={`${btnDraft} ${emptyAction}`}>
          <RotateCcw size={13} strokeWidth={2} /> Clear filters
        </Link>
      ) : canWrite ? (
        <Link href="/monthly-reports/add" className={btnCreateFirstReport}>
          <Plus size={14} strokeWidth={2.5} /> Create New Report
        </Link>
      ) : null}
    </div>
  );
};

// ── The table ────────────────────────────────────────────────────────────────

const Table = ({
  data,
  filters,
  canWrite,
  canDelete,
}: {
  data: ReportListData;
  filters: ReportFilters;
  canWrite: boolean;
  canDelete: boolean;
}) => {
  const { reports, pagination } = data;
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const filtered = Boolean(filters.client || filters.month || filters.status || filters.search);
  const href = (target: number) => reportsHref({ ...filters, q: filters.search, page: target });
  const start = (page - 1) * limit;

  if (reports.length === 0) {
    return (
      <div className={tableCard}>
        <EmptyState filtered={filtered} canWrite={canWrite} />
      </div>
    );
  }

  return (
    <div className={tableCard}>
      <table className={reportsTable}>
        <thead>
          <tr>
            <th className={`${reportsTh} w-px pr-1`}>#</th>
            <th className={`${reportsTh} w-[34%]`}>Report</th>
            <th className={`${reportsTh} w-[19%]`}>Client</th>
            <th className={`${reportsTh} w-[15%]`}>Period</th>
            <th className={`${reportsTh} w-[11%]`}>Status</th>
            <th className={`${reportsTh} w-[13%]`}>Last Updated</th>
            <th className={`${reportsTh} w-[8%]`}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => {
            const name = clientNameOf(report.client) || "Unknown client";
            const badge = STATUS_BADGES[report.status];
            const weekly = report.periodType === "weekly";
            const open = `/monthly-reports/${report._id}/edit`;

            return (
              <tr key={report._id} className={reportsTr}>
                <td className={`${reportsTd} pr-1 text-[#64748b]`}>{start + index + 1}</td>
                <td className={reportsTd}>
                  <div className={clientFlex}>
                    <span
                      className={`inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[7px] ${
                        weekly ? "bg-[#ede9fe] text-[#7c3aed]" : "bg-[#dbeafe] text-[#2563eb]"
                      }`}
                    >
                      <FileText size={15} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <Link href={open} className="block truncate font-bold text-[#17242f] no-underline hover:underline">
                        {report.title}
                      </Link>
                      <div className="mt-0.5 truncate text-[11px] text-[#7a8e9b]">by {personNameOf(report.createdBy) ?? "—"}</div>
                    </div>
                  </div>
                </td>
                <td className={reportsTd}>
                  <div className={clientFlex}>
                    <div className={clientAvatarBadge} style={{ background: avatarColorFor(clientIdOf(report.client)) }}>
                      {initialsOf(name)}
                    </div>
                    <span className="truncate">{name}</span>
                  </div>
                </td>
                <td className={reportsTd}>
                  <div className="whitespace-nowrap">{periodLabel(report)}</div>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.75 py-px text-[10px] font-bold ${
                      weekly ? "bg-[#ede9fe] text-[#7c3aed]" : "bg-[#dbeafe] text-[#2563eb]"
                    }`}
                  >
                    {weekly ? <CalendarRange size={10} strokeWidth={2.5} /> : <CalendarDays size={10} strokeWidth={2.5} />}
                    {weekly ? "Weekly" : "Monthly"}
                  </span>
                </td>
                <td className={reportsTd}>
                  <span className={badge.badge}>
                    <span className={badge.dot} /> {badge.label}
                  </span>
                </td>
                <td className={`${reportsTd} text-[#64748b]`}>{formatDateTime(report.updatedAt)}</td>
                <td className={reportsTd}>
                  <div className={actionWrap}>
                    <Link href={open} className={btnIconAction} aria-label={`${canWrite ? "Edit" : "View"} ${report.title}`}>
                      {canWrite ? <Pencil size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
                    </Link>
                    {canDelete ? <DeleteReport reportId={report._id} name={report.title} /> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={tableFooter}>
        <div>
          Showing {start + 1}–{start + reports.length} of {total} report{total === 1 ? "" : "s"}
        </div>
        {totalPages > 1 ? (
          <nav className={paginationGroup} aria-label="Reports pagination">
            {hasPreviousPage ? (
              <Link className={pageBtn({ link: true })} href={href(page - 1)} rel="prev" aria-label="Previous page">
                ‹
              </Link>
            ) : (
              <span className={pageBtn()} aria-disabled="true" aria-label="Previous page">
                ‹
              </span>
            )}
            {pageItems(page, totalPages).map((item) =>
              typeof item === "string" ? (
                <span className={pageGap} key={item} aria-hidden="true">
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  className={pageBtn({ active: item === page, link: true })}
                  href={href(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Link>
              ),
            )}
            {hasNextPage ? (
              <Link className={pageBtn({ link: true })} href={href(page + 1)} rel="next" aria-label="Next page">
                ›
              </Link>
            ) : (
              <span className={pageBtn()} aria-disabled="true" aria-label="Next page">
                ›
              </span>
            )}
          </nav>
        ) : null}
      </div>
    </div>
  );
};

// ── The Monthly Reports page ─────────────────────────────────────────────────

// Every report the signed-in staff member can see, filtered and paged by the backend.
// The filters live in the URL, so a filtered view can be shared or bookmarked.
// `data` is missing when the list couldn't be loaded; `error` says why.
const ReportList = ({
  data,
  error,
  filters,
  clients,
  role,
}: {
  data?: ReportListData;
  error?: string;
  filters: ReportFilters;
  clients: ClientOption[];
  role: string;
}) => {
  const canWrite = canWriteReports(role);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Monthly Reports</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">View, edit and manage weekly and monthly performance reports for your clients.</div>
        </div>
        {canWrite ? (
          <Link href="/monthly-reports/add" className={btnCreateReport}>
            <Plus size={14} strokeWidth={2.5} /> Create New Report
          </Link>
        ) : null}
      </div>

      {data ? (
        <>
          <Stats summary={data.summary} filters={filters} />
          <FilterBar clients={clients} {...filters} />
          <Table data={data} filters={filters} canWrite={canWrite} canDelete={canDeleteReports(role)} />
        </>
      ) : (
        <div className={formErrorBanner} role="alert">
          {error ?? "Could not load reports."}
        </div>
      )}
    </>
  );
};

export default ReportList;
