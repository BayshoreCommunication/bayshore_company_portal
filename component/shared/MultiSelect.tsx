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
    <div className="multi-select" ref={rootRef}>
      <div className={`multi-select-trigger${open ? " open" : ""}`}>
        <button
          type="button"
          className="multi-select-button"
          aria-label={label}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
        >
          {value.length === 0 ? <span className="multi-select-placeholder">{placeholder}</span> : null}
        </button>

        <span className="multi-select-tags">
          {value.map((item) => (
            <span className="multi-select-tag" key={item}>
              {item}
              <button
                type="button"
                className="multi-select-tag-remove"
                aria-label={`Remove ${item}`}
                onClick={() => toggle(item)}
              >
                <X size={11} strokeWidth={3} />
              </button>
            </span>
          ))}
        </span>

        <ChevronDown size={16} strokeWidth={2} className="multi-select-chevron" aria-hidden="true" />
      </div>

      {open ? (
        <div className="multi-select-panel" id={listId} role="group" aria-label={label}>
          {options.map((option) => (
            <label className="multi-select-option" key={option}>
              <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MultiSelect;
