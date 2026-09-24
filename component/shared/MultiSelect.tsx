"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

// A dropdown where several options can be ticked. The list stays open while you
// pick, and closes on outside click or Escape. Options are native checkboxes,
// so Tab / Space work without extra key handling.
const MultiSelect = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select…",
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  return (
    <div className="relative" ref={rootRef}>
      <div
        className={`relative flex min-h-9.5 cursor-pointer items-center gap-1.5 rounded-md border bg-[#fafcfb] py-1 pr-8.5 pl-2 focus-within:border-[#2563eb] ${
          open ? "border-[#2563eb]" : "border-[#cbd6d0]"
        }`}
      >
        <button
          type="button"
          className="absolute inset-0 w-full cursor-pointer rounded-md pr-8.5 pl-3 text-left text-[12.5px]"
          aria-label={label}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
        >
          {value.length === 0 ? <span className="text-[#8a9ba6]">{placeholder}</span> : null}
        </button>

        <span className="pointer-events-none relative flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span
              className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] py-0.75 pr-1.5 pl-2.5 text-[12px] font-semibold text-[#2563eb]"
              key={item}
            >
              {item}
              <button
                type="button"
                className="inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-inherit hover:bg-[#c9dafc]"
                aria-label={`Remove ${item}`}
                onClick={() => toggle(item)}
              >
                <X size={11} strokeWidth={3} />
              </button>
            </span>
          ))}
        </span>

        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#657787] ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </div>

      {open ? (
        <div
          className="absolute top-[calc(100%+4px)] right-0 left-0 z-20 max-h-60 overflow-y-auto rounded-lg border border-[#dbe3de] bg-white p-1.5 shadow-[0_8px_24px_rgba(11,21,34,0.12)]"
          id={listId}
          role="group"
          aria-label={label}
        >
          {options.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-semibold text-[#273847] hover:bg-[#f1f6f3]"
              key={option}
            >
              <input
                type="checkbox"
                className="h-3.75 w-3.75 cursor-pointer accent-[#2563eb]"
                checked={value.includes(option)}
                onChange={() => toggle(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MultiSelect;
