"use client";

import { useContext, createContext, useEffect, useRef, useId, useState, useSyncExternalStore, useTransition, type FormEvent, type ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Trash2,
  CheckCircle2,
  RotateCcw,
  Plus,
  Loader2,
  ArrowRight,
  ChevronDown,
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  Globe2,
  Image,
  Link2,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  Phone,
  ShieldCheck,
  StickyNote,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClientAction, updateClientAction, type Client, type ClientProfile, type ClientShared, type ClientStatus, type StaffOption } from "@/app/actions/clients";
import { formErrorBanner } from "@/component/shared/ui";
import {
  BEST_TIMES,
  BILLING_CYCLES,
  BILLING_DAYS,
  BUSINESS_TYPES,
  CANCELLATION_NOTICES,
  CLIENT_NEEDS,
  COMMUNICATION_METHODS,
  CONTRACT_TERMS,
  DELIVERY_PORTAL,
  INDUSTRIES,
  NEEDS_LOGO,
  OTHER,
  PAYMENT_METHODS,
  PERKS,
  PORTAL_MENUS,
  RENEWAL_REMINDERS,
  RENEWAL_TYPES,
  REPORT_DELIVERIES,
  SERVICES,
  SETUP_FEES,
  SOCIAL_PROFILES,
  SOCIAL_TRANSFER,
  TIME_ZONES,
  WEBSITE_TRANSFER,
  NOTES_LIMIT,
  ONBOARDING_STATUS_LABELS,
  REACH_BY,
  contractEnd,
  countsOf,
  avatarColorFor,
  formatDate,
  formatDateTime,
  groupsOf,
  initialsOf,
  money,
  portalMenusOf,
  sharedOf,
  todayInputValue,
  uploadsOf,
} from "./clientUi";
import { FileManager, type UploadKind } from "./OnboardingReview";
import type { OnboardingFile } from "@/app/actions/onboarding";
import { ONBOARDING_STEPS } from "./StepTicks";
import { DEFAULT_NOT_NEEDED, tickedIn, ticksOf } from "./OnboardingControls";

// The form a client is added with — and edited with: five parts (who they are, their
// business, what they are buying, what is being taken over from them, and their contract and
// account), with a few notes beside it.
//
// The contact details, the status, the notes and the services' names sit on the client itself;
// everything else the form asks is saved together as the client's `details` (see ClientProfile),
// and comes back from there when the client is edited. The two file pickers (the logo, the
// signed contract) only show what was picked: nothing is uploaded yet.

// The form is set in its own two faces: Inter for the form, Fraunces for its title.
const inter = Inter({ subsets: ["latin"] });
const fraunces = Fraunces({ subsets: ["latin"] });

// ── Looks ────────────────────────────────────────────────────────────────────

const rowClass = "grid grid-cols-2 gap-4.5 max-[640px]:grid-cols-1";
const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-[#334155]";
const smallLabelClass = "mb-1.5 block text-[12px] font-medium text-[#475569]";
// What every field shares: the border darkens under the pointer, and turns blue with a soft ring when typed in.
const fieldLook =
  "w-full rounded-xl border border-[#dbe3ed] bg-[#fbfdff] text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-[#94a3b8] hover:border-[#b8c6d7] focus:border-[#2563eb] focus:bg-white focus:ring-3 focus:ring-[#2563eb]/12 focus:outline-none";
const inputClass = `${fieldLook} px-3.5 py-2.75 text-[14.5px]`;
// The same field inside a service or a sub-box: a little smaller.
const smallInputClass = `${fieldLook} px-3 py-2.25 text-[14px]`;
const hintClass = "mt-1.5 text-[12.5px] leading-normal text-[#6b7280]";
const subBoxClass = "mt-3 rounded-xl border border-[#dbe7f5] bg-[#f8fbff] p-4";
const uploadClass =
  "block cursor-pointer rounded-xl border-[1.5px] border-dashed border-[#bfdbfe] bg-[#f8fbff] text-center text-[14px] text-[#64748b] transition-colors duration-150 hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb]";
const radioClass =
  "flex cursor-pointer items-center gap-2 rounded-xl border border-[#dbe3ed] bg-white px-3.5 py-2.5 text-[14px] font-medium transition-colors duration-150 hover:border-[#93c5fd] has-[:checked]:border-[#86efac] has-[:checked]:bg-[#f0fdf4] has-[:checked]:text-[#15803d]";
const listClass = "rounded-xl border border-[#dbe7f5] bg-[#fbfdff] p-4.5";
const tickClass = "flex cursor-pointer items-center gap-2 py-[5px] text-[14px] text-[#111827]";
const checkboxClass = "size-4 flex-none accent-[#2563eb]";
const addButtonClass =
  "cursor-pointer rounded-lg border border-[#dbe3ed] bg-white px-3 py-2 text-[13px] font-semibold whitespace-nowrap text-[#475569] transition-colors duration-150 hover:border-[#93c5fd] hover:text-[#2563eb]";
const subheadClass = "mt-3 mb-4 border-t border-[#eef0f3] pt-5 text-[15px] font-bold text-[#0f172a]";
const buttonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border px-5.5 py-2.75 text-[14.5px] font-semibold transition-colors duration-150 disabled:cursor-wait disabled:opacity-70";
// A card beside the form.
const sideCardClass = "rounded-2xl border p-5 shadow-[0_4px_14px_rgba(15,23,42,0.03)]";

const ICONS = {
  people: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </>
  ),
  dollar: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  checklist: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
};

const STATUSES: [ClientStatus, string][] = [
  ["onboarding", "Onboarding"],
  ["active", "Active"],
  ["pending", "Pending onboarding"],
  ["on_hold", "On hold"],
  ["closed", "Closed"],
];

// ── Small pieces ─────────────────────────────────────────────────────────────

