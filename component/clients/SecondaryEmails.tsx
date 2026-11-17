"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, Mail, Pencil, Plus, Trash2, X } from "lucide-react";

// As the backend allows (client.model.ts → CLIENT_SECONDARY_EMAILS_MAX).
const MAX_SECONDARY = 10;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full min-w-0 rounded-lg border border-[#dbe3ed] bg-white px-3 py-2 text-[14px] text-[#0f172a] placeholder:text-[#94a3b8] hover:border-[#b8c6d7] focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb]/12 focus:outline-none";
const iconButtonClass =
  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]";

// The client's other email addresses, on the client's form: each gets a copy of every email sent
// to the primary one (backend: utils/email.ts → sendEmail). Added, changed and taken off here, and
// saved with the rest of the form. No <form> of its own — the client's form holds it — so Enter
// adds (or saves) the one being typed instead of saving the client.
const SecondaryEmails = ({
  primary,
  emails,
  onChange,
}: {
  primary: string;
  emails: string[];
  onChange: (emails: string[]) => void;
}) => {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{
    index: number;
    value: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // What is wrong with an address, or null. `skip`: the one being changed, which may stay as it is.
  const problemOf = (value: string, skip?: number) => {
    if (!EMAIL.test(value)) return "Enter a valid email address.";
    if (value === primary.trim().toLowerCase())
      return "That's the primary email already.";
    if (emails.some((email, index) => index !== skip && email === value))
      return "That email is added already.";
    return null;
  };

  const add = () => {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    const problem = problemOf(value);
    if (problem) return setError(problem);
    onChange([...emails, value]);
    setDraft("");
    setError(null);
  };
  const save = () => {
    if (!editing) return;
    const value = editing.value.trim().toLowerCase();
    const problem = problemOf(value, editing.index);
    if (problem) return setError(problem);
    onChange(
      emails.map((email, index) => (index === editing.index ? value : email)),
    );
    setEditing(null);
    setError(null);
  };
  const onEnter =
    (action: () => void) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      action();
    };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 rounded-lg border border-[#dbeafe] bg-[#f5f8ff] px-3 py-2">
        <Mail size={15} strokeWidth={2} className="shrink-0 text-[#2563eb]" />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[#0f172a]">
          {primary.trim() || "The email in step 1"}
        </span>
        <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] font-bold text-[#1d4ed8]">
          Primary
        </span>
      </div>

      {emails.map((email, index) =>
        editing?.index === index ? (
          <div key={email} className="flex items-center gap-1.5">
            <input
              type="email"
              aria-label="Secondary email"
              className={inputClass}
              autoFocus
              value={editing.value}
              onChange={(event) => {
                setEditing({ index, value: event.target.value });
                setError(null);
              }}
              onKeyDown={onEnter(save)}
            />
            <button
              type="button"
              aria-label="Save email"
              onClick={save}
              className={`${iconButtonClass} text-[#16a34a] hover:text-[#15803d]`}
            >
              <Check size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => {
                setEditing(null);
                setError(null);
              }}
              className={iconButtonClass}
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>
        ) : (
          <div
            key={email}
            className="flex items-center gap-2.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5"
          >
            <Mail
              size={15}
              strokeWidth={2}
              className="shrink-0 text-[#64748b]"
            />
            <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#0f172a]">
              {email}
            </span>
            <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#475569]">
              Secondary
            </span>
            <button
              type="button"
              aria-label={`Edit ${email}`}
              onClick={() => {
                setEditing({ index, value: email });
                setError(null);
              }}
              className={iconButtonClass}
            >
              <Pencil size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label={`Remove ${email}`}
              onClick={() => {
                onChange(emails.filter((_, at) => at !== index));
                if (editing) setEditing(null);
              }}
              className={`${iconButtonClass} hover:bg-[#fef2f2] hover:text-[#dc2626]`}
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        ),
      )}

      {emails.length < MAX_SECONDARY ? (
        <div className="flex items-center gap-1.5">
          <input
            type="email"
            aria-label="Add a secondary email"
            className={inputClass}
            placeholder="Add a secondary email"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            onKeyDown={onEnter(add)}
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            className="inline-flex h-9.5 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#2563eb] bg-[#2563eb] px-3.5 text-[13px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} strokeWidth={2.5} /> Add
          </button>
        </div>
      ) : (
        <p className="m-0 text-[12.5px] text-[#6b7280]">
          Up to {MAX_SECONDARY} secondary emails — remove one to add another.
        </p>
      )}
      {error ? (
        <p className="m-0 text-[12.5px] font-medium text-[#dc2626]">{error}</p>
      ) : null}
    </div>
  );
};

export default SecondaryEmails;
