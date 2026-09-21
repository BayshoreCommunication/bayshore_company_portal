"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { ClientListData } from "@/app/actions/clients";
import { CLIENT_STATUS_OPTIONS, clientsHref } from "./clientUi";

const SEARCH_DELAY_MS = 400;

const ClientsToolbar = ({
  status,
  search,
  summary,
}: {
  status: string;
  search: string;
  summary: ClientListData["summary"];
}) => {
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

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") applySearch(text);
    if (event.key === "Escape" && text) handleClear();
  };

  const handleClear = () => {
    setText("");
    applySearch("");
  };

  const tabs = [
    { value: "all", label: `All Clients (${summary.total})` },
    ...CLIENT_STATUS_OPTIONS.map((option) => ({
      value: option.value as string,
      label: `${option.label} (${summary[option.value]})`,
    })),
  ];

  return (
    <div className="clients-toolbar">
      <div className="client-tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={clientsHref({ status: tab.value, q: search })}
            className={`client-tab${tab.value === status ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="clients-toolbar-right">
        {/* Built like the tab group beside it: an outer 8px frame around a 6px-rounded field. */}
        <div className="dash-search clients-search" role="search">
          <div className="clients-search-field">
            <span className="dash-search-icon" style={{ display: "inline-flex" }}>
              <Search size={14} strokeWidth={2} />
            </span>
            <input
              type="search"
              name="q"
              placeholder="Search clients..."
              aria-label="Search clients"
              autoComplete="off"
              value={text}
              onChange={(event) => handleChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            {text ? (
              <button type="button" className="clients-search-clear" aria-label="Clear search" onClick={handleClear}>
                <X size={13} strokeWidth={2.5} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsToolbar;
