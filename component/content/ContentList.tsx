"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, Eye, Layers, Pencil, Plus, RotateCcw, Search, SearchX, Trash2, X, Loader2 } from "lucide-react";
import { deleteContentAction, type ContentItem, type ContentListData } from "@/app/actions/content";
import { pageItems } from "@/component/shared/pageItems";
import {
  actionWrap,
  breadcrumbRow,
  breadcrumbs,
  btnDraft,
  clientAvatarBadge,
  clientFlex,
  clientNameText,
  clientStatCard,
  clientStatIcon,
  clientStatsGrid,
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
  pageBtn,
  pageDesc,
  pageGap,
  pageHeaderRow,
  pageTitle,
  paginationGroup,
  reportsTable,
  reportsTd,
  reportsTh,
  reportsTr,
  tableCard,
  tableFooter,
} from "@/component/shared/ui";
import { avatarColorFor, initialsOf } from "@/component/clients/clientUi";
import { CONTENT_KINDS, KIND_ORDER } from "./contentKinds";
import {
  BATCH_TYPE_LABELS,
  CONTENT_STATUS_VALUES,
  STATUS_BADGES,
  batchLabelOf,
  clientIdOf,
  clientNameOf,
  contentListHref,
  formatDateTime,
  monthChoices,
  personNameOf,
  type ContentListFilters,
} from "./contentUi";

const SEARCH_DELAY_MS = 400;

// "Add Content" in the sidebar's dark navy.
const btnAddContent =
  "inline-flex cursor-pointer items-center gap-1 rounded-md bg-[#0b1522] px-4.5 py-2.5 text-[13px] font-semibold text-white no-underline shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a]";

// A square icon-only button for the row actions.
const btnIconAction =
  "inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md border border-[#cbd6d0] bg-white text-[#273847] no-underline hover:border-[#0b1522] hover:bg-[#f1f5f3]";

const btnIconDelete =
  "inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md border border-[#f0c4c4] bg-white text-[#b42318] hover:border-[#b42318] hover:bg-[#fdecec] disabled:cursor-wait";

const EmptyState = ({ filtered, canWrite }: { filtered: boolean; canWrite: boolean }) => {
  const Icon = filtered ? SearchX : Layers;

  return (
    <div className={emptyStateBare}>
      <div className={emptyIcon}>
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <div className={emptyTitle}>{filtered ? "No content matches your filters" : "No content yet"}</div>
      <div className={emptyDesc}>
        {filtered
          ? "Try another client, type, status or month, or search for something else."
          : "Content added for your clients will show up here."}
      </div>
      {filtered ? (
        <Link href="/content" className={`${btnDraft} ${emptyAction}`}>
          <RotateCcw size={13} strokeWidth={2} /> Clear filters
        </Link>
      ) : canWrite ? (
        <Link href="/content/add" className={`${btnAddContent} ${emptyAction}`}>
          <Plus size={13} strokeWidth={2.5} /> Add Content
        </Link>
      ) : null}
    </div>
  );
};

