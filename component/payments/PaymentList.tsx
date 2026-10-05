"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Download,
  PieChart,
  Receipt,
  RotateCcw,
  Search,
  SearchX,
  Trophy,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { pageItems } from "@/component/shared/pageItems";
import { samplePayments, type Payment, type PaymentStatus } from "./samplePayments";

const PAGE_SIZE = 10;

const inputClass =
  "h-9.5 w-full cursor-pointer appearance-none rounded-lg border bg-white pr-8 pl-3 text-[12px] font-medium text-[#1f2530] outline-none focus:border-[#9aa3af]";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const thClass = "bg-[#f3f4f6] px-3 py-2.5 text-left text-[11.5px] font-medium whitespace-nowrap text-[#4b5260]";
const tdClass = "border-b border-[#eef0f2] px-3 py-3 text-[12px] whitespace-nowrap text-[#1f2530]";

const pageButtonClass = "flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2 text-[12px] font-medium";

// Pill colors for how a payment went — the same amber / green / grey / red used across the portal.
const STATUSES: Record<PaymentStatus, { label: string; color: string; background: string; dot: string }> = {
  paid: { label: "Paid", color: "#15803d", background: "#d6eadb", dot: "#16a34a" },
  pending: { label: "Pending", color: "#a35a12", background: "#fbecd3", dot: "#d99136" },
  failed: { label: "Failed", color: "#b91c1c", background: "#f8dcdc", dot: "#dc2626" },
  expired: { label: "Expired", color: "#475569", background: "#e8ecf1", dot: "#64748b" },
};
const STATUS_KEYS = Object.keys(STATUSES) as PaymentStatus[];

const AVATAR_COLORS = ["#2563eb", "#c8973a", "#9333ea", "#dc2626", "#16a34a", "#2f8f6f", "#0891b2", "#db2777"];

const dollars = (amount: number) => `$${amount.toLocaleString("en-US")}`;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// The same client always gets the same avatar color.
const avatarColorOf = (name: string) => AVATAR_COLORS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];

// Sample timestamps are UTC; showing them in UTC keeps the server and the browser agreeing on the day.
const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" });

const subServiceCount = (payment: Payment) => payment.items.reduce((sum, item) => sum + item.subServices.length, 0);

// ── Small pieces ─────────────────────────────────────────────────────────────

const SelectBox = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <div className="relative w-full sm:w-45">
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
        <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{sub}</div>
      </div>
    </div>
    <div className="mt-3 text-[30px] leading-none font-semibold text-[#0b0c24]">{value}</div>
  </div>
);

