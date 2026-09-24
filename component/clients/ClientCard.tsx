"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, Hourglass, Plus, RotateCcw, Search, SearchX, UserCheck, UserX, Users, X } from "lucide-react";
import type { Client, ClientListData } from "@/app/actions/clients";
import { pageItems } from "@/component/shared/pageItems";
import {
  btnDraft,
  clientStatCard,
  clientStatIcon,
  clientStatsGrid,
  dashMetricLbl,
  dashPendingSub,
  dashSearchIcon,
  emptyAction,
  emptyDesc,
  emptyIcon,
  emptyState,
  emptyTitle,
  formErrorBanner,
  headlineRow,
  pageBtn,
  pageDesc,
  pageGap,
  pageTitle,
  searchClear,
  tagChip,
} from "@/component/shared/ui";
import { CLIENT_STATUS_OPTIONS, avatarColorFor, clientsHref, formatDate, initialsOf, statusClassName, statusLabel } from "./clientUi";

const SEARCH_DELAY_MS = 400;

// "Add Client" in the sidebar's dark navy, like "Add Content".
const btnAddClient =
  "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-[#0b1522] px-5 py-2.75 text-[13px] font-bold text-white no-underline shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a]";

// ── One client ───────────────────────────────────────────────────────────────

const Card = ({ client }: { client: Client }) => (
  <div className="flex flex-col rounded-[10px] border border-[#dbe3de] bg-white p-4.5">
    <div className="mb-2.5 flex items-start justify-between">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white"
        style={{ background: avatarColorFor(client._id) }}
      >
        {initialsOf(client.companyName)}
      </div>
      <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
    </div>
    <div className="text-[14.5px] font-bold text-[#0d1e2c]">{client.companyName}</div>
    <div className="mt-0.75 text-[11.5px] leading-normal text-[#7a8e9b]">
      {client.contactName}
      <br />
      {client.email}
    </div>
    <div className="mt-2.5 flex flex-wrap gap-2">
      {client.serviceTypes.map((service) => (
        <span className={tagChip} key={service}>
          {service}
        </span>
      ))}
    </div>
    <div className="mt-3.5 flex items-center justify-between border-t border-[#eef3ef] pt-3.5">
      <span className="inline-flex items-center gap-1.25 text-[10.5px] text-[#7a8e9b]">
        <Calendar size={12} strokeWidth={2} /> Client since {formatDate(client.startDate)}
      </span>
      <Link
        href={`/clients/${client._id}`}
        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-[#2563eb] px-3 py-1.75 text-[11px] font-bold text-white"
      >
        Select Client <ArrowRight size={13} strokeWidth={2.5} />
      </Link>
    </div>
  </div>
);

// ── Summary cards ────────────────────────────────────────────────────────────

const Stats = ({ summary }: { summary: ClientListData["summary"] }) => {
  const share = summary.total ? Math.round((summary.active / summary.total) * 100) : 0;
  const stats = [
    { icon: Users, iconBg: "#dbeafe", iconColor: "#2563eb", label: "TOTAL CLIENTS", value: summary.total, note: "Across all statuses" },
    { icon: UserCheck, iconBg: "#dcf3e2", iconColor: "#16a34a", label: "ACTIVE CLIENTS", value: summary.active, note: `${share}% of total` },
    { icon: Hourglass, iconBg: "#fdf1de", iconColor: "#c8973a", label: "PENDING ONBOARDING", value: summary.pending, note: "Need action" },
    {
      icon: UserX,
      iconBg: "#fbdada",
      iconColor: "#dc2626",
      label: "ON HOLD / CLOSED",
      value: summary.on_hold + summary.closed,
      note: `${summary.on_hold} on hold · ${summary.closed} closed`,
    },
  ];

  return (
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
  );
};

// ── Status tabs and search, kept in the URL ─────────────────────────────────

const Toolbar = ({ status, search, summary }: { status: string; search: string; summary: ClientListData["summary"] }) => {
  const router = useRouter();
  const [text, setText] = useState(search);
  // What this box last sent to the URL, so a change to `search` that we didn't
  // cause (Back button, "Clear filters", a link) can be told apart from our own.
  const [pushed, setPushed] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // The URL changed from somewhere else: follow it instead of fighting it.
  if (search !== seenSearch) {
    setSeenSearch(search);
    if (search !== pushed) {
      setText(search);
      setPushed(search);
    }
  }

  const applySearch = (value: string) => {
    clearTimeout(timer.current);
    const next = value.trim();
    setPushed(next);
    router.replace(clientsHref({ status: statusRef.current, q: next }));
  };

  const handleChange = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => applySearch(value), SEARCH_DELAY_MS);
  };

  const handleClear = () => {
    setText("");
    applySearch("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") applySearch(text);
    if (event.key === "Escape" && text) handleClear();
  };

  const tabs = [
    { value: "all", label: `All Clients (${summary.total})` },
    ...CLIENT_STATUS_OPTIONS.map((option) => ({ value: option.value as string, label: `${option.label} (${summary[option.value]})` })),
  ];

  return (
    <div className="flex flex-wrap items-stretch justify-between gap-3">
      <div className="flex gap-1.5 rounded-lg border border-[#dbe3de] bg-white p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={clientsHref({ status: tab.value, q: search })}
            className={`cursor-pointer whitespace-nowrap rounded-md px-3.5 py-1.75 text-[12.5px] font-semibold no-underline ${
              tab.value === status ? "bg-[#2563eb] text-white" : "text-[#64748b]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex items-stretch gap-2.5">
        {/* Built like the tab group beside it: an outer 8px frame around a 6px-rounded field. */}
        <div
          className="flex w-70 max-w-full flex-none items-center rounded-lg border border-[#dbe3de] bg-white p-1 focus-within:border-[#2563eb]"
          role="search"
        >
          <div className="flex flex-1 items-center gap-2 self-stretch rounded-md bg-[#f3f6f4] px-2.5">
            <span className={`${dashSearchIcon} inline-flex`}>
              <Search size={14} strokeWidth={2} />
            </span>
            <input
              type="search"
              name="q"
              placeholder="Search clients..."
              aria-label="Search clients"
              autoComplete="off"
              className="w-full border-none bg-transparent text-[12.5px] text-[#17242f] outline-none [&::-webkit-search-cancel-button]:hidden"
              value={text}
              onChange={(event) => handleChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            {text ? (
              <button type="button" className={searchClear} aria-label="Clear search" onClick={handleClear}>
                <X size={13} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Nothing to list ──────────────────────────────────────────────────────────

// Either no clients exist yet, or the current search / status filter matches none.
const EmptyState = ({ filtered, canManage }: { filtered: boolean; canManage: boolean }) => {
  const Icon = filtered ? SearchX : Users;

  return (
    <div className={emptyState}>
      <div className={emptyIcon}>
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <div className={emptyTitle}>{filtered ? "No clients match your search" : "No clients yet"}</div>
      <div className={emptyDesc}>
        {filtered
          ? "Try a different name or email, or switch to another status tab."
          : canManage
            ? "Add your first client to start managing their reports, content and meetings in one place."
            : "Clients assigned to you will show up here."}
      </div>
      {filtered ? (
        <Link href="/clients" className={`${btnDraft} ${emptyAction}`}>
          <RotateCcw size={13} strokeWidth={2} /> Clear filters
        </Link>
      ) : canManage ? (
        <Link href="/clients/add" className={btnAddClient}>
          <Plus size={14} strokeWidth={2.5} /> Add Client
        </Link>
      ) : null}
    </div>
  );
};

// ── Page numbers ─────────────────────────────────────────────────────────────

const Pagination = ({ pagination, status, search }: { pagination: ClientListData["pagination"]; status: string; search: string }) => {
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  // Everything fits on one page — nothing to show, not even the summary.
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const href = (target: number) => clientsHref({ status, q: search, page: target });

  return (
    <div className="flex items-center justify-between text-[12px] text-[#7a8e9b]">
      <span>
        Showing {from} to {to} of {total} clients
      </span>

      <nav className="flex items-center gap-1.5" aria-label="Clients pagination">
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
    </div>
  );
};

// ── The Clients page ─────────────────────────────────────────────────────────

// Every client as a card, with summary counts, status tabs, search and page numbers.
// `data` is missing when the list couldn't be loaded; `error` says why.
const ClientCard = ({
  data,
  error,
  status,
  search,
  canManage,
}: {
  data?: ClientListData;
  error?: string;
  status: string;
  search: string;
  canManage: boolean;
}) => (
  <>
    <div className={headlineRow}>
      <div>
        <div className={pageTitle}>Clients</div>
        <div className={pageDesc}>Manage all your clients, track their activity and access their reports, meetings and more.</div>
      </div>
      {canManage ? (
        <Link href="/clients/add" className={btnAddClient}>
          <Plus size={14} strokeWidth={2.5} /> Add Client
        </Link>
      ) : null}
    </div>

    {!data ? (
      <div className={formErrorBanner} role="alert">
        {error ?? "Could not load clients."}
      </div>
    ) : (
      <>
        <Stats summary={data.summary} />
        <Toolbar status={status} search={search} summary={data.summary} />
        {data.clients.length === 0 ? (
          <EmptyState filtered={status !== "all" || search !== ""} canManage={canManage} />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {data.clients.map((client) => (
              <Card client={client} key={client._id} />
            ))}
          </div>
        )}
        <Pagination pagination={data.pagination} status={status} search={search} />
      </>
    )}
  </>
);

export default ClientCard;