// Filters live in the URL, so the server fetches exactly one page of results and a
// filtered view can be bookmarked or shared. The search box waits for a pause in typing.
const ContentList = ({
  data,
  filters,
  clients,
  canWrite,
  canDelete,
}: {
  data: ContentListData;
  filters: ContentListFilters;
  clients: { _id: string; companyName: string }[];
  canWrite: boolean;
  // Superadmins only.
  canDelete: boolean;
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const remove = async (item: ContentItem) => {
    if (!window.confirm(`Delete "${item.title}"? Its files are deleted too. This can't be undone.`)) return;
    // Stays set on success, so the icon spins until the refreshed list drops the row.
    setDeletingId(item._id);
    const result = await deleteContentAction(item._id);
    if (!result.ok) {
      setDeletingId(null);
      toast.error(result.error ?? "Couldn't delete this content.");
      return;
    }
    toast.success("Content deleted");
    startTransition(() => router.refresh());
  };
  const { items, summary, pagination } = data;
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const start = (page - 1) * limit;
  const hasFilters = Boolean(filters.client || filters.type || filters.status || filters.month || filters.batchType || filters.search);

  // The search box: typed text, what it last sent to the URL, and the URL value it last saw —
  // so a change it didn't cause (Back, "Clear filters") is followed rather than fought.
  const [text, setText] = useState(filters.search);
  const [pushed, setPushed] = useState(filters.search);
  const [seenSearch, setSeenSearch] = useState(filters.search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (filters.search !== seenSearch) {
    setSeenSearch(filters.search);
    if (filters.search !== pushed) {
      setText(filters.search);
      setPushed(filters.search);
    }
  }

  // Any filter change goes back to page 1.
  const go = (next: Partial<ContentListFilters>) => router.replace(contentListHref({ ...filters, search: pushed, ...next }));
  const hrefForPage = (target: number) => contentListHref({ ...filters, page: target });

  const applySearch = (value: string) => {
    clearTimeout(timer.current);
    const next = value.trim();
    setPushed(next);
    go({ search: next });
  };

  const onType = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => applySearch(value), SEARCH_DELAY_MS);
  };

  const stats = [
    {
      icon: Layers,
      iconBg: "#dbeafe",
      iconColor: "#2563eb",
      label: "TOTAL CONTENT",
      value: summary.total,
      note: `${summary.draft} draft${summary.draft === 1 ? "" : "s"} not sent yet`,
    },
    {
      icon: Clock,
      iconBg: "#fdf1de",
      iconColor: "#c8973a",
      label: "PENDING APPROVAL",
      value: summary.pending_approval,
      note: "Waiting on clients",
    },
    {
      icon: Pencil,
      iconBg: "#fbdada",
      iconColor: "#dc2626",
      label: "REVISION REQUESTED",
      value: summary.revision_requested,
      note: "Need changes",
    },
    {
      icon: CheckCircle2,
      iconBg: "#dcf3e2",
      iconColor: "#16a34a",
      label: "APPROVED",
      value: summary.approved,
      note: summary.total ? `${Math.round((summary.approved / summary.total) * 100)}% of total` : "—",
    },
  ];

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <b>Content</b>
        </div>
      </div>

      <div className={pageHeaderRow}>
        <div>
          <div className={pageTitle}>Content</div>
          <div className={pageDesc}>Everything prepared for your clients, and where each piece stands.</div>
        </div>
        {canWrite ? (
          <Link href={filters.client ? `/content/add?client=${filters.client}` : "/content/add"} className={btnAddContent}>
            <Plus size={13} strokeWidth={2.5} /> Add Content
          </Link>
        ) : null}
      </div>

      <div className={clientStatsGrid}>
        {stats.map((stat) => (
          <div className={clientStatCard} key={stat.label}>
            <div className={clientStatIcon} style={{ background: stat.iconBg, color: stat.iconColor }}>
              <stat.icon size={18} strokeWidth={2} />
            </div>
            <div>
              <div className={dashMetricLbl}>{stat.label}</div>
              <div className="mb-2 text-[24px] font-bold text-[#0d1e2c]">{stat.value}</div>
              <div className={dashPendingSub}>{stat.note}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={filtersCard}>
        <div className={`${filterLeftGroup} flex-wrap`}>
          <select
            className={filterSelect}
            aria-label="Client"
            value={filters.client}
            onChange={(event) => go({ client: event.target.value })}
          >
            <option value="">All Clients</option>
            {clients.map((option) => (
              <option key={option._id} value={option._id}>
                {option.companyName}
              </option>
            ))}
          </select>
          <select
            className={filterSelect}
            aria-label="Content type"
            value={filters.type}
            onChange={(event) => go({ type: event.target.value })}
          >
            <option value="">All Types</option>
            {KIND_ORDER.map((kind) => (
              <option key={kind} value={kind}>
                {CONTENT_KINDS[kind].label}
              </option>
            ))}
          </select>
          <select
            className={filterSelect}
            aria-label="Status"
            value={filters.status}
            onChange={(event) => go({ status: event.target.value })}
          >
            <option value="">All Statuses</option>
            {CONTENT_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {STATUS_BADGES[status].label}
              </option>
            ))}
          </select>
          <select className={filterSelect} aria-label="Month" value={filters.month} onChange={(event) => go({ month: event.target.value })}>
            <option value="">All Months</option>
            {monthChoices(filters.month || undefined).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className={filterSelect}
            aria-label="Batch"
            value={filters.batchType}
            onChange={(event) => go({ batchType: event.target.value })}
          >
            <option value="">All Batches</option>
            {Object.entries(BATCH_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
            placeholder="Search by title..."
            aria-label="Search content"
            autoComplete="off"
            value={text}
            onChange={(event) => onType(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applySearch(text);
              if (event.key === "Escape" && text) {
                setText("");
                applySearch("");
              }
            }}
          />
          {text ? (
            <button
              type="button"
              className={filterSearchClear}
              aria-label="Clear search"
              onClick={() => {
                setText("");
                applySearch("");
              }}
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={tableCard}>
        {items.length === 0 ? (
          <EmptyState filtered={hasFilters} canWrite={canWrite} />
        ) : (
          <>
            <table className={reportsTable}>
              <thead>
                <tr>
                  <th className={`${reportsTh} w-[4%]`}>#</th>
                  <th className={`${reportsTh} w-[28%]`}>Content</th>
                  <th className={`${reportsTh} w-[18%]`}>Client</th>
                  <th className={`${reportsTh} w-[11%]`}>Type</th>
                  <th className={`${reportsTh} w-[11%]`}>Batch</th>
                  <th className={`${reportsTh} w-[13%]`}>Status</th>
                  <th className={`${reportsTh} w-[13%]`}>Last Updated</th>
                  <th className={`${reportsTh} w-[12%]`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const name = clientNameOf(item.client) || "Unknown client";
                  const kind = CONTENT_KINDS[item.type] ?? CONTENT_KINDS.image;
                  const badge = STATUS_BADGES[item.status];
                  const files = item.files?.length ?? 0;

                  return (
                    <tr key={item._id} className={reportsTr}>
                      <td className={`${reportsTd} text-[#64748b]`}>{start + index + 1}</td>
                      <td className={reportsTd}>
                        <div className={clientFlex}>
                          <span
                            className="inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[7px]"
                            style={{ background: kind.background, color: kind.color }}
                          >
                            <kind.icon size={15} strokeWidth={2} />
                          </span>
                          <div className="min-w-0">
                            <Link href={`/content/${item._id}`} className={`${clientNameText} block truncate no-underline hover:underline`}>
                              {item.title}
                            </Link>
                            <div className="mt-0.5 text-[11px] text-[#7a8e9b]">
                              by {personNameOf(item.createdBy) ?? "—"}
                              {files > 1 ? ` · ${files} files` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={reportsTd}>
                        <div className={clientFlex}>
                          <div className={clientAvatarBadge} style={{ background: avatarColorFor(clientIdOf(item.client)) }}>
                            {initialsOf(name)}
                          </div>
                          <span>{name}</span>
                        </div>
                      </td>
                      <td className={reportsTd}>
                        <span
                          className="inline-block rounded-xl px-2.5 py-0.75 text-[11px] font-bold whitespace-nowrap"
                          style={{ background: kind.background, color: kind.color }}
                        >
                          {kind.label}
                        </span>
                      </td>
                      <td className={reportsTd}>
                        <div>{batchLabelOf(item)}</div>
                        {item.batchType && item.batchType !== "monthly" ? (
                          <div className="mt-0.5 text-[11px] text-[#7a8e9b]">{item.batchMonth}</div>
                        ) : null}
                      </td>
                      <td className={reportsTd}>
                        <span className={badge.badge}>
                          <span className={badge.dot} /> {badge.label}
                        </span>
                      </td>
                      <td className={`${reportsTd} text-[#64748b]`}>{formatDateTime(item.updatedAt)}</td>
                      <td className={reportsTd}>
                        <div className={actionWrap}>
                          <Link href={`/content/${item._id}`} className={btnIconAction} aria-label="View content">
                            <Eye size={14} strokeWidth={2} />
                          </Link>
                          {canWrite ? (
                            <Link href={`/content/edit?id=${item._id}`} className={btnIconAction} aria-label="Edit content">
                              <Pencil size={14} strokeWidth={2} />
                            </Link>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => remove(item)}
                              disabled={deletingId === item._id}
                              aria-busy={deletingId === item._id}
                              className={btnIconDelete}
                              aria-label="Delete content"
                            >
                              {deletingId === item._id ? (
                                <Loader2 size={14} strokeWidth={2.25} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} strokeWidth={2} />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={tableFooter}>
              <div>
                Showing {start + 1}–{start + items.length} of {total} item{total === 1 ? "" : "s"}
              </div>
              {/* One page of results needs no page buttons. */}
              {totalPages > 1 ? (
                <nav className={paginationGroup} aria-label="Content pagination">
                  {hasPreviousPage ? (
                    <Link className={pageBtn({ link: true })} href={hrefForPage(page - 1)} rel="prev" aria-label="Previous page">
                      ‹
                    </Link>
                  ) : (
                    <span className={pageBtn()} aria-disabled="true" aria-label="Previous page">
                      ‹
                    </span>
                  )}
                  {pageItems(page, totalPages).map((entry) =>
                    typeof entry === "string" ? (
                      <span className={pageGap} key={entry} aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <Link
                        key={entry}
                        className={pageBtn({ active: entry === page, link: true })}
                        href={hrefForPage(entry)}
                        aria-label={`Page ${entry}`}
                        aria-current={entry === page ? "page" : undefined}
                      >
                        {entry}
                      </Link>
                    ),
                  )}
                  {hasNextPage ? (
                    <Link className={pageBtn({ link: true })} href={hrefForPage(page + 1)} rel="next" aria-label="Next page">
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
          </>
        )}
      </div>
    </>
  );
};

export default ContentList;