const StatusPill = ({ status }: { status: PaymentStatus }) => {
  const meta = STATUSES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
      style={{ background: meta.background, color: meta.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
};

// A list of colored bars — who paid the most, or how payments went.
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
          {rows
            .filter((row) => row.amount > 0)
            .map((row) => (
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

// What the payment was for, opened under its row.
const PaymentDetails = ({ payment }: { payment: Payment }) => (
  <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#f6f7f9] p-4 whitespace-normal md:grid-cols-[minmax(0,1fr)_240px]">
    <div>
      <div className="mb-2 text-[11px] text-[#6b7280]">What was added</div>
      <ul className="flex list-none flex-col gap-2.5">
        {payment.items.map((item) => (
          <li key={item.title} className="rounded-lg border border-[#e6e8eb] bg-white">
            <div className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]">
              <span className="font-medium text-[#1f2530]">{item.title}</span>
              <span className="shrink-0 font-semibold text-[#0b0c24]">{dollars(item.total)}/mo</span>
            </div>
            <ul className="flex list-none flex-col gap-1.5 border-t border-[#eef0f2] px-3 py-2">
              {item.subServices.map((sub) => (
                <li key={sub.name} className="flex items-center gap-2 text-[11.5px]">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d6eadb] text-[#15803d]">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1 text-[#1f2530]">{sub.name}</span>
                  <span className="shrink-0 text-[#4b5260]">{dollars(sub.price)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
    <div className="flex flex-col gap-2.5 text-[11.5px]">
      <div className="text-[11px] text-[#6b7280]">Payment</div>
      {[
        ["Paid by", payment.paidBy],
        ["Started", formatDateTime(payment.createdAt)],
        ["Paid", payment.paidAt ? formatDateTime(payment.paidAt) : "—"],
        ["Stripe reference", payment.reference ?? "—"],
      ].map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-[#6b7280]">{label}</span>
          <span className="text-right font-medium break-all text-[#1f2530]">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── CSV export ───────────────────────────────────────────────────────────────

// Quote every cell so commas, quotes and line breaks in a value can't break a row.
const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

const exportCsv = (rows: Payment[]) => {
  const lines = [
    ["Client", "Paid By", "Services", "Sub-services", "Amount", "Status", "Started", "Paid", "Stripe Reference"],
    ...rows.map((payment) => [
      payment.client.companyName,
      payment.paidBy,
      payment.items.map((item) => item.title).join("; "),
      payment.items.flatMap((item) => item.subServices.map((sub) => sub.name)).join("; "),
      String(payment.amount),
      STATUSES[payment.status].label,
      payment.createdAt.slice(0, 10),
      payment.paidAt?.slice(0, 10) ?? "",
      payment.reference ?? "",
    ]),
  ].map((row) => row.map(csvCell).join(","));

  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "payments.csv";
  link.click();
  URL.revokeObjectURL(url);
};

// ── The Payments page ────────────────────────────────────────────────────────

// What clients have paid through Stripe to add services, filtered and paged in the
// browser. Sample data for now (./samplePayments) — the design first; the backend
// list (GET /payments) is ready to replace it.
const PaymentList = () => {
  const [client, setClient] = useState("all");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const payments = samplePayments;

  const clientOptions = useMemo(
    () => Array.from(new Map(payments.map((payment) => [payment.client._id, payment.client.companyName]))).sort((a, b) => a[1].localeCompare(b[1])),
    [payments],
  );

  // The tiles and side cards cover everything, whatever the filters say.
  const summary = useMemo(() => {
    const counts: Record<PaymentStatus, number> = { paid: 0, pending: 0, failed: 0, expired: 0 };
    const amounts: Record<PaymentStatus, number> = { paid: 0, pending: 0, failed: 0, expired: 0 };
    const byClient = new Map<string, { name: string; amount: number; count: number }>();

    for (const payment of payments) {
      counts[payment.status] += 1;
      amounts[payment.status] += payment.amount;
      if (payment.status === "paid") {
        const entry = byClient.get(payment.client._id) ?? { name: payment.client.companyName, amount: 0, count: 0 };
        byClient.set(payment.client._id, { ...entry, amount: entry.amount + payment.amount, count: entry.count + 1 });
      }
    }

    return { counts, amounts, topClients: [...byClient.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 5) };
  }, [payments]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return payments.filter(
      (payment) =>
        (client === "all" || payment.client._id === client) &&
        (status === "all" || payment.status === status) &&
        // Search looks at the client and at what was bought.
        (!needle ||
          [payment.client.companyName, payment.paidBy, ...payment.items.flatMap((item) => [item.title, ...item.subServices.map((sub) => sub.name)])]
            .join(" ")
            .toLowerCase()
            .includes(needle)),
    );
  }, [payments, client, status, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = client !== "all" || status !== "all" || query.trim() !== "";

  const onFilterChange = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const clearFilters = () => {
    setClient("all");
    setStatus("all");
    setQuery("");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">Payments</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">What your clients have paid through Stripe to add services, and how each payment went.</div>
        </div>
        <button
          type="button"
          className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-50 disabled:hover:bg-white"
          disabled={filtered.length === 0}
          onClick={() => exportCsv(filtered)}
        >
          <Download size={14} strokeWidth={2} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile icon={CircleDollarSign} label="Collected" sub="Paid through Stripe" value={dollars(summary.amounts.paid)} color="#16a34a" background="#d2e7d8" />
        <SummaryTile icon={CheckCircle2} label="Paid" sub="Payments that went through" value={String(summary.counts.paid)} color="#2f5fd8" background="#d9e0ef" />
        <SummaryTile
          icon={Clock}
          label="Pending"
          sub={summary.counts.pending ? `${dollars(summary.amounts.pending)} waiting on Stripe` : "Nothing waiting"}
          value={String(summary.counts.pending)}
          color="#d97706"
          background="#f8e4c6"
        />
        <SummaryTile
          icon={XCircle}
          label="Not Completed"
          sub="Failed or abandoned"
          value={String(summary.counts.failed + summary.counts.expired)}
          color="#dc2626"
          background="#f4d7db"
        />
      </div>

      <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
        {clientOptions.length > 1 ? (
          <SelectBox label="Client" value={client} onChange={(value) => onFilterChange(() => setClient(value))}>
            <option value="all">All Clients</option>
            {clientOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </SelectBox>
        ) : null}
        <SelectBox label="Payment status" value={status} onChange={(value) => onFilterChange(() => setStatus(value as PaymentStatus | "all"))}>
          <option value="all">All Statuses</option>
          {STATUS_KEYS.map((key) => (
            <option key={key} value={key}>
              {STATUSES[key].label}
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
            placeholder="Search clients or services..."
            aria-label="Search payments"
            autoComplete="off"
            className="w-full border-none bg-transparent text-[12px] text-[#1f2530] outline-none placeholder:text-[#6b7280] [&::-webkit-search-cancel-button]:hidden"
            value={query}
            onChange={(event) => onFilterChange(() => setQuery(event.target.value))}
          />
          {query ? (
            <button
              type="button"
              className="inline-flex cursor-pointer text-[#6b7280] hover:text-[#0b0c24]"
              aria-label="Clear search"
              onClick={() => onFilterChange(() => setQuery(""))}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className={`${cardClass} p-3.5`}>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-11 text-center">
              <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9e0ef] text-[#2f5fd8]">
                {hasFilters ? <SearchX size={24} strokeWidth={1.8} /> : <Receipt size={24} strokeWidth={1.8} />}
              </div>
              <div className="text-lg font-semibold text-[#0b0c24]">{hasFilters ? "No payments match these filters" : "No payments yet"}</div>
              <div className="mt-2 mb-4.5 max-w-90 text-[12.5px] leading-normal text-[#4b5563]">
                {hasFilters
                  ? "Try a different client, status or search."
                  : "When a client pays to add a service from their portal, the payment will appear here."}
              </div>
              {hasFilters ? (
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-4.5 py-2.25 text-[12.5px] font-medium text-white hover:bg-[#1e2140]"
                  onClick={clearFilters}
                >
                  <RotateCcw size={13} strokeWidth={2} /> Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className={`${thClass} rounded-l-lg`}>Client</th>
                      <th className={thClass}>For</th>
                      <th className={thClass}>Date</th>
                      <th className={`${thClass} text-right`}>Amount</th>
                      <th className={thClass}>Status</th>
                      <th className={`${thClass} w-12 rounded-r-lg`}>
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((payment) => {
                      const open = openId === payment._id;
                      const toggle = () => setOpenId(open ? null : payment._id);
                      const [firstItem, ...otherItems] = payment.items;

                      return (
                        <Fragment key={payment._id}>
                          {/* The whole row opens the payment; the chevron is the keyboard way in. */}
                          <tr className={`cursor-pointer ${open ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]"}`} onClick={toggle}>
                            <td className={tdClass}>
                              <div className="flex items-center gap-3">
                                <span
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                                  style={{ background: avatarColorOf(payment.client.companyName) }}
                                >
                                  {initialsOf(payment.client.companyName)}
                                </span>
                                <span className="min-w-0">
                                  <span className="block max-w-56 truncate font-medium text-[#1f2530]" title={payment.client.companyName}>
                                    {payment.client.companyName}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-[#6b7280]">{payment.paidBy}</span>
                                </span>
                              </div>
                            </td>
                            <td className={tdClass}>
                              <span className="block max-w-64 truncate font-medium text-[#1f2530]" title={payment.items.map((item) => item.title).join(", ")}>
                                {firstItem.title}
                                {otherItems.length ? <span className="font-normal text-[#6b7280]"> +{otherItems.length} more</span> : null}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-[#6b7280]">{plural(subServiceCount(payment), "sub-service")}</span>
                            </td>
                            <td className={`${tdClass} text-[#4b5260]`}>{formatDate(payment.createdAt)}</td>
                            <td className={`${tdClass} text-right`}>
                              <span className={`text-[13.5px] font-semibold ${payment.status === "paid" ? "text-[#0b0c24]" : "text-[#6b7280]"}`}>
                                {dollars(payment.amount)}
                              </span>
                            </td>
                            <td className={tdClass}>
                              <StatusPill status={payment.status} />
                            </td>
                            <td className={`${tdClass} text-right`}>
                              <button
                                type="button"
                                className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-md text-[#4b5260] hover:bg-[#eef0f2] hover:text-[#0b0c24]"
                                aria-expanded={open}
                                aria-label={`${open ? "Hide" : "Show"} the details of this payment from ${payment.client.companyName}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggle();
                                }}
                              >
                                <ChevronDown size={16} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                              </button>
                            </td>
                          </tr>
                          {open ? (
                            <tr>
                              <td colSpan={6} className="border-b border-[#eef0f2] bg-[#f9fafb] px-3 pt-1 pb-3.5">
                                <PaymentDetails payment={payment} />
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
                  Showing {start + 1}–{start + visible.length} of {plural(filtered.length, "payment")}
                </span>
                {/* One page of results needs no page buttons. */}
                {pageCount > 1 ? (
                  <nav className="flex items-center gap-1.5" aria-label="Payments pagination">
                    <button
                      type="button"
                      className={`${pageButtonClass} border-[#e2e5e9] bg-white text-[#0b0c24] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white`}
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} strokeWidth={2.25} />
                    </button>
                    {pageItems(currentPage, pageCount).map((item) =>
                      typeof item === "string" ? (
                        <span key={item} className="px-1 text-[#6b7280]" aria-hidden="true">
                          …
                        </span>
                      ) : (
                        <button
                          type="button"
                          key={item}
                          className={`${pageButtonClass} ${
                            item === currentPage ? "border-[#0b0c24] bg-[#0b0c24] text-white" : "border-[#e2e5e9] bg-white text-[#1f2530] hover:bg-[#f3f4f6]"
                          }`}
                          aria-label={`Page ${item}`}
                          aria-current={item === currentPage ? "page" : undefined}
                          onClick={() => setPage(item)}
                        >
                          {item}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className={`${pageButtonClass} border-[#e2e5e9] bg-white text-[#0b0c24] hover:bg-[#f3f4f6] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white`}
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} strokeWidth={2.25} />
                    </button>
                  </nav>
                ) : (
                  <span>
                    Total paid{" "}
                    <span className="font-semibold text-[#0b0c24]">
                      {dollars(filtered.reduce((sum, payment) => (payment.status === "paid" ? sum + payment.amount : sum), 0))}
                    </span>
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4.5">
          <BreakdownCard
            icon={Trophy}
            title="Top Paying Clients"
            sub={`${dollars(summary.amounts.paid)} collected`}
            empty="No payment has gone through yet."
            rows={summary.topClients.map(([id, entry]) => ({
              key: id,
              label: entry.name,
              color: avatarColorOf(entry.name),
              amount: entry.amount,
              text: `${dollars(entry.amount)} · ${plural(entry.count, "payment")}`,
            }))}
          />
          <BreakdownCard
            icon={PieChart}
            title="How Payments Went"
            sub={plural(payments.length, "payment")}
            empty="No payments yet."
            rows={STATUS_KEYS.map((key) => ({
              key,
              label: STATUSES[key].label,
              color: STATUSES[key].dot,
              amount: summary.counts[key],
              text: `${summary.counts[key]} · ${payments.length ? Math.round((summary.counts[key] / payments.length) * 100) : 0}%`,
            }))}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentList;