const Icon = ({ name, tone = "blue" }: { name: keyof typeof ICONS; tone?: "blue" | "green" | "amber" | "purple" | "slate" }) => {
  const tones = {
    blue: "bg-[#eaf2ff] text-[#2563eb] ring-[#dbeafe]",
    green: "bg-[#ecfdf3] text-[#15803d] ring-[#bbf7d0]",
    amber: "bg-[#fffbeb] text-[#b45309] ring-[#fde68a]",
    purple: "bg-[#f5f3ff] text-[#7c3aed] ring-[#ddd6fe]",
    slate: "bg-[#f1f5f9] text-[#475569] ring-[#e2e8f0]",
  };
  return (
  <div className={`grid size-11 flex-none place-items-center rounded-xl ring-1 ${tones[tone]}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-[22px]" aria-hidden="true">
      {ICONS[name]}
    </svg>
  </div>
  );
};

const Star = () => <span className="text-[#dc2626]">*</span>;

// The edit form uses the same visual language as the client detail view: every piece of
// information has an icon and a clearly bounded home. Labels that don't need a bespoke icon
// fall back to a document icon, rather than leaving an empty visual marker.
const FIELD_ICONS: Record<string, LucideIcon> = {
  "Contact name": User,
  "Company name": Building2,
  Email: Mail,
  Phone: Phone,
  Address: MapPin,
  "Preferred communication method": MessageSquare,
  "Best time to reach them": Bell,
  "Time zone": Globe2,
  Industry: BriefcaseBusiness,
  "Business type": Building2,
  "Website URL": Globe2,
  "Google Business Profile": MapPin,
  "Service area": MapPin,
  "Target audience": Users,
  Competitors: Link2,
  "Social media profiles": Link2,
  "Does the client have a logo?": Palette,
  "Logo design price (one-time)": DollarSign,
  "Number of concepts": Image,
  "Style preferences": Palette,
  "Other details": FileText,
  "Contract start date": CalendarDays,
  "Contract length": CalendarDays,
  "Contract end date": CalendarDays,
  "Renewal type": Bell,
  "Cancellation notice": Bell,
  "Renewal reminder": Bell,
  "Is the contract signed?": ShieldCheck,
  "Date signed": CalendarDays,
  "Signed contract": FileText,
  "Date sent": CalendarDays,
  "Is a payment method on file?": CreditCard,
  "Payment method": CreditCard,
  "Billing cycle": CreditCard,
  "Billing day": CalendarDays,
  "Setup fee paid?": DollarSign,
  Status: ShieldCheck,
  "Account manager": User,
  "Report delivery": Mail,
  "Portal password": ShieldCheck,
  "Current portal password": ShieldCheck,
  "Assigned staff": Users,
  "Confirm password": ShieldCheck,
  "What the client sees in their portal": Users,
  "Internal notes": StickyNote,
};

// The form's five parts, by step. Opened from a part's Edit on the client's page, every part is
// there but only that one starts open; the others open when clicked. Without it, all are open.
const SECTION_TITLES = ["Client information", "Business details", "Services and pricing", "Onboarding and transfer", "Account setup"];
const OpenSteps = createContext<{ isOpen: (step: number) => boolean; toggle: (step: number) => void } | undefined>(undefined);

// One custom service to fill in: its name, price, how often it is paid (with a deadline when it is
// paid once), and what it includes. In the custom services list, and on a client's request
// before it is added to it.
const CustomServiceEditor = ({
  custom,
  change,
  idPrefix,
  onRemove,
  footer,
  tone = "border-[#e2e8f0]",
}: {
  custom: CustomService;
  change: (patch: Partial<CustomService>) => void;
  idPrefix: string;
  onRemove?: () => void;
  footer?: ReactNode;
  tone?: string;
}) => (
    <div className={`rounded-lg border bg-white p-2.5 ${tone}`}>
    {/* On one line: its name, price, how often it is paid, the deadline for one paid once, and remove. */}
    <div
      className={`grid items-center gap-2.5 max-[640px]:grid-cols-1 ${onRemove ? "grid-cols-[minmax(0,1fr)_130px_100px_160px_36px]" : "grid-cols-[minmax(0,1fr)_130px_100px_160px]"}`}
    >
      <input className={inputClass} placeholder="Service name, e.g. Landing page" aria-label="Service name" value={custom.name} maxLength={150} onChange={(event) => change({ name: event.target.value })} />
      <NumberInput id={`${idPrefix}-price`} value={custom.price} onChange={(value) => change({ price: value })} dollars />
      {/* A custom service is always paid once. */}
      <span className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-center text-[12px] font-semibold text-[#c2410c]">One-time</span>
      {custom.billing === "one_time" ? (
        // Named inside the box, so the line stays one line.
        <label className={`${fieldLook} flex cursor-pointer flex-col justify-center px-3 py-1 focus-within:border-[#2563eb] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#2563eb]/12`}>
          <span className="text-[10.5px] leading-tight font-semibold tracking-[0.04em] text-[#64748b] uppercase">Deadline</span>
          <input type="date" className="w-full cursor-pointer border-0 bg-transparent p-0 text-[13.5px] leading-tight text-[#0f172a] outline-none" value={custom.deadline} onChange={(event) => change({ deadline: event.target.value })} />
        </label>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${custom.name || "this service"}`}
          onClick={onRemove}
          className="grid size-9 cursor-pointer place-items-center rounded-lg text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      ) : null}
    </div>
    {/* What the service covers: a list to tick, as for the services above. */}
    <div className="mt-3 border-t border-[#f1f5f9] pt-3">
      <div className={smallLabelClass}>What&apos;s included</div>
      {custom.included.length ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-x-4 gap-y-0.5">
          {custom.included.map((item, at) => (
            <label key={`${item.text}-${at}`} className={tickClass}>
              <input
                type="checkbox"
                checked={item.on}
                onChange={(event) => change({ included: custom.included.map((old, position) => (position === at ? { ...old, on: event.target.checked } : old)) })}
                className={checkboxClass}
              />
              {item.text}
            </label>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex gap-2">
        <input
          className={`${smallInputClass} py-2 text-[14px]`}
          placeholder="Add another item"
          aria-label={`Add an item to ${custom.name || "this service"}`}
          maxLength={150}
          value={custom.draft}
          onChange={(event) => change({ draft: event.target.value })}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const item = custom.draft.trim();
            if (item) change({ included: [...custom.included, { text: item, on: true }], draft: "" });
          }}
        />
        <button
          type="button"
          className={addButtonClass}
          onClick={() => {
            const item = custom.draft.trim();
            if (item) change({ included: [...custom.included, { text: item, on: true }], draft: "" });
          }}
        >
          Add
        </button>
      </div>
    </div>
      {footer}
    </div>
);

// Where a part stands, in its badge (as on the client's page — ClientDetails).
type PartBadge = { label: string; tone: "done" | "partly" | "money" };
const PART_BADGES = { done: "bg-[#dcfce7] text-[#15803d]", partly: "bg-[#eef2f7] text-[#475569]", money: "bg-[#dcfce7] text-[#15803d]" };
export const filledBadge = (values: unknown[]): PartBadge => {
  const filled = values.filter((value) => (Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim() !== "" : Boolean(value))).length;
  return { label: `${filled} / ${values.length} filled`, tone: filled === values.length ? "done" : "partly" };
};

// One of the form's five parts, laid out as on the client's page: closed to a line — its step,
// icon, name, a few of its answers and where it stands — and opened by clicking it, to edit.
// With `href`, it is a link to a page of its own instead (the onboarding).
const Section = ({
  icon,
  step,
  title,
  sub,
  chips = [],
  badge,
  href,
  onOpen,
  busy = false,
  children,
}: {
  icon: keyof typeof ICONS;
  step: number;
  title: ReactNode;
  sub: string;
  chips?: string[];
  badge?: PartBadge;
  href?: string;
  // Instead of `href`: what clicking it does (save the form, then go to its page).
  onOpen?: () => void;
  busy?: boolean;
  children?: ReactNode;
}) => {
  const tones = ["blue", "green", "amber", "purple", "slate"] as const;
  const steps = useContext(OpenSteps);
  const open = !href && !onOpen && (steps ? steps.isOpen(step) : true);
  const bodyId = useId();
  const shownChips = chips.map((chip) => chip.trim()).filter(Boolean);
  const head = (
    <>
      <Icon name={icon} tone={tones[step - 1]} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[10.5px] font-bold tracking-[0.08em] text-[#64748b] uppercase">Step {step} of 5</div>
        <h2 className="text-[17px] leading-tight font-bold text-[#0f172a]">{title}</h2>
        {open || !shownChips.length ? (
          <p className="mt-1 text-[12.5px] text-[#64748b]">{sub}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {shownChips.map((chip, index) => (
              <span key={index} className="max-w-65 truncate rounded-md bg-[#f1f5f9] px-2 py-1 text-[12px] font-medium text-[#334155]" title={chip}>
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
      {badge ? <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap tabular-nums ${PART_BADGES[badge.tone]}`}>{badge.label}</span> : null}
    </>
  );

  if (onOpen) {
    return (
      <section id={`section-${step}`} className="mb-5 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)] transition-shadow hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
        <button type="button" onClick={onOpen} disabled={busy} className="group flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left disabled:cursor-wait max-[640px]:px-4.5">
          {head}
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] transition-colors group-hover:border-[#2563eb] group-hover:text-[#2563eb]">
            {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} strokeWidth={2.25} />}
          </span>
        </button>
      </section>
    );
  }

  if (href) {
    return (
      <section id={`section-${step}`} className="mb-5 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)] transition-shadow hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
        <Link href={href} className="group flex items-center gap-4 px-6 py-5 no-underline max-[640px]:px-4.5">
          {head}
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] transition-colors group-hover:border-[#2563eb] group-hover:text-[#2563eb]">
            <ArrowRight size={17} strokeWidth={2.25} />
          </span>
        </Link>
      </section>
    );
  }

  return (
    <section
      id={`section-${step}`}
      className={`mb-5 scroll-mt-6 overflow-hidden rounded-2xl border bg-white transition-shadow ${
        open ? "border-[#cfdcf3] shadow-[0_8px_24px_rgba(15,23,42,0.07)]" : "border-[#e2e8f0] shadow-[0_4px_16px_rgba(15,23,42,0.035)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
      }`}
    >
      <div className={`flex cursor-pointer items-center gap-4 px-6 py-5 max-[640px]:px-4.5 ${open ? "border-b border-[#eef2f7]" : ""}`} onClick={() => steps?.toggle(step)}>
        {head}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={`${open ? "Close" : "Open"} ${SECTION_TITLES[step - 1]}`}
          onClick={(event) => {
            event.stopPropagation();
            steps?.toggle(step);
          }}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
        >
          <ChevronDown size={17} strokeWidth={2.25} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {/* Grows and shrinks smoothly to its own height; closed, it stays filled in and is saved as it is. */}
      <div id={bodyId} className={`grid transition-[grid-template-rows] duration-250 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className="px-6 pt-5 pb-6 max-[640px]:px-4.5">{children}</div>
        </div>
      </div>
    </section>
  );
};

// A label, what it labels, and a line under it. Without `htmlFor` it heads a group of choices.
const Field = ({
  label,
  htmlFor,
  required = false,
  small = false,
  icon,
  hint,
  className = "mb-5",
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  small?: boolean;
  icon?: LucideIcon;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) => {
  const labelText = typeof label === "string" ? label : "";
  const FieldIcon = icon ?? FIELD_ICONS[labelText] ?? FileText;
  const text = (
    <>
      {label} {required ? <Star /> : null}
    </>
  );
  return (
    <div className={`${className} rounded-xl border ${required ? "border-[#bbf7d0] bg-[#f4fbf6]" : "border-[#e2e8f0] bg-[#fbfdff]"} ${small ? "p-3" : "p-3.5"}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex shrink-0 items-center justify-center rounded-lg ${small ? "size-7" : "size-8"} ${required ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#eff6ff] text-[#2563eb]"}`}>
          <FieldIcon size={small ? 14 : 15} strokeWidth={2} />
        </span>
        {htmlFor ? (
          <label htmlFor={htmlFor} className={`${small ? smallLabelClass : labelClass} mb-0`}>
            {text}
          </label>
        ) : (
          <div className={`${small ? smallLabelClass : labelClass} mb-0`}>{text}</div>
        )}
      </div>
      <div className={small ? "mt-2.5" : "mt-3"}>{children}</div>
      {hint ? <div className={hintClass}>{hint}</div> : null}
    </div>
  );
};

const Select = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  disabled = [],
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  // Plain choices, or [value, label] pairs.
  options: readonly (string | readonly [string, string])[];
  placeholder?: string;
  required?: boolean;
  disabled?: string[];
}) => (
  <select id={id} className={inputClass} value={value} required={required} onChange={(event) => onChange(event.target.value)}>
    {placeholder ? <option value="">{placeholder}</option> : null}
    {options.map((option) => {
      const [choice, label] = typeof option === "string" ? [option, option] : option;
      return (
        <option key={choice} value={choice} disabled={disabled.includes(choice)}>
          {label}
        </option>
      );
    })}
  </select>
);

