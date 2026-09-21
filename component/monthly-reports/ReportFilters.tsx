"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { STATUS_OPTIONS, monthOptions, reportsHref } from "./reportUi";

const SEARCH_DELAY_MS = 400;

type Filters = { client: string; month: string; status: string; search: string };

const ReportFilters = ({ clients, client, month, status, search }: { clients: { _id: string; companyName: string }[] } & Filters) => {
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

  const go = (next: Partial<Filters>) => router.replace(reportsHref({ ...current.current, q: pushed, ...next }));

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
    <div className="filters-card">
      <div className="filter-left-group">
        <select className="filter-select" aria-label="Client" value={client} onChange={(event) => go({ client: event.target.value })}>
          <option value="">All Clients</option>
          {clients.map((option) => (
            <option key={option._id} value={option._id}>
              {option.companyName}
            </option>
          ))}
        </select>
        <select className="filter-select" aria-label="Report month" value={month} onChange={(event) => go({ month: event.target.value })}>
          <option value="">All Dates</option>
          {monthOptions(month || undefined).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select className="filter-select" aria-label="Status" value={status} onChange={(event) => go({ status: event.target.value })}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-search-box">
        <span className="filter-search-icon" style={{ display: "inline-flex" }}>
          <Search size={13} strokeWidth={2} />
        </span>
        <input
          type="search"
          className="filter-search-input"
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
          <button type="button" className="clients-search-clear reports-search-clear" aria-label="Clear search" onClick={() => { setText(""); applySearch(""); }}>
            <X size={13} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ReportFilters;
