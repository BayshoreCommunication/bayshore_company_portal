"use client";

import { useId, useState } from "react";
import toast from "react-hot-toast";
import { Check, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  addExtraItemAction,
  removeExtraItemAction,
  updateExtraItemAction,
  type ExtraField,
  type OnboardingExtraItem,
} from "@/app/actions/onboarding";
import { EXTRA_FIELDS } from "./clientUi";

// The team's own items for one client (the client's onboarding page, OnboardingReview): what each
// is called, what the client is to do, and what it asks for. The client sees them on the
// "Additional items" step of their own form (client-portal: OnboardingProcess), and their answers
// show under that step here. Added, changed or taken off at once — the client's form hears of it.
// Without a `clientId` (a client still being added, ClientAdd) they are kept here only, under keys
// of their own ("draft…"), and the form sends them once the client is made.

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 2000;

const inputClass =
  "w-full rounded-lg border border-[#d1d5db] bg-white px-3.5 text-[14px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2F5FD8] focus:ring-3 focus:ring-[#2F5FD8]/12";
const labelClass = "block text-[13px] font-semibold text-[#111827]";
const hintClass = "mt-1.5 text-[12px] text-[#6b7280]";
const quietButton =
  "inline-flex h-10 cursor-pointer items-center rounded-lg border border-[#d1d5db] bg-white px-4 text-[13.5px] font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60";

type Draft = { title: string; description: string; fields: ExtraField[] };
const EMPTY: Draft = { title: "", description: "", fields: [] };
const nameOf = (field: ExtraField) =>
  EXTRA_FIELDS.find(([id]) => id === field)?.[1] ?? field;

