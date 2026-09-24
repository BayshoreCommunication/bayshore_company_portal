"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Search, type LucideIcon } from "lucide-react";

export type PickerOption = {
  value: string;
  label: string;
  sub?: string;
  // What sits on the left: a picture if there is one, else initials, else an icon.
  image?: string;
  initials?: string;
  color?: string;
  icon?: LucideIcon;
};

const Leading = ({ option, size }: { option: PickerOption; size: "sm" | "md" }) => {
  const box = size === "md" ? "h-9 w-9" : "h-8 w-8";

  if (option.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={option.image} alt="" className={`${box} shrink-0 rounded-full object-cover`} />;
  }
  if (option.initials) {
    return (
      <span
        className={`${box} flex shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold text-white`}
        style={{ background: option.color ?? "#0f1c2a" }}
      >
        {option.initials}
      </span>
    );
  }
  if (option.icon) {
    const Icon = option.icon;
    return (
      <span
        className={`${box} flex shrink-0 items-center justify-center rounded-lg`}
        style={{ background: option.color ? `${option.color}1a` : "#eef3ef", color: option.color ?? "#556977" }}
      >
        <Icon size={16} strokeWidth={2} />
      </span>
    );
  }
  return null;
};

// A dropdown that can show a picture or icon and a second line for each option.
// Opens on click or ↓, moves with ↑/↓, picks with Enter, closes on Escape or outside click.
const Picker = ({
  id,
  value,
  options,
  onChange,
  placeholder = "Select…",
  placeholderIcon,
  searchable = false,
  searchPlaceholder = "Search…",
}: {
  id?: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  placeholderIcon?: LucideIcon;
  searchable?: boolean;
  searchPlaceholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value) ?? null;
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => `${option.label} ${option.sub ?? ""}`.toLowerCase().includes(needle))
    : options;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  };

  const pick = (option: PickerOption) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(visible.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (visible[active]) pick(visible[active]);
    }
  };

  const PlaceholderIcon = placeholderIcon;

  return (
    <div className="relative" ref={rootRef} onKeyDown={onKeyDown}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-white px-2.5 py-2 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors ${
          open ? "border-[#2563eb] ring-3 ring-[#2563eb]/12" : "border-[#cbd6d0] hover:border-[#9aacb8]"
        }`}
      >
        {selected ? (
          <Leading option={selected} size="md" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-[#cbd6d0] text-[#9aacb8]">
            {PlaceholderIcon ? <PlaceholderIcon size={16} strokeWidth={2} /> : null}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[13px] font-bold ${selected ? "text-[#0d1e2c]" : "text-[#8496a3]"}`}>
            {selected?.label ?? placeholder}
          </span>
          {selected?.sub ? <span className="block truncate text-[11px] text-[#7a8e9b]">{selected.sub}</span> : null}
        </span>
        <ChevronDown size={16} strokeWidth={2} className={`shrink-0 text-[#657787] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 min-w-64 overflow-hidden rounded-xl border border-[#dbe3de] bg-white shadow-[0_12px_32px_rgba(11,21,34,0.14)]">
          {searchable ? (
            <div className="border-b border-[#eef3ef] p-2">
              <div className="flex items-center gap-2 rounded-md bg-[#f3f6f4] px-2.5 py-1.75">
                <Search size={13} strokeWidth={2} className="shrink-0 text-[#8496a3]" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full border-none bg-transparent text-[12.5px] text-[#17242f] outline-none"
                />
              </div>
            </div>
          ) : null}

          <ul id={listId} role="listbox" className="max-h-72 list-none overflow-y-auto p-1.5">
            {visible.length === 0 ? (
              <li className="px-2.5 py-3 text-center text-[12px] text-[#7a8e9b]">No matches</li>
            ) : (
              visible.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(option)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.75 ${
                      isSelected ? "bg-[#eff6ff]" : index === active ? "bg-[#f4f7f5]" : ""
                    }`}
                  >
                    <Leading option={option} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12.5px] font-semibold ${isSelected ? "text-[#1d4ed8]" : "text-[#17242f]"}`}>
                        {option.label}
                      </span>
                      {option.sub ? <span className="block truncate text-[11px] text-[#7a8e9b]">{option.sub}</span> : null}
                    </span>
                    {isSelected ? <Check size={15} strokeWidth={2.5} className="shrink-0 text-[#2563eb]" /> : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default Picker;