// A number: a count, or (with `money`) an amount in dollars.
const NumberInput = ({ id, value, onChange, dollars = false, min = 0 }: { id?: string; value: string; onChange: (value: string) => void; dollars?: boolean; min?: number }) => {
  const input = (
    <input
      id={id}
      type="number"
      min={min}
      step={dollars ? 0.01 : undefined}
      className={`${smallInputClass} ${dollars ? "pl-6" : ""}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
  if (!dollars) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#6b7280]">$</span>
      {input}
    </div>
  );
};

// One answer out of a few, as a row of boxes.
const Radios = ({ name, value, onChange, options }: { name: string; value: string; onChange: (value: string) => void; options: [value: string, label: string][] }) => (
  <div className="flex flex-wrap gap-2.5">
    {options.map(([choice, label]) => (
      <label key={choice} className={radioClass}>
        <input type="radio" name={name} value={choice} checked={value === choice} onChange={() => onChange(choice)} className="accent-[#2563eb]" />
        {label}
      </label>
    ))}
  </div>
);

// ── What the form holds ──────────────────────────────────────────────────────

// The plain answers: typed, or picked from a list.
const BLANK = {
  bestTime: BEST_TIMES[0],
  timeZone: TIME_ZONES[0],
  industry: "",
  industryOther: "",
  businessType: "",
  businessTypeOther: "",
  website: "",
  gbp: "",
  serviceArea: "",
  audience: "",
  competitors: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  tiktok: "",
  youtube: "",
  x: "",
  logoPrice: "350",
  logoConcepts: "3",
  logoStyle: "",
  otherDetails: "",
  term: "12",
  renewal: RENEWAL_TYPES[1],
  cancellation: CANCELLATION_NOTICES[1],
  reminder: RENEWAL_REMINDERS[2],
  dateSigned: "",
  dateSent: "",
  payMethod: PAYMENT_METHODS[0],
  billingCycle: BILLING_CYCLES[0],
  billingDay: BILLING_DAYS[0],
  setupFee: SETUP_FEES[0],
  accountManager: "",
  delivery: REPORT_DELIVERIES[0],
};
type Answers = typeof BLANK;

// A service the team names itself, priced each month or once.
type Billing = "monthly" | "one_time";
// What it covers is a list to tick, as for the services above: unticked items stay on the form
// but aren't saved.
// A one-time service has a deadline.
type CustomService = {
  key: string;
  name: string;
  price: string;
  billing: Billing;
  deadline: string;
  included: { text: string; on: boolean }[];
  draft: string;
  // The work is finished: kept on the client as history, not billed (backend: status "done").
  done?: boolean;
};

// A choice that isn't on the list was typed in under "Other".
const choiceOf = (saved: string | undefined, choices: string[]): [choice: string, other: string] => (!saved ? ["", ""] : choices.includes(saved) ? [saved, ""] : [OTHER, saved]);

// The plain answers as they were saved for a client — or the form's defaults, for a new one
// and for anything a client from before the form asked doesn't have.
const answersFor = (client?: Client): Answers => {
  const saved = client?.details;
  // What the onboarding form asks too is kept with its answers, whoever gave them.
  const shared = sharedOf(client);
  const common = {
    website: shared.website,
    gbp: shared.googleBusinessProfile,
    competitors: shared.competitors.length ? shared.competitors.map((row) => row.url || row.note).join(", ") : shared.competitorsBefore,
    ...shared.social,
    logoStyle: shared.logoStyle,
  };
  // Where the team hasn't said where the client works, the areas the client named themselves.
  const areas = (client?.onboarding?.business?.areas ?? []).join(", ").slice(0, 300);
  if (!client || !saved) return { ...BLANK, ...common, serviceArea: areas, accountManager: managerIdOf(client) };
  const { communication = {}, business = {}, contract = {}, billing = {} } = saved;
  const [industry, industryOther] = choiceOf(business.industry, INDUSTRIES);
  const [businessType, businessTypeOther] = choiceOf(business.businessType, BUSINESS_TYPES);
  return {
    bestTime: communication.bestTime ?? BLANK.bestTime,
    timeZone: communication.timeZone ?? BLANK.timeZone,
    industry,
    industryOther,
    businessType,
    businessTypeOther,
    ...common,
    serviceArea: business.serviceArea || areas,
    audience: business.targetAudience ?? "",
    logoPrice: String(business.logoDesign?.price ?? BLANK.logoPrice),
    logoConcepts: String(business.logoDesign?.concepts ?? BLANK.logoConcepts),
    otherDetails: business.otherDetails ?? "",
    // A saved contract with no length was a custom one.
    term: contract.termMonths ? String(contract.termMonths) : saved.contract ? "" : BLANK.term,
    renewal: contract.renewal ?? BLANK.renewal,
    cancellation: contract.cancellationNotice ?? BLANK.cancellation,
    reminder: contract.renewalReminder ?? BLANK.reminder,
    dateSigned: contract.dateSigned ?? "",
    dateSent: contract.dateSent ?? "",
    payMethod: billing.method ?? BLANK.payMethod,
    billingCycle: billing.cycle ?? BLANK.billingCycle,
    billingDay: billing.day ?? BLANK.billingDay,
    setupFee: billing.setupFee ?? BLANK.setupFee,
    accountManager: managerIdOf(client),
    delivery: saved.reportDelivery ?? BLANK.delivery,
  };
};

// What the client already has, as their own answers say it (CLIENT_HAS's keys) — where the
// form starts for a client the team hasn't recorded this for yet. Nothing for a client who
// hasn't answered anything.
const hasFrom = (client?: Client): string[] | undefined => {
  const said = client?.onboarding;
  if (!said) return undefined;
  const yes = (account?: { has?: string }) => account?.has === "yes";
  const shared = sharedOf(client);
  const list: [key: string, has: boolean][] = [
    ["website", Boolean(shared.website) && !shared.hasNoWebsite],
    ["domain", said.domain?.has === "yes"],
    ["hosting", said.hosting?.has === "yes"],
    ["logo", shared.hasLogo === true],
    ["gbp", yes(said.google?.businessProfile)],
    ["social", [said.social?.facebook, said.social?.instagram, said.social?.youtube, said.social?.linkedin, said.social?.tiktok, said.social?.x].some(yes)],
    ["analytics", yes(said.google?.analytics) || yes(said.google?.searchConsole)],
    ["ads", yes(said.google?.ads) || yes(said.social?.metaAds)],
    ["media", uploadsOf(said).some((group) => !group.title.startsWith("Logo"))],
  ];
  return list.filter(([, has]) => has).map(([key]) => key);
};

// A compact, factual activity summary beside an existing client's edit form. The detailed
// answers live on their record; keeping the sidebar short makes the form easier to work through.
const ClientSaid = ({ client }: { client: Client }) => {
  const said = client.onboarding;
  const { answered, total } = countsOf(groupsOf({ onboarding: said ?? { status: "in_progress" } }));
  const progress = total ? Math.round((answered / total) * 100) : 0;
  const activities: [label: string, value: string, tone: "green" | "amber" | "slate"][] = [
    ["Client added", formatDate(client.createdAt), "green"],
    ["Latest update", formatDateTime(client.updatedAt), "slate"],
    ...(said?.status ? [["Onboarding", `${ONBOARDING_STATUS_LABELS[said.status]} · ${progress}% complete`, said.status === "submitted" ? "green" : "amber"] as [string, string, "green" | "amber" | "slate"]] : []),
    ...(said?.submittedAt ? [["Submitted", formatDate(said.submittedAt), "green"] as [string, string, "green" | "amber" | "slate"]] : []),
  ];
  const tones = {
    green: "border-[#bbf7d0] bg-[#f4fbf6] text-[#15803d]",
    amber: "border-[#fde68a] bg-[#fffbeb] text-[#a16207]",
    slate: "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]",
  };

  return (
    <div className={`${sideCardClass} border-[#bfdbfe] bg-[#f8fbff]`}>
      <div className="mb-4 border-b border-[#dbeafe] pb-3">
        <div className="text-[10.5px] font-bold tracking-[0.08em] text-[#2563eb] uppercase">Client activity</div>
        <h3 className="mt-1 text-[16px] leading-snug font-semibold text-[#0f172a]">Record progress</h3>
        <p className="mt-1 text-[12px] leading-normal text-[#64748b]">The latest milestones for this client.</p>
      </div>
      <dl className="flex flex-col gap-2.5">
        {activities.map(([label, value, tone]) => (
          <div key={label} className={`rounded-lg border px-3 py-2.5 ${tones[tone]}`}>
            <dt className="text-[11px] font-semibold">{label}</dt>
            <dd className="mt-0.5 text-[12.5px] leading-snug font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href={`/clients/${client._id}`} className="mt-4 inline-flex items-center rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-[#2563eb] no-underline hover:bg-[#eff6ff]">
        View full client details →
      </Link>
    </div>
  );
};

const managerIdOf = (client?: Client) => {
  // A manager who was deleted comes back as null.
  const manager = client?.accountManager;
  return manager && typeof manager === "object" ? manager._id : (manager ?? "");
};

// A service as it is being set up for this client. Numbers are kept as typed.
type ServiceState = { on: boolean; values: string[]; included: { text: string; on: boolean }[]; addons: string[]; adding: string };

// Each service as it was set up for the client, or — for one they don't have, or had before
// its details were kept — with its default quantities and prices.
const servicesFor = (client?: Client): ServiceState[] =>
  SERVICES.map((service) => {
    const plan = client?.details?.services?.find((saved) => saved.name === service.name);
    return {
      on: Boolean(client?.serviceTypes.includes(service.name)),
      values: service.fields.map((field) => String(plan?.fields.find((saved) => saved.label === field.label)?.value ?? field.value)),
      included: [
        ...service.includes.map((text) => ({ text, on: plan ? plan.included.includes(text) : true })),
        // Items that were added for this client.
        ...(plan?.included ?? []).filter((text) => !service.includes.includes(text)).map((text) => ({ text, on: true })),
      ],
      addons: service.addons.map(([label, price]) => String(plan?.addons.find((saved) => saved.label === label)?.price ?? price)),
      adding: "",
    };
  });

const amountOf = (state: ServiceState, index: number) => SERVICES[index].amount(state.values.map((value) => parseFloat(value) || 0));

const subscribeNever = () => () => {};

const number = (value: string) => parseFloat(value) || 0;

// Pass `client` to edit an existing one; leave it out to add a new one. `staff` are the team
// members an account manager can be picked from. `backHref` is where Cancel goes, when not the
// client's own page (or the list, for a new one).
export const ClientForm = ({ client, staff = [], backHref: cancelHref, only: onlyAsked }: { client?: Client; staff?: StaffOption[]; backHref?: string; only?: number }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const id = useId();
  const isEdit = Boolean(client);
  // The part opened from its Edit: for a client being edited, and a part the form has.
  const only = client && onlyAsked && onlyAsked >= 1 && onlyAsked <= SECTION_TITLES.length ? onlyAsked : undefined;
  // Which parts are open: the one asked for (and brought into view), or — for a new client — the
  // first. The rest open when clicked.
  const [openSteps, setOpenSteps] = useState<number[]>(only ? [only] : client ? [] : [1]);
  const steps = { isOpen: (step: number) => openSteps.includes(step), toggle: (step: number) => setOpenSteps((now) => (now.includes(step) ? now.filter((at) => at !== step) : [...now, step])) };
  useEffect(() => {
    if (only) document.getElementById(`section-${only}`)?.scrollIntoView({ block: "start" });
  }, [only]);
  const backHref = cancelHref ?? (client ? `/clients/${client._id}` : "/clients");
  const saved = client?.details;

  // ── Step 1: who they are ──
  const [contactName, setContactName] = useState(client?.contactName ?? "");
  const [companyName, setCompanyName] = useState(client?.companyName ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  // Until the team says otherwise: the way the client asked to be reached, if they said.
  const [methods, setMethods] = useState<string[]>(() => saved?.communication?.methods ?? [REACH_BY[client?.onboarding?.business?.contact?.reachBy ?? ""] ?? COMMUNICATION_METHODS[0]]);

  const [answers, setAnswers] = useState<Answers>(() => answersFor(client));
  const put = (key: keyof Answers) => (value: string) => setAnswers((now) => ({ ...now, [key]: value }));
  const typed = (key: keyof Answers) => ({ value: answers[key], onChange: (event: { target: { value: string } }) => put(key)(event.target.value) });

  // ── Step 2: the logo, which also decides two ticks in step 4 ──
  const [logo, setLogoAnswer] = useState<"yes" | "no">(() => (sharedOf(client).hasLogo === false ? "no" : "yes"));
  const [logoAdd, setLogoAddAnswer] = useState(saved?.business?.logoDesign?.add ?? true);
  // The logo files on the client's record (uploaded by them, or by the team below), and what
  // shows the style of one to be designed. Uploading saves them at once — only for a client
  // already saved, as the files go onto its record.
  const [logoFiles, setLogoFiles] = useState(() => client?.onboarding?.logo?.files ?? []);
  const [logoStyleFiles, setLogoStyleFiles] = useState(() => client?.onboarding?.logo?.styleFiles ?? []);
  const setUploads = (kind: UploadKind, files: OnboardingFile[]) => (kind === "logoStyle" ? setLogoStyleFiles(files) : setLogoFiles(files));

  // ── Step 3: services ──
  const [services, setServices] = useState<ServiceState[]>(() => servicesFor(client));
  // Services saved on the client that this form doesn't list: kept, so saving doesn't drop them.
  // Services the team names itself (not on the list above): a name, a price, and whether it is
  // paid each month or once. A service saved on the client with no price yet comes in too.
  const [customs, setCustoms] = useState<CustomService[]>(() => {
    const recorded = (client?.details?.services ?? []).filter((plan) => plan.custom);
    const unpriced = (client?.serviceTypes ?? []).filter((name) => !SERVICES.some((service) => service.name === name) && !recorded.some((plan) => plan.name === name));
    return [
      ...recorded.map((plan) => ({
        key: plan.name,
        name: plan.name,
        price: String(plan.oneTime || plan.monthly || ""),
        // Always paid once — one saved as monthly before becomes one-time.
        billing: "one_time" as Billing,
        deadline: plan.deadline ?? "",
        included: (plan.included ?? []).map((text) => ({ text, on: true })),
        draft: "",
        done: plan.status === "done",
      })),
      ...unpriced.map((name) => ({ key: name, name, price: "", billing: "one_time" as Billing, deadline: "", included: [], draft: "" })),
    ];
  });
  // Running ones only: a finished one is history.
  const otherServices = customs.filter((custom) => !custom.done).map((custom) => custom.name.trim()).filter(Boolean);
  const changeCustom = (index: number, patch: Partial<CustomService>) => setCustoms((now) => now.map((entry, at) => (at === index ? { ...entry, ...patch } : entry)));
  // The client's requests the team answers here, by id: added as a custom service, or set aside.
  // Saved with the form.
  const [answeredRequests, setAnsweredRequests] = useState<Record<string, "added" | "dismissed">>({});
  // Open requests — but not one whose service the client already has, under the same name.
  const takenNames = new Set([...(client?.details?.services ?? []).map((plan) => plan.name.trim().toLowerCase()), ...(client?.serviceTypes ?? []).map((name) => name.trim().toLowerCase())]);
  const openRequests = (client?.serviceRequests ?? []).filter((request) => request.status === "open" && !takenNames.has(request.name.trim().toLowerCase()));
  // Each open request filled in as a custom service before it is added: its name to start with.
  const [requestDrafts, setRequestDrafts] = useState<Record<string, CustomService>>({});
  const draftOf = (request: { _id: string; name: string }): CustomService =>
    requestDrafts[request._id] ?? { key: `request-${request._id}`, name: request.name, price: "", billing: "one_time", deadline: "", included: [], draft: "" };
  const changeService = (index: number, change: (state: ServiceState) => ServiceState) => setServices((now) => now.map((state, at) => (at === index ? change(state) : state)));

  // ── Step 4: what they have, what they need, and what is being handed over ──
  // The step itself is now the onboarding controls (OnboardingControls.tsx): which steps and
  // items of the onboarding form this client needs — the rest are left off their form — and
  // which the account manager has approved.
  // Which steps the client is asked is ticked on the onboarding page; the form sends it back as it was.
  const [notNeeded] = useState(() => ticksOf(client?.onboarding?.notNeeded ?? DEFAULT_NOT_NEEDED));
  // Approving is done on the onboarding page; the form sends it back as it was.
  const [approved] = useState(() => ticksOf(client?.onboarding?.approved));
  // These are no longer asked on the form: they are held as they were saved — but for the
  // logo, which step 2 still decides — so that saving the client doesn't lose them.
  const [has, setHas] = useState<string[]>(() => saved?.transfer?.has ?? hasFrom(client) ?? ["logo"]);
  const [needs, setNeeds] = useState(() => {
    const ticked = saved?.transfer?.needs ?? [];
    // The ones on the list, then any that were added for this client.
    return [...CLIENT_NEEDS.map((text) => ({ text, on: ticked.includes(text) })), ...ticked.filter((text) => !CLIENT_NEEDS.includes(text)).map((text) => ({ text, on: true }))];
  });
  const [websiteTicks] = useState<boolean[]>(() => WEBSITE_TRANSFER.map((item) => Boolean(saved?.transfer?.websiteDone?.includes(item))));
  const [socialTicks] = useState<boolean[]>(() => SOCIAL_TRANSFER.map((item) => Boolean(saved?.transfer?.socialDone?.includes(item))));

  // Having a logo, or needing one designed, shows in both places.
  const syncLogo = (answer: "yes" | "no", add: boolean) => {
    setHas((now) => (answer === "yes" ? [...new Set([...now, "logo"])] : now.filter((item) => item !== "logo")));
    setNeeds((now) => now.map((need) => (need.text === NEEDS_LOGO ? { ...need, on: answer === "no" && add } : need)));
  };
  const setLogo = (answer: "yes" | "no") => {
    setLogoAnswer(answer);
    syncLogo(answer, logoAdd);
  };
  const setLogoAdd = (add: boolean) => {
    setLogoAddAnswer(add);
    syncLogo(logo, add);
  };

  // ── Step 5: contract, billing and the account ──
  // A new client starts today unless another date is picked. "Today" depends on the visitor's
  // timezone, which the server can't know, so it is read in the browser only.
  const today = useSyncExternalStore(subscribeNever, todayInputValue, () => "");
  const [pickedStartDate, setPickedStartDate] = useState<string | null>(client?.startDate?.slice(0, 10) ?? null);
  const startDate = pickedStartDate ?? today;
  // The end date follows the start date and the length until it is typed over; changing
  // either of those takes it back.
  const [pickedEndDate, setPickedEndDate] = useState<string | null>(saved?.contract?.endDate ?? null);
  const endDate = pickedEndDate ?? (answers.term ? contractEnd(startDate, Number(answers.term)) : "");
  const [signed, setSigned] = useState<string>(saved?.contract?.signed ?? "sent");
  const [contractFile, setContractFile] = useState("");
  const [payOnFile, setPayOnFile] = useState(saved?.billing?.paymentOnFile ? "yes" : "no");
  const [status, setStatus] = useState<ClientStatus>(client?.status ?? "pending");
  // A typed password creates the client's portal login, or replaces an existing client's
  // password; left blank, nothing about the login changes.
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notes, setNotes] = useState(client?.notes ?? "");
  // The portal pages the client is shown: all of them, until some are taken away — or, for a
  // client who signed up themselves and hasn't been given more, only the first ones.
  const [menus, setMenus] = useState<string[]>(() => (client ? portalMenusOf(client) : undefined) ?? PORTAL_MENUS.map(([key]) => key));

  const changePassword = password !== "";
  // The client has (or will have) a portal login.
  const portal = Boolean(client?.user) || changePassword;

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const toOnboarding = useRef(false);
  const [openingOnboarding, setOpeningOnboarding] = useState(false);
  // The staff assigned to the client, by id.
  const [team, setTeam] = useState<string[]>(() => (client?.team ?? []).map((member) => (typeof member === "object" ? member._id : member)));
  const [showCurrent, setShowCurrent] = useState(false);

  // The team to choose from — with the client's present manager among them even when the team
  // couldn't be listed, so that saving doesn't take them off.
  const present = client?.accountManager && typeof client.accountManager === "object" ? client.accountManager : undefined;
  const managers: [string, string][] = [...staff, ...(present && !staff.some((member) => member._id === present._id) ? [present] : [])].map((member) => [member._id, member.fullName]);

  const customTotal = (billing: Billing) => customs.reduce((sum, custom) => (custom.name.trim() && !custom.done && custom.billing === billing ? sum + (parseFloat(custom.price) || 0) : sum), 0);
  const monthly = services.reduce((sum, state, index) => (state.on ? sum + amountOf(state, index) : sum), 0) + customTotal("monthly");
  const oneTime = (logo === "no" && logoAdd ? parseFloat(answers.logoPrice) || 0 : 0) + customTotal("one_time");
  const hasWebsite = has.includes("website");
  const hasSocial = has.includes("social");
  const passwordsMatch = confirmPassword !== "" && confirmPassword === password;
  const passwordsMismatch = confirmPassword !== "" && confirmPassword !== password;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    // Whether this save was asked for on the way to the onboarding page (the part that opens it).
    const thenOnboarding = toOnboarding.current;
    toOnboarding.current = false;

    const refuse = (message: string) => {
      setError(message);
      toast.error(message);
      setOpeningOnboarding(false);
    };
    const serviceTypes = [...SERVICES.filter((_, index) => services[index].on).map((service) => service.name), ...otherServices];
    if (methods.length === 0) return refuse("Select at least one way to communicate with the client.");
    if (changePassword && password !== confirmPassword) return refuse("Passwords do not match.");

    // Everything the form asks beyond the contact details, as the client's record keeps it.
    const details: ClientProfile = {
      communication: { methods, bestTime: answers.bestTime, timeZone: answers.timeZone },
      business: {
        industry: answers.industry === OTHER ? answers.industryOther.trim() : answers.industry,
        businessType: answers.businessType === OTHER ? answers.businessTypeOther.trim() : answers.businessType,
        serviceArea: answers.serviceArea,
        targetAudience: answers.audience,
        ...(logo === "no" ? { logoDesign: { add: logoAdd, price: number(answers.logoPrice), concepts: number(answers.logoConcepts) } } : {}),
        otherDetails: answers.otherDetails,
      },
      services: SERVICES.flatMap((service, index) => {
        const state = services[index];
        if (!state.on) return [];
        return [
          {
            name: service.name,
            fields: service.fields.map((field, at) => ({ label: field.label, value: number(state.values[at]) })),
            monthly: amountOf(state, index),
            included: state.included.filter((item) => item.on).map((item) => item.text),
            addons: service.addons.map(([label], at) => ({ label, price: number(state.addons[at]) })),
          },
        ];
      }).concat(
        customs
          .filter((custom) => custom.name.trim())
          .map((custom) => ({
            name: custom.name.trim(),
            fields: [],
            monthly: custom.billing === "monthly" ? number(custom.price) : 0,
            oneTime: custom.billing === "one_time" ? number(custom.price) : 0,
            // When a one-time service is due, and how long it takes.
            ...(custom.billing === "one_time" ? { deadline: custom.deadline || undefined } : {}),
            // What it covers, with whatever was typed but not yet added.
            included: [...custom.included.filter((item) => item.on).map((item) => item.text), ...(custom.draft.trim() ? [custom.draft.trim()] : [])],
            addons: [],
            custom: true,
            ...(custom.done ? { status: "done" as const } : {}),
          })),
      ),
      transfer: {
        has,
        needs: needs.filter((need) => need.on).map((need) => need.text),
        // A checklist only counts while what it is for is being taken over.
        websiteDone: hasWebsite ? WEBSITE_TRANSFER.filter((_, index) => websiteTicks[index]) : [],
        socialDone: hasSocial ? SOCIAL_TRANSFER.filter((_, index) => socialTicks[index]) : [],
      },
      contract: {
        ...(answers.term ? { termMonths: Number(answers.term) } : {}),
        ...(endDate ? { endDate } : {}),
        renewal: answers.renewal,
        cancellationNotice: answers.cancellation,
        renewalReminder: answers.reminder,
        signed: signed as "yes" | "sent" | "no",
        ...(signed === "yes" && answers.dateSigned ? { dateSigned: answers.dateSigned } : {}),
        ...(signed === "sent" && answers.dateSent ? { dateSent: answers.dateSent } : {}),
      },
      billing: { paymentOnFile: payOnFile === "yes", method: answers.payMethod, cycle: answers.billingCycle, day: answers.billingDay, setupFee: answers.setupFee },
      reportDelivery: answers.delivery,
    };

    // What the client's onboarding form asks too: saved once, with those answers.
    const shared: ClientShared = {
      website: answers.website,
      googleBusinessProfile: answers.gbp,
      competitors: answers.competitors,
      social: { facebook: answers.facebook, instagram: answers.instagram, linkedin: answers.linkedin, tiktok: answers.tiktok, youtube: answers.youtube, x: answers.x },
      hasLogo: logo === "yes",
      // Only asked when there is no logo; otherwise what the client said stays as it is.
      ...(logo === "no" ? { logoStyle: answers.logoStyle } : {}),
    };

    // In the menu's own order, whatever order they were ticked in.
    const portalMenus = PORTAL_MENUS.map(([key]) => key).filter((key) => menus.includes(key));
    const onboardingControls = { notNeeded: tickedIn(notNeeded), approved: tickedIn(approved) };
    const input = {
      contactName,
      companyName,
      email,
      phone,
      address,
      serviceTypes,
      startDate,
      status,
      notes,
      portalMenus,
      details,
      shared,
      onboardingControls,
      accountManager: answers.accountManager || null,
      // Only when the staff could be listed: otherwise the team stays as it is.
      ...(staff.length ? { team } : {}),
      serviceRequestsAdded: Object.keys(answeredRequests).filter((requestId) => answeredRequests[requestId] === "added"),
      serviceRequestsDismissed: Object.keys(answeredRequests).filter((requestId) => answeredRequests[requestId] === "dismissed"),
    };

    startTransition(async () => {
      // A new client gets a login when requested; an existing client gets one only when the
      // team has chosen to set or replace its password.
      const result = client
        ? await updateClientAction(client._id, { ...input, ...(changePassword ? { password } : {}) })
        : await createClientAction({ ...input, ...(changePassword ? { password } : {}) });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors ?? []);
        toast.error(result.error ?? "Something went wrong.");
        setOpeningOnboarding(false);
        return;
      }

      const savedId = client?._id ?? (result.data && "client" in result.data ? result.data.client._id : undefined);
      // On the way to the onboarding page, the save is quiet: the page itself is the next step.
      if (thenOnboarding && savedId) return router.push(`/clients/${savedId}/onboarding?edit=1`);
      toast.success(client ? "Client updated successfully" : "Client created successfully");
      router.push(client ? `/clients/${client._id}` : "/clients");
    });
  };

  return (
    <div className={`${inter.className} w-full text-[15px] leading-[1.5] text-[#111827]`}>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e2e8f0] bg-gradient-to-r from-white to-[#f8fbff] px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.035)] sm:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-[16px] font-bold text-white shadow-[0_4px_12px_rgba(15,23,42,0.14)]"
            style={{ background: avatarColorFor(client?._id ?? companyName ?? "new-client") }}
          >
            {initialsOf(isEdit ? companyName || "Client" : "New Client")}
          </span>
          <div className="min-w-0">
            <h1 className={`${fraunces.className} truncate text-[25px] leading-tight font-bold tracking-[-0.015em] text-[#0f172a] max-[640px]:text-[22px]`}>{isEdit ? companyName || "Edit Client" : "Add New Client"}</h1>
            <p className="mt-1 truncate text-[13px] text-[#64748b]">
              {only
                ? [contactName, `Editing ${SECTION_TITLES[only - 1]}`].filter(Boolean).join(" · ")
                : isEdit
                  ? [contactName, "Edit client record and portal settings"].filter(Boolean).join(" · ")
                  : "Set up a client record, services and portal access."}
            </p>
            {only && client ? (
              <Link href={`/clients/${client._id}/edit`} className="mt-1.5 inline-block text-[12.5px] font-semibold text-[#2563eb] no-underline hover:underline">
                Edit all sections
              </Link>
            ) : null}
          </div>
        </div>
        <Link href={backHref} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe3ed] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#475569] no-underline transition-colors hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:text-[#2563eb]">
          <ArrowLeft size={15} strokeWidth={2} /> Back
        </Link>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-7 max-[960px]:grid-cols-1">
        {/* With parts closed, a field left empty in one of them couldn't show the browser's own
            "fill this in" bubble, so the backend's check (and the form's own) says what is missing instead. */}
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <OpenSteps.Provider value={steps}>
          {/* 1. Client information */}
          <Section
            icon="people"
            step={1}
            title="Client information"
            sub="The client's main contact details."
            chips={[contactName, companyName, email, phone]}
            badge={filledBadge([contactName, companyName, email, phone, address, methods, answers.bestTime, answers.timeZone])}
          >
            <div className={rowClass}>
              <Field label="Contact name" htmlFor={`${id}-contact`} required>
                <input id={`${id}-contact`} className={inputClass} required placeholder="e.g. David Carter" value={contactName} onChange={(event) => setContactName(event.target.value)} />
              </Field>
              <Field label="Company name" htmlFor={`${id}-company`} required>
                <input id={`${id}-company`} className={inputClass} required placeholder="e.g. Carter Injury Law" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
              </Field>
            </div>
            <div className={rowClass}>
              <Field label="Email" htmlFor={`${id}-email`} required hint="Used for reports and updates, and as their sign-in if you turn on portal access.">
                <input id={`${id}-email`} type="email" className={inputClass} required placeholder="client@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
              </Field>
              <Field label="Phone" htmlFor={`${id}-phone`}>
                <input id={`${id}-phone`} type="tel" className={inputClass} placeholder="+1 987 654 3210" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </Field>
            </div>
            <Field label="Address" htmlFor={`${id}-address`}>
              <textarea id={`${id}-address`} className={`${inputClass} min-h-[90px] resize-y`} placeholder="Street, city, state, ZIP" value={address} onChange={(event) => setAddress(event.target.value)} />
            </Field>
            <Field label="Preferred communication method" required hint="Select all that apply.">
              <div className="flex flex-wrap gap-2">
                {COMMUNICATION_METHODS.map((method) => {
                  const on = methods.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setMethods((now) => (on ? now.filter((other) => other !== method) : [...now, method]))}
                      className={`cursor-pointer rounded-full border px-3.5 py-2 text-[14px] font-medium ${on ? "border-[#2563eb] bg-[#e8effd] text-[#2563eb]" : "border-[#e3e5e8] bg-[#fafafa]"}`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className={`${rowClass} -mb-5`}>
              <Field label="Best time to reach them" htmlFor={`${id}-best-time`}>
                <Select id={`${id}-best-time`} value={answers.bestTime} onChange={put("bestTime")} options={BEST_TIMES} />
              </Field>
              <Field label="Time zone" htmlFor={`${id}-time-zone`}>
                <Select id={`${id}-time-zone`} value={answers.timeZone} onChange={put("timeZone")} options={TIME_ZONES} />
              </Field>
            </div>
          </Section>

          {/* 2. Business details */}
          <Section
            icon="briefcase"
            step={2}
            title="Business details"
            sub="Fill in what you've collected from the client. You can add the rest later."
            chips={[answers.industry === OTHER ? answers.industryOther : answers.industry, answers.website, answers.serviceArea]}
            badge={filledBadge([answers.industry, answers.businessType, answers.website, answers.gbp, answers.serviceArea, answers.audience, answers.competitors, answers.otherDetails])}
          >
            <div className={rowClass}>
              <Field label="Industry" htmlFor={`${id}-industry`}>
                <Select id={`${id}-industry`} value={answers.industry} onChange={put("industry")} options={INDUSTRIES} placeholder="Select industry" />
                {answers.industry === OTHER ? <input className={`${inputClass} mt-2`} placeholder="Enter industry" aria-label="Industry" {...typed("industryOther")} /> : null}
              </Field>
              <Field label="Business type" htmlFor={`${id}-business-type`}>
                <Select id={`${id}-business-type`} value={answers.businessType} onChange={put("businessType")} options={BUSINESS_TYPES} placeholder="Select business type" />
                {answers.businessType === OTHER ? <input className={`${inputClass} mt-2`} placeholder="Enter business type" aria-label="Business type" {...typed("businessTypeOther")} /> : null}
              </Field>
            </div>
            <div className={rowClass}>
              <Field label="Website URL" htmlFor={`${id}-website`}>
                <input id={`${id}-website`} type="url" className={inputClass} placeholder="https://www.example.com" {...typed("website")} />
              </Field>
              <Field label="Google Business Profile" htmlFor={`${id}-gbp`}>
                <input id={`${id}-gbp`} type="url" className={inputClass} placeholder="Link to the listing" {...typed("gbp")} />
              </Field>
            </div>
            <div className={rowClass}>
              <Field label="Service area" htmlFor={`${id}-area`}>
                <input id={`${id}-area`} className={inputClass} placeholder="Cities or regions the business serves" {...typed("serviceArea")} />
              </Field>
              <Field label="Target audience" htmlFor={`${id}-audience`}>
                <input id={`${id}-audience`} className={inputClass} placeholder="Who the client wants to reach" {...typed("audience")} />
              </Field>
            </div>
            <Field label="Competitors" htmlFor={`${id}-competitors`}>
              <input id={`${id}-competitors`} className={inputClass} placeholder="Up to 3 competitor websites, separated by commas" {...typed("competitors")} />
            </Field>
            <Field label="Social media profiles">
              <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                {SOCIAL_PROFILES.map(([key, placeholder]) => (
                  <input key={key} type="url" className={inputClass} placeholder={placeholder} aria-label={placeholder} {...typed(key)} />
                ))}
              </div>
            </Field>
            <Field label="Does the client have a logo?" required>
              <Radios
                name={`${id}-logo`}
                value={logo}
                onChange={(value) => setLogo(value as "yes" | "no")}
                options={[
                  ["yes", "Yes, they have one"],
                  ["no", "No, they need one"],
                ]}
              />
              {logo === "yes" ? (
                <div className={subBoxClass}>
                  {client ? (
                    <FileManager clientId={client._id} kind="logo" title="Their logo" files={logoFiles} onChange={setUploads} />
                  ) : (
                    <p className="text-[12.5px] text-[#64748b]">Save the client first, then upload their logo here — or the client uploads it on their onboarding form.</p>
                  )}
                </div>
              ) : (
                <div className={subBoxClass}>
                  <label className="mb-3 flex cursor-pointer items-center gap-2 font-medium">
                    <input type="checkbox" checked={logoAdd} onChange={(event) => setLogoAdd(event.target.checked)} className={checkboxClass} /> Add logo design to onboarding
                  </label>
                  <div className={rowClass}>
                    <Field label="Logo design price (one-time)" htmlFor={`${id}-logo-price`} small className="">
                      <NumberInput id={`${id}-logo-price`} value={answers.logoPrice} onChange={put("logoPrice")} dollars />
                    </Field>
                    <Field label="Number of concepts" htmlFor={`${id}-logo-concepts`} small className="">
                      <NumberInput id={`${id}-logo-concepts`} value={answers.logoConcepts} onChange={put("logoConcepts")} min={1} />
                    </Field>
                  </div>
                  <Field label="Style preferences" htmlFor={`${id}-logo-style`} small className="mt-3">
                    <input id={`${id}-logo-style`} className={smallInputClass} placeholder="Colors, logos they like, words that describe the brand" {...typed("logoStyle")} />
                  </Field>
                  {/* What shows the style they'd like: logos they like, their colors, a sketch. */}
                  {client ? (
                    <div className="mt-3">
                      <FileManager clientId={client._id} kind="logoStyle" title="Style they'd like" files={logoStyleFiles} onChange={setUploads} />
                    </div>
                  ) : null}
                </div>
              )}
            </Field>
            <Field label="Other details" htmlFor={`${id}-other`} className="">
              <textarea
                id={`${id}-other`}
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="Anything else about the business: key services, goals, past agencies, special requests"
                {...typed("otherDetails")}
              />
            </Field>
          </Section>

          {/* 3. Services and pricing */}
          <Section
            icon="dollar"
            step={3}
            title="Services and pricing"
            sub="Select the services the client has agreed to, then set the quantity and price for each. Default prices are pre-filled and can be adjusted for this client."
            chips={[...SERVICES.filter((_, index) => services[index]?.on).map((service) => service.name), ...otherServices]}
            badge={{ label: `$${monthly.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`, tone: "money" }}
          >
            {SERVICES.map((service, index) => {
              const state = services[index];
              const addItem = () => {
                const text = state.adding.trim();
                if (text) changeService(index, (now) => ({ ...now, included: [...now.included, { text, on: true }], adding: "" }));
              };
              return (
                <div key={service.name} className={`mb-3 overflow-hidden rounded-xl border transition-colors ${state.on ? "border-[#86efac] bg-[#f4fbf6] shadow-[0_0_0_3px_#ecfdf3]" : "border-[#dbe3ed] bg-white"}`}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                    <input type="checkbox" checked={state.on} onChange={(event) => changeService(index, (now) => ({ ...now, on: event.target.checked }))} className="size-[18px] flex-none accent-[#16a34a]" />
                    <span className="flex-1 font-semibold">{service.name}</span>
                    <span className={`font-semibold tabular-nums ${state.on ? "text-[#15803d]" : "text-[#64748b]"}`}>{money(state.on ? amountOf(state, index) : 0)}/mo</span>
                  </label>
                  {state.on ? (
                    <div className="border-t border-[#bbf7d0] bg-white/70 px-4 pt-1 pb-4">
                      {service.note ? <div className="mt-3 text-[13px] text-[#6b7280]">{service.note}</div> : null}
                      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                        {service.fields.map((field, at) => (
                          <Field key={field.label} label={field.label} htmlFor={`${id}-service-${index}-${at}`} small className="">
                            <NumberInput
                              id={`${id}-service-${index}-${at}`}
                              value={state.values[at]}
                              onChange={(value) => changeService(index, (now) => ({ ...now, values: now.values.map((old, position) => (position === at ? value : old)) }))}
                              dollars={field.money}
                            />
                          </Field>
                        ))}
                      </div>

                      <div className="mt-3.5">
                        <div className={smallLabelClass}>What&apos;s included</div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-x-4 gap-y-0.5">
                          {state.included.map((item, at) => (
                            <label key={item.text} className={tickClass}>
                              <input
                                type="checkbox"
                                checked={item.on}
                                onChange={(event) => changeService(index, (now) => ({ ...now, included: now.included.map((old, position) => (position === at ? { ...old, on: event.target.checked } : old)) }))}
                                className={checkboxClass}
                              />
                              {item.text}
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input
                            className={`${smallInputClass} py-2 text-[14px]`}
                            placeholder="Add another item"
                            aria-label={`Add an item to ${service.name}`}
                            value={state.adding}
                            onChange={(event) => changeService(index, (now) => ({ ...now, adding: event.target.value }))}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return;
                              event.preventDefault();
                              addItem();
                            }}
                          />
                          <button type="button" className={addButtonClass} onClick={addItem}>
                            Add
                          </button>
                        </div>
                        <div className={hintClass}>Ticked items appear on the client&apos;s reports and invoices.</div>
                      </div>

                      {service.addons.length ? (
                        <div className="mt-3.5 border-t border-dashed border-[#e3e5e8] pt-3">
                          <h4 className="mb-0.5 text-[14px] font-bold">
                            Future add-on rates <span className="ml-1.5 rounded-full bg-[#fef3c7] px-2 py-0.5 align-middle text-[11px] font-semibold text-[#92400e]">Not billed now</span>
                          </h4>
                          <div className="mb-1 text-[13px] text-[#6b7280]">Prices to quote if the client asks for more later.</div>
                          <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                            {service.addons.map(([label], at) => (
                              <Field key={label} label={label} htmlFor={`${id}-addon-${index}-${at}`} small className="">
                                <NumberInput
                                  id={`${id}-addon-${index}-${at}`}
                                  value={state.addons[at]}
                                  onChange={(value) => changeService(index, (now) => ({ ...now, addons: now.addons.map((old, position) => (position === at ? value : old)) }))}
                                  dollars
                                />
                              </Field>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {/* What the client asked for from their portal: one click adds it as a custom service below. */}
            {openRequests.length ? (
              <div className="mt-5 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4">
                <div className="mb-3">
                  <div className="text-[14px] font-bold text-[#0f172a]">Requested by the client</div>
                  <div className="text-[12.5px] text-[#92400e]">Asked for from their portal. Set its price and what it includes, then add it to the services.</div>
                </div>
                <div className="flex flex-col gap-2.5">
                  {openRequests.map((request) => {
                    const answered = answeredRequests[request._id];
                    const when = new Date(request.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    if (answered) {
                      return (
                        <div key={request._id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#fde68a] bg-white px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-semibold text-[#0f172a]">{request.name}</div>
                            <div className="text-[12px] text-[#64748b]">Requested {when}</div>
                          </div>
                          {answered === "added" ? (
                            <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[12px] font-semibold text-[#15803d]">Added to the services below</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setAnsweredRequests((now) => {
                                  const next = { ...now };
                                  delete next[request._id];
                                  return next;
                                })
                              }
                              className="cursor-pointer text-[12.5px] font-semibold text-[#64748b] hover:text-[#0f172a]"
                            >
                              Dismissed · Undo
                            </button>
                          )}
                        </div>
                      );
                    }
                    const draft = draftOf(request);
                    return (
                      <div key={request._id}>
                        <div className="mb-1.5 text-[12px] text-[#92400e]">
                          Requested {when}
                          {request.note ? ` · “${request.note}”` : ""}
                        </div>
                        <CustomServiceEditor
                          custom={draft}
                          idPrefix={`${id}-request-${request._id}`}
                          tone="border-[#fde68a]"
                          change={(patch) => setRequestDrafts((now) => ({ ...now, [request._id]: { ...draft, ...patch } }))}
                          footer={
                            <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[#f1f5f9] pt-3">
                              <button
                                type="button"
                                onClick={() => setAnsweredRequests((now) => ({ ...now, [request._id]: "dismissed" }))}
                                className="h-9 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3.5 text-[13px] font-semibold text-[#64748b] hover:border-[#cbd5e1] hover:text-[#0f172a]"
                              >
                                Dismiss
                              </button>
                              <button
                                type="button"
                                disabled={!draft.name.trim()}
                                onClick={() => {
                                  setCustoms((now) => [...now, { ...draft, key: `request-${request._id}` }]);
                                  setAnsweredRequests((now) => ({ ...now, [request._id]: "added" }));
                                }}
                                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563eb] px-3.5 text-[13px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Plus size={14} strokeWidth={2.5} /> Add to services
                              </button>
                            </div>
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* The team's own services: a name, a price, and whether it is paid each month or once.
                A logo the client needs designed is one of them, from the logo answer (Business details). */}
            <div className="mt-5 rounded-xl border border-[#e2e8f0] bg-[#fbfdff] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[14px] font-bold text-[#0f172a]">Custom services</div>
                  <div className="text-[12.5px] text-[#64748b]">Anything not on the list above, paid once.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustoms((now) => [...now, { key: `new-${Date.now()}`, name: "", price: "", billing: "one_time", deadline: "", included: [], draft: "" }])}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#2563eb] bg-white px-3.5 text-[13px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]"
                >
                  <Plus size={14} strokeWidth={2.5} /> Add custom service
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {logo === "no" && logoAdd ? (
                  <div className="grid grid-cols-[minmax(0,1fr)_140px_130px_36px] items-center gap-2.5 rounded-lg border border-[#bbf7d0] bg-white p-2.5 max-[640px]:grid-cols-1">
                    <div className="flex min-w-0 items-center gap-2 px-1">
                      <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">Logo design</span>
                      <span className="shrink-0 rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10.5px] font-bold text-[#15803d]">
                        {client?.onboarding?.logo?.wantsCreated ? "Asked for in onboarding" : "No logo yet"}
                      </span>
                    </div>
                    <NumberInput id={`${id}-logo-design-price`} value={answers.logoPrice} onChange={put("logoPrice")} dollars />
                    <span className="px-1 text-[13px] font-medium text-[#475569]">One-time</span>
                    <button type="button" aria-label="Remove logo design" onClick={() => setLogoAdd(false)} className="grid size-9 cursor-pointer place-items-center rounded-lg text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]">
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                ) : null}
                {customs.map((custom, index) =>
                  custom.done ? null : (
                    <CustomServiceEditor
                      key={custom.key}
                      custom={custom}
                      idPrefix={`${id}-custom-${index}`}
                      change={(patch) => changeCustom(index, patch)}
                      onRemove={() => {
                        setCustoms((now) => now.filter((_, at) => at !== index));
                        // Taken off again before saving: the client's request it came from is open again.
                        if (custom.key.startsWith("request-")) {
                          setAnsweredRequests((now) => {
                            const next = { ...now };
                            delete next[custom.key.slice("request-".length)];
                            return next;
                          });
                        }
                      }}
                      footer={
                        custom.name.trim() ? (
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-2.5">
                            <span className="text-[11.5px] text-[#94a3b8]">Work finished? It moves to the client&apos;s history.</span>
                            <button
                              type="button"
                              onClick={() => changeCustom(index, { done: true })}
                              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 text-[12.5px] font-semibold text-[#15803d] hover:bg-[#dcfce7]"
                            >
                              <CheckCircle2 size={14} strokeWidth={2.25} /> Mark as done
                            </button>
                          </div>
                        ) : undefined
                      }
                    />
                  )
                )}
                {customs.some((custom) => custom.done) ? (
                  <div className="rounded-lg border border-[#e2e8f0] bg-white p-2.5">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 px-1">
                      <span className="text-[12.5px] font-semibold text-[#334155]">Completed · history</span>
                      <span className="text-[11.5px] text-[#94a3b8]">Not billed. The client still sees them.</span>
                    </div>
                    <ul className="flex list-none flex-col divide-y divide-[#f1f5f9]">
                      {customs.map((custom, index) =>
                        custom.done ? (
                          <li key={custom.key} className="flex items-center gap-2.5 px-1 py-1.5">
                            <CheckCircle2 size={15} strokeWidth={2.25} className="shrink-0 text-[#16a34a]" />
                            <span className="min-w-0 flex-1 truncate text-[13px] text-[#334155]">
                              <span className="font-semibold">{custom.name}</span>
                              <span className="text-[#94a3b8]"> · {money(parseFloat(custom.price) || 0)} one-time</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => changeCustom(index, { done: false })}
                              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-[12px] font-semibold text-[#2563eb] hover:bg-[#eff6ff]"
                            >
                              <RotateCcw size={12} strokeWidth={2.25} /> Reopen
                            </button>
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                ) : null}
                {!customs.some((custom) => !custom.done) && !(logo === "no" && logoAdd) ? <p className="text-[12.5px] text-[#94a3b8]">No custom services yet.</p> : null}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#86efac] bg-[#dcfce7] px-5 py-4 text-[#14532d]">
              <div className="flex items-center justify-between gap-3">
                <span>Monthly total</span>
                <strong className="text-[22px] font-semibold tabular-nums">{money(monthly)}</strong>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-[#bbf7d0] pt-1.5 text-[14px] text-[#3f6212]">
                <span>One-time fees (e.g. logo design)</span>
                <span className="tabular-nums">{money(oneTime)}</span>
              </div>
            </div>
            <div className={hintClass}>Calculated from the services you select. Future add-on rates are saved for later and aren&apos;t included.</div>
          </Section>

          {/* 4. Onboarding and transfer */}
          {/* The onboarding has a page of its own, where every answer is filled in and edited. Clicking
              it saves what is on this form first (making the client, when adding one), then goes there. */}
          <Section
            icon="checklist"
            step={4}
            title="Onboarding and transfer"
            sub="Saves what you've entered here, then opens the onboarding page to fill everything in."
            chips={[`${ONBOARDING_STEPS.filter(([stepId, , , locked]) => locked || !notNeeded[stepId]).length} of ${ONBOARDING_STEPS.length} steps`]}
            onOpen={() => {
              toOnboarding.current = true;
              setOpeningOnboarding(true);
              formRef.current?.requestSubmit();
            }}
            busy={isPending && openingOnboarding}
          />

          {/* 5. Account setup */}
          <Section
            icon="lock"
            step={5}
            title="Account setup"
            sub="Contract, billing, status and how the client gets updates."
            chips={[startDate, answers.term ? `${answers.term} months` : "", endDate, answers.renewal]}
            badge={filledBadge([startDate, answers.term, endDate, answers.renewal, answers.cancellation, answers.reminder, signed, payOnFile === "yes", answers.payMethod, answers.billingCycle, answers.billingDay, answers.setupFee, answers.accountManager, answers.delivery])}
          >
            <h3 className="mb-3 text-[15px] font-bold">Contract</h3>
            <div className={rowClass}>
              <Field label="Contract start date" htmlFor={`${id}-start`} required>
                <input
                  id={`${id}-start`}
                  type="date"
                  className={inputClass}
                  required
                  value={startDate}
                  onChange={(event) => {
                    setPickedStartDate(event.target.value);
                    setPickedEndDate(null);
                  }}
                />
              </Field>
              <Field label="Contract length" htmlFor={`${id}-term`}>
                <Select
                  id={`${id}-term`}
                  value={answers.term}
                  onChange={(value) => {
                    put("term")(value);
                    // "Custom" leaves the date where it was, to be typed over.
                    setPickedEndDate(value ? null : endDate);
                  }}
                  options={CONTRACT_TERMS}
                />
              </Field>
            </div>
            <div className={rowClass}>
              <Field label="Contract end date" htmlFor={`${id}-end`} hint="Filled in from the start date and length. You can change it.">
                <input id={`${id}-end`} type="date" className={inputClass} value={endDate} onChange={(event) => setPickedEndDate(event.target.value)} />
              </Field>
              <Field label="Renewal type" htmlFor={`${id}-renewal`} required>
                <Select id={`${id}-renewal`} value={answers.renewal} onChange={put("renewal")} options={RENEWAL_TYPES} required />
              </Field>
            </div>
            <div className={rowClass}>
              <Field label="Cancellation notice" htmlFor={`${id}-cancellation`}>
                <Select id={`${id}-cancellation`} value={answers.cancellation} onChange={put("cancellation")} options={CANCELLATION_NOTICES} />
              </Field>
              <Field label="Renewal reminder" htmlFor={`${id}-reminder`}>
                <Select id={`${id}-reminder`} value={answers.reminder} onChange={put("reminder")} options={RENEWAL_REMINDERS} />
              </Field>
            </div>
            <Field label="Is the contract signed?" required>
              <Radios
                name={`${id}-signed`}
                value={signed}
                onChange={setSigned}
                options={[
                  ["yes", "Yes, signed"],
                  ["sent", "Sent, waiting for signature"],
                  ["no", "Not sent yet"],
                ]}
              />
              {signed === "yes" ? (
                <div className={subBoxClass}>
                  <div className={rowClass}>
                    <Field label="Date signed" htmlFor={`${id}-date-signed`} small className="">
                      <input id={`${id}-date-signed`} type="date" className={smallInputClass} {...typed("dateSigned")} />
                    </Field>
                    <Field label="Signed contract" small className="">
                      <label className={`${uploadClass} p-[11px]`}>
                        <input type="file" accept="application/pdf" hidden onChange={(event) => setContractFile(event.target.files?.[0]?.name ?? "")} />
                        <strong className="font-bold text-[#2563eb]">{contractFile || "Upload PDF"}</strong>
                      </label>
                    </Field>
                  </div>
                </div>
              ) : null}
              {signed === "sent" ? (
                <div className={subBoxClass}>
                  <Field label="Date sent" htmlFor={`${id}-date-sent`} small className="">
                    <input id={`${id}-date-sent`} type="date" className={smallInputClass} {...typed("dateSent")} />
                  </Field>
                </div>
              ) : null}
            </Field>

            <h3 className={subheadClass}>Billing</h3>
            <Field label="Is a payment method on file?" required hint="Never type card or bank numbers here. The client adds them through the payment link or your payment processor.">
              <Radios
                name={`${id}-pay`}
                value={payOnFile}
                onChange={setPayOnFile}
                options={[
                  ["yes", "Yes, added"],
                  ["no", "Not yet"],
                ]}
              />
            </Field>
            <div className={rowClass}>
              <Field label="Payment method" htmlFor={`${id}-pay-method`}>
                <Select id={`${id}-pay-method`} value={answers.payMethod} onChange={put("payMethod")} options={PAYMENT_METHODS} />
              </Field>
              <Field label="Billing cycle" htmlFor={`${id}-cycle`}>
                <Select id={`${id}-cycle`} value={answers.billingCycle} onChange={put("billingCycle")} options={BILLING_CYCLES} />
              </Field>
            </div>
            <div className={rowClass}>
              <Field label="Billing day" htmlFor={`${id}-billing-day`}>
                <Select id={`${id}-billing-day`} value={answers.billingDay} onChange={put("billingDay")} options={BILLING_DAYS} />
              </Field>
              <Field label="Setup fee paid?" htmlFor={`${id}-setup-fee`}>
                <Select id={`${id}-setup-fee`} value={answers.setupFee} onChange={put("setupFee")} options={SETUP_FEES} />
              </Field>
            </div>

            <h3 className={subheadClass}>Account</h3>
            <div className={rowClass}>
              <Field label="Status" htmlFor={`${id}-status`} required hint="Only active clients with portal access can sign in.">
                <Select id={`${id}-status`} value={status} onChange={(value) => setStatus(value as ClientStatus)} options={STATUSES} required />
              </Field>
              <Field label="Account manager" htmlFor={`${id}-manager`}>
                <Select id={`${id}-manager`} value={answers.accountManager} onChange={put("accountManager")} options={managers} placeholder="Assign a team member" />
              </Field>
            </div>
            <Field label="Report delivery" htmlFor={`${id}-delivery`}>
              <Select id={`${id}-delivery`} value={answers.delivery} onChange={put("delivery")} options={REPORT_DELIVERIES} disabled={portal || isEdit ? [] : [DELIVERY_PORTAL]} />
            </Field>

            {/* Who else on the team works on the client: shown on its page as "Assigned staff". */}
            <Field label="Assigned staff" hint={staff.length ? "Everyone ticked can see and work on this client." : "The team list couldn't be loaded, so the assigned staff stay as they are."}>
              {staff.length ? (
                <div className="flex flex-wrap gap-2">
                  {staff.map((member) => {
                    const on = team.includes(member._id);
                    return (
                      <label
                        key={member._id}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors ${on ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#e2e8f0] bg-white text-[#334155] hover:border-[#93c5fd]"}`}
                      >
                        <input
                          type="checkbox"
                          className={checkboxClass}
                          checked={on}
                          onChange={(event) => setTeam((now) => (event.target.checked ? [...now, member._id] : now.filter((idOf) => idOf !== member._id)))}
                        />
                        {member.fullName}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] text-[#334155]">{(client?.team ?? []).map((member) => (typeof member === "object" ? member.fullName : member)).join(", ") || "No one assigned yet"}</p>
              )}
            </Field>

            {/* Their portal login as it is now: the password, hidden until shown, to copy. */}
            {client?.user ? (
              <Field label="Current portal password" hint={client.portalPassword ? "Type a new one below to replace it." : "It wasn't saved in a way that can be shown. Set a new one below to see it here."}>
                {client.portalPassword ? (
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 font-mono text-[13.5px] break-all text-[#0f172a]">
                      {showCurrent ? client.portalPassword : "••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCurrent((shown) => !shown)}
                      className="h-9 shrink-0 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 text-[12.5px] font-semibold text-[#475569] hover:border-[#93c5fd] hover:text-[#2563eb]"
                    >
                      {showCurrent ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(client.portalPassword ?? "").then(
                          () => toast.success("Password copied"),
                          () => toast.error("Couldn't copy the password."),
                        )
                      }
                      className="h-9 shrink-0 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 text-[12.5px] font-semibold text-[#475569] hover:border-[#93c5fd] hover:text-[#2563eb]"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#64748b]">Not saved</p>
                )}
              </Field>
            ) : null}

            {/* The portal password: always shown. On a new client it creates their login (blank = no login);
                on an existing one it sets or replaces it (blank = keep the current one). */}
            <div className={rowClass}>
              <Field
                label="Portal password"
                htmlFor={`${id}-password`}
                hint={client?.user ? "Leave blank to keep their current password. At least 8 characters." : "At least 8 characters. Leave blank if the client doesn't need a portal login."}
              >
                <div className="relative">
                  <input
                    id={`${id}-password`}
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass} pr-16`}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder={client?.user ? "Enter a new password" : "Enter a password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-pressed={showPassword} className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-[13px] text-[#6b7280] hover:text-[#111827]">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
              <Field
                label="Confirm password"
                htmlFor={`${id}-confirm`}
                required={password !== ""}
                hint={<span className={passwordsMatch ? "text-[#16a34a]" : passwordsMismatch ? "text-[#dc2626]" : ""}>{passwordsMatch ? "Passwords match." : passwordsMismatch ? "Passwords don't match." : "Type the same password again."}</span>}
              >
                <div className="relative">
                  <input
                    id={`${id}-confirm`}
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${inputClass} pr-16`}
                    required={password !== ""}
                    autoComplete="new-password"
                    placeholder="Re-enter the password"
                    aria-invalid={passwordsMismatch}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((shown) => !shown)} aria-pressed={showConfirmPassword} className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-[13px] text-[#6b7280] hover:text-[#111827]">
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
            </div>

            {/* Which pages of the portal the client's menu has. Only worth asking once they have a login. */}
            {isEdit || portal ? (
              <Field label="What the client sees in their portal" hint="Unticked pages are left out of the client's menu. Settings is always there.">
                <div className={listClass}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] text-[#6b7280]">
                      {menus.length} of {PORTAL_MENUS.length} pages shown
                    </span>
                    <span className="flex gap-2">
                      <button type="button" className={`${addButtonClass} py-1.5 text-[13px]`} onClick={() => setMenus(PORTAL_MENUS.map(([key]) => key))}>
                        Show all
                      </button>
                      <button type="button" className={`${addButtonClass} py-1.5 text-[13px]`} onClick={() => setMenus([])}>
                        Hide all
                      </button>
                    </span>
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-4 gap-y-0.5">
                    {PORTAL_MENUS.map(([key, label]) => (
                      <label key={key} className={tickClass}>
                        <input
                          type="checkbox"
                          checked={menus.includes(key)}
                          onChange={(event) => setMenus((now) => (event.target.checked ? [...now, key] : now.filter((other) => other !== key)))}
                          className={checkboxClass}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </Field>
            ) : null}

            <Field label="Internal notes" htmlFor={`${id}-notes`} className="" hint="Visible to your team only. The client can't see these.">
              <textarea
                id={`${id}-notes`}
                className={`${inputClass} min-h-[90px] resize-y`}
                placeholder="Anything the team should know about this client"
                maxLength={NOTES_LIMIT}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
          </Section>
          </OpenSteps.Provider>

          {error ? (
            <div className={`${formErrorBanner} mb-4`} role="alert">
              {error}
              {fieldErrors.length > 0 ? (
                <ul>
                  {fieldErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-[0_5px_18px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[12.5px] text-[#64748b]">Changes are saved to this client&apos;s record and portal settings.</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link href={backHref} className={`${buttonClass} justify-center border-[#dbe3ed] bg-white text-[#334155] no-underline hover:border-[#b8c6d7] hover:bg-[#f8fafc]`}>
              Cancel
            </Link>
            <button type="submit" disabled={isPending} className={`${buttonClass} min-w-36 justify-center border-[#2563eb] bg-[#2563eb] text-white shadow-[0_4px_10px_rgba(37,99,235,0.2)] hover:bg-[#1d4ed8]`}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Save client"}
            </button>
            </div>
          </div>
        </form>

        {/* Beside the form. It stays at the top of the window while the form scrolls under it; the
            stickiness is on the grid's own column, which is as tall as the form — a wrapper only
            as tall as these cards would have nowhere to stick. */}
        <aside className="sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col gap-4 self-start overflow-y-auto pr-1 max-[960px]:static max-[960px]:order-first max-[960px]:max-h-none">
          {client ? (
            <ClientSaid client={client} />
          ) : (
            <div className={`${sideCardClass} border-[#bfdbfe] bg-[#f8fbff]`}>
              <div className="mb-4 flex items-center gap-3">
                <Icon name="people" />
                <div>
                  <div className="text-[10.5px] font-bold tracking-[0.08em] text-[#2563eb] uppercase">Client setup</div>
                  <h3 className="mt-0.5 text-[16px] leading-snug font-semibold text-[#0f172a]">Adding a client for the team</h3>
                </div>
              </div>
              <ul className="flex list-none flex-col gap-2.5">
                {PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-[13.5px] leading-snug font-medium text-[#1f2937]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="mt-0.5 flex-none text-[#16a34a]" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12l3 3 5-6" />
                    </svg>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

// The Add Client page: the form, empty. Editing uses the same form filled in (ClientEdit.tsx).
const ClientAdd = ({ staff }: { staff?: StaffOption[] }) => <ClientForm staff={staff} />;

export default ClientAdd;