const ExtraItems = ({
  clientId,
  items,
  stepOff,
  onChange,
}: {
  clientId?: string;
  items: Record<string, OnboardingExtraItem>;
  // The team took the whole step off the client's form (Steps on the client's form).
  stepOff: boolean;
  onChange: (
    change: (
      items: Record<string, OnboardingExtraItem>,
    ) => Record<string, OnboardingExtraItem>,
  ) => void;
}) => {
  const id = useId();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  // The item being changed, by key — or null when adding one.
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  // The form shows only while an item is being added or changed: "Add onboarding item" opens it,
  // one item at a time.
  const [open, setOpen] = useState(false);

  const list = Object.entries(items);
  const titleMissing = !draft.title.trim();
  const fieldsMissing = !draft.fields.length;

  const clear = () => {
    setDraft(EMPTY);
    setEditing(null);
    setTried(false);
  };
  const close = () => {
    clear();
    setOpen(false);
  };

  const toggle = (field: ExtraField) =>
    setDraft((now) => ({
      ...now,
      fields: now.fields.includes(field)
        ? now.fields.filter((each) => each !== field)
        : [...now.fields, field],
    }));

  const save = async () => {
    setTried(true);
    if (titleMissing || fieldsMissing) return;
    const input = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      fields: EXTRA_FIELDS.map(([field]) => field).filter((field) =>
        draft.fields.includes(field),
      ),
    };
    setSaving(true);
    const result = !clientId
      ? { ok: true, data: { key: editing ?? `draft${Date.now()}`, ...input }, error: undefined }
      : editing
        ? await updateExtraItemAction(clientId, editing, input)
        : await addExtraItemAction(clientId, input);
    setSaving(false);
    if (!result.ok || !result.data)
      return void toast.error(result.error ?? "Couldn't save the item.");
    const { key, title, description, fields } = result.data;
    // The client's answers stay with a changed item.
    onChange((now) => ({
      ...now,
      [key]: {
        ...now[key],
        title,
        description,
        fields,
        files: now[key]?.files ?? [],
      },
    }));
    toast.success(
      editing ? `${title} saved` : `${title} added to the client's form`,
    );
    close();
  };

  const edit = (key: string, item: OnboardingExtraItem) => {
    setEditing(key);
    setDraft({
      title: item.title,
      description: item.description ?? "",
      fields: [...item.fields],
    });
    setTried(false);
    setOpen(true);
    setTimeout(
      () =>
        document
          .getElementById(`${id}-title`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50,
    );
  };

  const remove = async (key: string, title: string) => {
    setRemoving(key);
    const result = clientId ? await removeExtraItemAction(clientId, key) : { ok: true, error: undefined };
    setRemoving(null);
    setAsking(null);
    if (!result.ok)
      return void toast.error(result.error ?? "Couldn't take the item off.");
    onChange((now) => {
      const rest = { ...now };
      delete rest[key];
      return rest;
    });
    if (editing === key) close();
    toast.success(`${title} taken off the client's form`);
  };

  return (
    <div className="flex flex-col gap-4">
      <section>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 className="m-0 text-[17px] font-bold text-[#111827]">
            Onboarding Items
          </h2>
          <span className="text-[12.5px] text-[#6b7280]">
            {list.length} item{list.length === 1 ? "" : "s"}
          </span>
        </div>
        {stepOff ? (
          <p className="mb-2.5 text-[12.5px] text-[#b45309]">
            The &quot;Additional items&quot; step is off for this client — tick
            it above to show these to them.
          </p>
        ) : null}
        {list.length ? (
          <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
            {list.map(([key, item], index) => (
              <li
                key={key}
                className={`rounded-[14px] border bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${editing === key ? "border-[#2F5FD8]" : "border-[#e5e7eb]"}`}
              >
                <div className="flex items-start gap-3.5">
                  <span className="grid size-7.5 shrink-0 place-items-center rounded-lg bg-[#e8eefe] text-[13px] font-bold text-[#2F5FD8]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 text-[15px] font-semibold break-words text-[#111827]">
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p className="mt-1 text-[13.5px] break-words whitespace-pre-line text-[#374151]">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.fields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full bg-[#ffedd5] px-2.5 py-0.5 text-[12px] font-medium text-[#9a3412]"
                        >
                          {nameOf(field)}
                        </span>
                      ))}
                      {stepOff ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[12px] font-medium text-[#6b7280]">
                          <EyeOff size={11} strokeWidth={2.25} /> Step off
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${item.title}`}
                      title="Edit"
                      onClick={() => edit(key, item)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#eef2ff] hover:text-[#2F5FD8]"
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${item.title}`}
                      title="Delete"
                      onClick={() => setAsking(asking === key ? null : key)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {asking === key ? (
                  <div className="mt-3.5 flex flex-wrap items-center justify-end gap-2 border-t border-[#f0f1f3] pt-3 text-[13px]">
                    <span className="mr-auto text-[#b42318]">
                      Delete {item.title}, with the client&apos;s answers and
                      files for it?
                    </span>
                    <button
                      type="button"
                      disabled={removing === key}
                      onClick={() => void remove(key, item.title)}
                      className="inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-lg bg-[#dc2626] px-3.5 font-semibold text-white hover:bg-[#b91c1c] disabled:cursor-wait"
                    >
                      {removing === key ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : null}{" "}
                      Delete
                    </button>
                    <button
                      type="button"
                      disabled={removing === key}
                      onClick={() => setAsking(null)}
                      className="inline-flex h-8.5 cursor-pointer items-center rounded-lg border border-[#d1d5db] bg-white px-3.5 font-medium text-[#374151] hover:bg-[#f9fafb]"
                    >
                      Keep it
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : open ? null : (
          <p className="mb-2.5 text-[13px] text-[#6b7280]">
            No items yet. Add one and the client will see it on their form, in
            the &quot;Additional items&quot; step.
          </p>
        )}
        {open ? null : (
          <button
            type="button"
            onClick={() => {
              clear();
              setOpen(true);
              setTimeout(
                () => document.getElementById(`${id}-title`)?.focus(),
                50,
              );
            }}
            className="mt-2.5 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#c7d2fe] bg-[#fafbff] text-[14px] font-semibold text-[#2F5FD8] transition-colors hover:border-[#2F5FD8] hover:bg-[#eef2ff]"
          >
            <Plus size={16} strokeWidth={2.25} /> Add onboarding item
          </button>
        )}
        {open ? (
          // Not a <form> of its own: on the client form (ClientAdd) it sits inside that one.
          <div
            role="group"
            aria-label={editing ? "Edit onboarding item" : "Add onboarding item"}
            className="mt-2.5 rounded-[14px] border border-[#c7d2fe] bg-white p-7 shadow-[0_1px_3px_rgba(15,23,42,0.04)] max-sm:p-4.5"
          >
            <h2 className="m-0 text-[18px] font-bold text-[#111827]">
              {editing ? "Edit Onboarding Item" : "Add Onboarding Item"}
            </h2>
            <p className="mt-1 text-[13px] text-[#6b7280]">
              It shows on this client&apos;s form, in the &quot;Additional
              items&quot; step.
            </p>

            <div className="mt-5">
              <label htmlFor={`${id}-title`} className={labelClass}>
                Item Name <span className="text-[#dc2626]">*</span>
              </label>
              <input
                id={`${id}-title`}
                value={draft.title}
                maxLength={TITLE_MAX}
                onChange={(event) =>
                  setDraft((now) => ({ ...now, title: event.target.value }))
                }
                placeholder="e.g. Website hosting access"
                onKeyDown={(event) => {
                  // Enter adds the item, and never sends the form this sits in.
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  void save();
                }}
                aria-invalid={tried && titleMissing}
                className={`${inputClass} mt-2 h-10.5 ${tried && titleMissing ? "border-[#dc2626]" : ""}`}
              />
              <p
                className={
                  tried && titleMissing
                    ? "mt-1.5 text-[12px] text-[#dc2626]"
                    : hintClass
                }
              >
                {tried && titleMissing
                  ? "Give the item a name."
                  : "Enter the name of the onboarding requirement."}
              </p>
            </div>

            <div className="mt-5">
              <label htmlFor={`${id}-description`} className={labelClass}>
                Description / Instructions
              </label>
              <textarea
                id={`${id}-description`}
                rows={4}
                value={draft.description}
                maxLength={DESCRIPTION_MAX}
                onChange={(event) =>
                  setDraft((now) => ({
                    ...now,
                    description: event.target.value,
                  }))
                }
                placeholder="Explain exactly what the client needs to submit or complete..."
                className={`${inputClass} mt-2 py-2.5`}
              />
              <p className={hintClass}>
                Provide clear instructions on what the client needs to submit or
                complete.
              </p>
            </div>

            <fieldset className="mt-5">
              <legend className={labelClass}>Information Required</legend>
              <p
                className={
                  tried && fieldsMissing
                    ? "mt-1 text-[12px] text-[#dc2626]"
                    : "mt-1 text-[12px] text-[#6b7280]"
                }
              >
                {tried && fieldsMissing
                  ? "Pick at least one thing the client must provide."
                  : "Select what the client must provide for this item."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {EXTRA_FIELDS.map(([field, name]) => {
                  const on = draft.fields.includes(field);
                  return (
                    <label
                      key={field}
                      className={`inline-flex min-h-10.5 cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 text-[14px] transition-colors ${
                        on
                          ? "border-[#2F5FD8] bg-[#f5f8ff] text-[#1e3a8a]"
                          : "border-[#d1d5db] bg-white text-[#111827] hover:border-[#9ca3af]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(field)}
                        className="size-4 cursor-pointer accent-[#2F5FD8]"
                      />
                      {name}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-[#eef0f3] pt-5">
              <button
                type="button"
                className={quietButton}
                disabled={saving}
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#2F5FD8] bg-[#2F5FD8] px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#2546b0] disabled:cursor-wait disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : editing ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : (
                  <Plus size={15} strokeWidth={2.5} />
                )}
                {editing ? "Save Changes" : "Add Onboarding Item"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default ExtraItems;
