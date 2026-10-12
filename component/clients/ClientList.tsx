"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Eye, Hourglass, Mail, Pencil, Phone, Plus, RotateCcw, Search, SearchX, UserCheck, UserX, Users, X } from "lucide-react";
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
import {
  CLIENT_STATUS_OPTIONS,
  avatarColorFor,
  clientsHref,
  countsOf,
  formatDate,
  groupsOf,
  initialsOf,
  statusClassName,
  statusLabel,
} from "./clientUi";

const SEARCH_DELAY_MS = 400;

// "Add Client" in the sidebar's dark navy, like "Add Content".
const btnAddClient =
  "inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md bg-[#0b1522] px-5 py-2.75 text-[13px] font-bold text-white no-underline shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a]";

// ── One client ───────────────────────────────────────────────────────────────

const cardButton =
  "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2.25 text-[12px] font-bold no-underline transition-colors duration-150";
const cardLine = "flex min-w-0 items-center gap-2 text-[12px] text-[#556977]";

// How far through the onboarding form the client is, as a percentage: the questions answered,
// out of all of them (counted as the onboarding's own page counts them). A client who was never
// sent through the form has answered none.
const Progress = ({ client }: { client: Client }) => {
  const { answered, total } = countsOf(groupsOf({ onboarding: client.onboarding ?? { status: "in_progress" } }));
  const percent = total ? Math.round((answered / total) * 100) : 0;

  return (
    <span className="inline-flex shrink-0 items-baseline gap-1.5">
      Onboarding
      <b className={`rounded-md px-1.5 py-0.5 text-[11.5px] font-bold tabular-nums ${percent === 100 ? "bg-[#e5f6ea] text-[#15803d]" : "bg-[#eef1ef] text-[#0d1e2c]"}`}>{percent}%</b>
    </span>
  );
};

// `canManage` decides whether the card offers editing (the edit page turns everyone else away).
const Card = ({ client, canManage }: { client: Client; canManage: boolean }) => (
  <div className="flex flex-col rounded-xl border border-[#dbe3de] bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#c3d0c9] hover:shadow-[0_10px_28px_rgba(11,21,34,0.08)]">
    {/* Who it is: the company, with its contact under it, and where it stands. */}
    <div className="flex items-start gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold text-white"
        style={{ background: avatarColorFor(client._id) }}
      >
        {initialsOf(client.companyName)}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="truncate text-[15px] leading-tight font-bold text-[#0d1e2c]" title={client.companyName}>
          {client.companyName}
        </div>
        <div className="mt-1 truncate text-[12px] text-[#7a8e9b]">{client.contactName}</div>
      </div>
      <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
    </div>

    <div className="mt-4 flex flex-col gap-1.5">
      <span className={cardLine}>
        <Mail size={13} strokeWidth={2} className="shrink-0 text-[#8496a3]" />
        <span className="truncate" title={client.email}>
          {client.email}
        </span>
      </span>
      {client.phone ? (
        <span className={cardLine}>
          <Phone size={13} strokeWidth={2} className="shrink-0 text-[#8496a3]" />
          <span className="truncate">{client.phone}</span>
        </span>
      ) : null}
    </div>

    {client.serviceTypes.length ? (
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {client.serviceTypes.map((service) => (
          <span className={tagChip} key={service}>
            {service}
          </span>
        ))}
      </div>
    ) : null}

    {/* Pushed to the bottom, so the buttons line up across a row of cards of different heights. */}
    <div className="mt-auto pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-[#eef3ef] pt-3.5 text-[11.5px] text-[#7a8e9b]">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={12} strokeWidth={2} /> Client since {formatDate(client.startDate)}
        </span>
        <Progress client={client} />
      </div>
      <div className="mt-3.5 flex gap-2">
        <Link href={`/clients/${client._id}`} className={`${cardButton} bg-[#2563eb] text-white hover:bg-[#1d4ed8]`}>
          <Eye size={13} strokeWidth={2.5} /> View client
        </Link>
        {canManage ? (
          <Link href={`/clients/${client._id}/edit`} className={`${cardButton} border border-[#dbe3de] bg-white text-[#17242f] hover:border-[#2563eb] hover:text-[#2563eb]`}>
            <Pencil size={12} strokeWidth={2.5} /> Edit client
          </Link>
        ) : null}
      </div>
    </div>
  </div>
);

// ── Summary cards ────────────────────────────────────────────────────────────

const Stats = ({ summary }: { summary: ClientListData["summary"] }) => {
  const share = summary.total ? Math.round((summary.active / summary.total) * 100) : 0;
  const stats = [
    { icon: Users, iconBg: "#dbeafe", iconColor: "#2563eb", label: "TOTAL CLIENTS", value: summary.total, note: "Across all statuses" },
    { icon: UserCheck, iconBg: "#dcf3e2", iconColor: "#16a34a", label: "ACTIVE CLIENTS", value: summary.active, note: `${share}% of total` },
    {
      icon: Hourglass,
      iconBg: "#fdf1de",
      iconColor: "#c8973a",
      label: "ONBOARDING / PENDING",
      value: (summary.onboarding ?? 0) + summary.pending,
      note: `${summary.onboarding ?? 0} onboarding · ${summary.pending} pending`,
    },
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
    ...CLIENT_STATUS_OPTIONS.map((option) => ({ value: option.value as string, label: `${option.label} (${summary[option.value] ?? 0})` })),
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
const ClientList = ({
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
              <Card client={client} canManage={canManage} key={client._id} />
            ))}
          </div>
        )}
        <Pagination pagination={data.pagination} status={status} search={search} />
      </>
    )}
  </>
);

export default ClientList;
