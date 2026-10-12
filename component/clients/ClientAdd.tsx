"use client";

import { useId, useState, useSyncExternalStore, useTransition, type FormEvent, type ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClientAction, updateClientAction, type Client, type ClientProfile, type ClientShared, type ClientStatus, type StaffOption } from "@/app/actions/clients";
import { formErrorBanner } from "@/component/shared/ui";
import {
  BEST_TIMES,
  BILLING_CYCLES,
  BILLING_DAYS,
  BUSINESS_TYPES,
  CANCELLATION_NOTICES,
  CLIENT_HAS,
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
  GOAL_BUDGETS,
  GOAL_TIMEFRAMES,
  LEAD_SOURCES,
  NOTES_LIMIT,
  ONBOARDING_STATUS_LABELS,
  REACH_BY,
  contractEnd,
  countsOf,
  groupsOf,
  money,
  portalMenusOf,
  sharedOf,
  targetOf,
  todayInputValue,
  uploadsOf,
} from "./clientUi";

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

const cardClass = "mb-5 rounded-2xl border border-[#e3e8e5] bg-white p-7 shadow-[0_1px_2px_rgba(11,21,34,0.04)] max-[640px]:p-5";
const rowClass = "grid grid-cols-2 gap-5 max-[640px]:grid-cols-1";
const labelClass = "mb-1.5 block text-[13.5px] font-semibold text-[#374151]";
const smallLabelClass = "mb-1.5 block text-[13px] font-medium text-[#374151]";
// What every field shares: the border darkens under the pointer, and turns blue with a soft ring when typed in.
const fieldLook =
  "w-full rounded-[10px] border border-[#d9dee3] bg-white text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-[border-color,box-shadow] duration-150 placeholder:text-[#9ca3af] hover:border-[#c3cad2] focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb]/15 focus:outline-none";
const inputClass = `${fieldLook} px-3.5 py-2.75 text-[14.5px]`;
// The same field inside a service or a sub-box: a little smaller.
const smallInputClass = `${fieldLook} px-3 py-2.25 text-[14px]`;
const hintClass = "mt-1.5 text-[12.5px] leading-normal text-[#6b7280]";
const subBoxClass = "mt-3 rounded-xl border border-[#e3e8e5] bg-[#f8faf9] p-4";
const uploadClass =
  "block cursor-pointer rounded-[10px] border-[1.5px] border-dashed border-[#cfd6dd] bg-[#f8faf9] text-center text-[14px] text-[#6b7280] transition-colors duration-150 hover:border-[#2563eb] hover:bg-[#f4f8ff] hover:text-[#2563eb]";
const radioClass =
  "flex cursor-pointer items-center gap-2 rounded-[10px] border border-[#d9dee3] bg-white px-3.5 py-2.5 text-[14px] font-medium transition-colors duration-150 hover:border-[#c3cad2] has-[:checked]:border-[#2563eb] has-[:checked]:bg-[#eff4fe] has-[:checked]:text-[#1d4ed8]";
const listClass = "rounded-xl border border-[#e3e8e5] bg-white p-4.5";
const tickClass = "flex cursor-pointer items-center gap-2 py-[5px] text-[14px] text-[#111827]";
const checkboxClass = "size-4 flex-none accent-[#2563eb]";
const addButtonClass =
  "cursor-pointer rounded-lg border border-[#d9dee3] bg-white px-3 py-2 text-[13.5px] font-semibold whitespace-nowrap text-[#374151] transition-colors duration-150 hover:border-[#2563eb] hover:text-[#2563eb]";
const subheadClass = "mt-3 mb-4 border-t border-[#eef0f3] pt-5 text-[15px] font-bold text-[#0f172a]";
const buttonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border px-5.5 py-2.75 text-[14.5px] font-semibold transition-colors duration-150 disabled:cursor-wait disabled:opacity-70";
// A card beside the form.
const sideCardClass = "rounded-2xl border p-5";

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

const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <div className="grid size-11 flex-none place-items-center rounded-xl bg-[#eff4fe] text-[#2563eb] ring-1 ring-[#dbe6fb]">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-[22px]" aria-hidden="true">
      {ICONS[name]}
    </svg>
  </div>
);

const Star = () => <span className="text-[#dc2626]">*</span>;

// One of the form's five parts.
const Section = ({ icon, step, title, sub, children }: { icon: keyof typeof ICONS; step: number; title: ReactNode; sub: string; children: ReactNode }) => (
  <section className={cardClass}>
    <div className="mb-6 flex items-center gap-4 border-b border-[#eef0f3] pb-5">
      <Icon name={icon} />
      <div className="min-w-0">
        <div className="mb-0.5 text-[11px] font-bold tracking-[0.08em] text-[#2563eb] uppercase">Step {step} of 5</div>
        <h2 className="text-[18px] leading-tight font-bold text-[#0f172a]">{title}</h2>
        <p className="mt-1 text-[13.5px] text-[#6b7280]">{sub}</p>
      </div>
    </div>
    {children}
  </section>
);

// A label, what it labels, and a line under it. Without `htmlFor` it heads a group of choices.
const Field = ({
  label,
  htmlFor,
  required = false,
  small = false,
  hint,
  className = "mb-5",
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  small?: boolean;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) => {
  const text = (
    <>
      {label} {required ? <Star /> : null}
    </>
  );
  return (
    <div className={className}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={small ? smallLabelClass : labelClass}>
          {text}
        </label>
      ) : (
        <div className={small ? smallLabelClass : labelClass}>{text}</div>
      )}
      {children}
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

// A list to tick off as a transfer goes on, with how far along it is.
const Checklist = ({ title, items, ticked, onToggle }: { title: string; items: string[]; ticked: boolean[]; onToggle: (index: number) => void }) => {
  const done = ticked.filter(Boolean).length;
  return (
    <div className={`${listClass} mb-4`}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-[16px] font-bold">{title}</h3>
        <span className="rounded-full bg-[#e8effd] px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-[#2563eb]">
          {done} / {items.length}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#eef0f3]">
        <i className="block h-full bg-[#16a34a] transition-[width] duration-200" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      {items.map((item, index) => (
        <label key={item} className="flex cursor-pointer items-center gap-2.5 py-[7px] text-[14px]">
          <input type="checkbox" checked={Boolean(ticked[index])} onChange={() => onToggle(index)} className="size-[17px] flex-none accent-[#16a34a]" />
          <span className={ticked[index] ? "text-[#6b7280] line-through" : "text-[#111827]"}>{item}</span>
        </label>
      ))}
    </div>
  );
};

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
    ["media", uploadsOf(said).some((group) => group.title !== "Logo")],
  ];
  return list.filter(([, has]) => has).map(([key]) => key);
};

// What the client told us themselves — when signing up, and on the onboarding form — beside
// the form while their record is edited, so it can be filled in from what they actually said.
// Only what they gave; nothing at all for a client who gave nothing.
const ClientSaid = ({ client }: { client: Client }) => {
  const said = client.onboarding;
  if (!said) return null;
  const { business, goals, kickoffCall } = said;
  const { answered, total } = countsOf(groupsOf({ onboarding: said }));
  const uploaded = uploadsOf(said).reduce((sum, group) => sum + group.files.length, 0);
  const lines: [label: string, value?: string][] = [
    ["Onboarding form", said.status ? `${ONBOARDING_STATUS_LABELS[said.status]} · ${answered} of ${total} answered` : undefined],
    ["About the business", business?.description],
    ["Services they offer", business?.services?.join(", ")],
    ["Areas they serve", business?.areas?.join(", ")],
    ["Main contact", [business?.contact?.name, business?.contact?.email, business?.contact?.phone].filter(Boolean).join(" · ")],
    ["Best way to reach them", REACH_BY[business?.contact?.reachBy ?? ""]],
    ["Revenue per month", targetOf(goals?.revenue, money)],
    ["Leads per month", targetOf(goals?.leads, String)],
    ["New clients per month", targetOf(goals?.newClients, String)],
    ["How soon", GOAL_TIMEFRAMES[goals?.timeframe ?? ""]],
    ["Monthly marketing budget", GOAL_BUDGETS[goals?.budget ?? ""]],
    ["Where leads come from", goals?.leadSources?.map((source) => LEAD_SOURCES[source] ?? source).join(", ")],
    ["Kickoff call", kickoffCall ? (kickoffCall.booked ? "Booked (the client says so)" : "Not booked yet") : undefined],
    ["Files uploaded", uploaded ? `${uploaded} file${uploaded === 1 ? "" : "s"}` : undefined],
  ];
  const given = lines.filter(([, value]) => value?.trim());
  if (!given.length) return null;

  return (
    <div className={`${sideCardClass} border-[#d6e2f9] bg-[#f4f8ff]`}>
      <h3 className="mb-3 text-[15.5px] leading-snug font-bold text-[#0f172a]">From the client</h3>
      <dl className="flex flex-col gap-2.5">
        {given.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11.5px] font-semibold text-[#6b7280]">{label}</dt>
            <dd className="text-[13px] leading-snug font-medium break-words whitespace-pre-wrap text-[#111827]">{value}</dd>
          </div>
        ))}
      </dl>
      <Link href={`/clients/${client._id}`} className="mt-3.5 inline-block text-[13px] font-semibold text-[#2563eb] no-underline hover:underline">
        Everything they answered →
      </Link>
    </div>
  );
};

const managerIdOf = (client?: Client) => (typeof client?.accountManager === "object" ? client.accountManager._id : (client?.accountManager ?? ""));

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
// members an account manager can be picked from.
export const ClientForm = ({ client, staff = [] }: { client?: Client; staff?: StaffOption[] }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const id = useId();
  const isEdit = Boolean(client);
  const backHref = client ? `/clients/${client._id}` : "/clients";
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
  const [logoFiles, setLogoFiles] = useState<string[]>([]);

  // ── Step 3: services ──
  const [services, setServices] = useState<ServiceState[]>(() => servicesFor(client));
  // Services saved on the client that this form doesn't list: kept, so saving doesn't drop them.
  const [otherServices, setOtherServices] = useState<string[]>(() => (client?.serviceTypes ?? []).filter((name) => !SERVICES.some((service) => service.name === name)));
  const changeService = (index: number, change: (state: ServiceState) => ServiceState) => setServices((now) => now.map((state, at) => (at === index ? change(state) : state)));

  // ── Step 4: what they have, what they need, and what is being handed over ──
  const [has, setHas] = useState<string[]>(() => saved?.transfer?.has ?? hasFrom(client) ?? ["logo"]);
  const [needs, setNeeds] = useState(() => {
    const ticked = saved?.transfer?.needs ?? [];
    // The ones on the list, then any that were added for this client.
    return [...CLIENT_NEEDS.map((text) => ({ text, on: ticked.includes(text) })), ...ticked.filter((text) => !CLIENT_NEEDS.includes(text)).map((text) => ({ text, on: true }))];
  });
  const [needDraft, setNeedDraft] = useState("");
  const addNeed = () => {
    const text = needDraft.trim();
    if (!text) return;
    setNeeds((now) => (now.some((need) => need.text === text) ? now : [...now, { text, on: true }]));
    setNeedDraft("");
  };
  const [websiteTicks, setWebsiteTicks] = useState<boolean[]>(() => WEBSITE_TRANSFER.map((item) => Boolean(saved?.transfer?.websiteDone?.includes(item))));
  const [socialTicks, setSocialTicks] = useState<boolean[]>(() => SOCIAL_TRANSFER.map((item) => Boolean(saved?.transfer?.socialDone?.includes(item))));
  const toggleAt = (index: number) => (ticks: boolean[]) => Array.from({ length: Math.max(ticks.length, index + 1) }, (_, at) => (at === index ? !ticks[at] : Boolean(ticks[at])));

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
  const [portal, setPortalAnswer] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notes, setNotes] = useState(client?.notes ?? "");
  // The portal pages the client is shown: all of them, until some are taken away — or, for a
  // client who signed up themselves and hasn't been given more, only the first ones.
  const [menus, setMenus] = useState<string[]>(() => (client ? portalMenusOf(client) : undefined) ?? PORTAL_MENUS.map(([key]) => key));

  // Without a login there is no portal to read reports in.
  const setPortal = (on: boolean) => {
    setPortalAnswer(on);
    if (on) return;
    setPassword("");
    setConfirmPassword("");
    setAnswers((now) => (now.delivery === DELIVERY_PORTAL ? { ...now, delivery: REPORT_DELIVERIES[0] } : now));
  };

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  // The team to choose from — with the client's present manager among them even when the team
  // couldn't be listed, so that saving doesn't take them off.
  const present = typeof client?.accountManager === "object" ? client.accountManager : undefined;
  const managers: [string, string][] = [...staff, ...(present && !staff.some((member) => member._id === present._id) ? [present] : [])].map((member) => [member._id, member.fullName]);

  const monthly = services.reduce((sum, state, index) => (state.on ? sum + amountOf(state, index) : sum), 0);
  const oneTime = logo === "no" && logoAdd ? parseFloat(answers.logoPrice) || 0 : 0;
  const hasWebsite = has.includes("website");
  const hasSocial = has.includes("social");
  const passwordsMatch = confirmPassword !== "" && confirmPassword === password;
  const passwordsMismatch = confirmPassword !== "" && confirmPassword !== password;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);

    const refuse = (message: string) => {
      setError(message);
      toast.error(message);
    };
    const serviceTypes = [...SERVICES.filter((_, index) => services[index].on).map((service) => service.name), ...otherServices];
    if (methods.length === 0) return refuse("Select at least one way to communicate with the client.");
    if (serviceTypes.length === 0) return refuse("Select at least one service.");
    if (!client && portal && password !== confirmPassword) return refuse("Passwords do not match.");

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
      }),
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
    const input = { contactName, companyName, email, phone, address, serviceTypes, startDate, status, notes, portalMenus, details, shared, accountManager: answers.accountManager || null };

    startTransition(async () => {
      // A new client only gets a login when one was asked for.
      const result = client ? await updateClientAction(client._id, input) : await createClientAction({ ...input, ...(portal ? { password } : {}) });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setFieldErrors(result.fieldErrors ?? []);
        toast.error(result.error ?? "Something went wrong.");
        return;
      }

      toast.success(client ? "Client updated successfully" : "Client created successfully");
      router.push(client ? `/clients/${client._id}` : "/clients");
    });
  };

  return (
    <div className={`${inter.className} w-full text-[15px] leading-[1.5] text-[#111827]`}>
      <h1 className={`${fraunces.className} mb-1.5 text-[34px] leading-[1.15] font-bold tracking-[-0.01em] text-[#0f172a] max-[640px]:text-[28px]`}>{isEdit ? "Edit Client" : "Add New Client"}</h1>
      <p className="mb-7 max-w-[72ch] text-[15px] text-[#6b7280]">
        {isEdit
          ? "Update the client's details. Their portal login is kept in sync."
          : "Set up a client on their behalf. Portal access is optional, since many clients prefer that our team handles everything."}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-7 max-[960px]:grid-cols-1">
        <form onSubmit={handleSubmit}>
          {/* 1. Client information */}
          <Section icon="people" step={1} title="Client information" sub="The client's main contact details.">
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
          <Section icon="briefcase" step={2} title="Business details" sub="Fill in what you've collected from the client. You can add the rest later.">
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
                  <label className={`${uploadClass} p-4.5`}>
                    <input type="file" multiple hidden onChange={(event) => setLogoFiles(Array.from(event.target.files ?? []).map((file) => file.name))} />
                    <strong className="font-bold text-[#2563eb]">Click to upload</strong> the logo, brand colors and fonts
                    <br />
                    <span className="text-[12px]">{logoFiles.length ? logoFiles.join(", ") : "PNG, SVG, PDF or ZIP · up to 20 MB"}</span>
                  </label>
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
            title={
              <>
                Services and pricing <Star />
              </>
            }
            sub="Select the services the client has agreed to, then set the quantity and price for each. Default prices are pre-filled and can be adjusted for this client."
          >
            {SERVICES.map((service, index) => {
              const state = services[index];
              const addItem = () => {
                const text = state.adding.trim();
                if (text) changeService(index, (now) => ({ ...now, included: [...now.included, { text, on: true }], adding: "" }));
              };
              return (
                <div key={service.name} className={`mb-3 overflow-hidden rounded-xl border ${state.on ? "border-[#2563eb] shadow-[0_0_0_3px_#e8effd]" : "border-[#e3e5e8]"}`}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                    <input type="checkbox" checked={state.on} onChange={(event) => changeService(index, (now) => ({ ...now, on: event.target.checked }))} className="size-[18px] flex-none accent-[#2563eb]" />
                    <span className="flex-1 font-semibold">{service.name}</span>
                    <span className={`font-semibold tabular-nums ${state.on ? "text-[#111827]" : "text-[#6b7280]"}`}>{money(state.on ? amountOf(state, index) : 0)}/mo</span>
                  </label>
                  {state.on ? (
                    <div className="border-t border-[#e3e5e8] bg-[#fcfcfd] px-4 pt-1 pb-4">
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

            {/* Services already on the client that this form doesn't price. */}
            {otherServices.map((name) => (
              <div key={name} className="mb-3 overflow-hidden rounded-xl border border-[#2563eb] shadow-[0_0_0_3px_#e8effd]">
                <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                  <input type="checkbox" checked onChange={() => setOtherServices((now) => now.filter((other) => other !== name))} className="size-[18px] flex-none accent-[#2563eb]" />
                  <span className="flex-1 font-semibold">{name}</span>
                  <span className="text-[13px] font-medium text-[#6b7280]">Saved earlier</span>
                </label>
              </div>
            ))}

            <div className="mt-4 rounded-xl bg-[#0f172a] px-5 py-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <span>Monthly total</span>
                <strong className="text-[22px] font-bold tabular-nums">{money(monthly)}</strong>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-[#334155] pt-1.5 text-[14px] text-[#cbd5e1]">
                <span>One-time fees (e.g. logo design)</span>
                <span className="tabular-nums">{money(oneTime)}</span>
              </div>
            </div>
            <div className={hintClass}>Calculated from the services you select. Future add-on rates are saved for later and aren&apos;t included.</div>
          </Section>

          {/* 4. Onboarding and transfer */}
          <Section
            icon="checklist"
            step={4}
            title="Onboarding and transfer"
            sub="First record what the client already has and what they need, then track the transfer of anything we're taking over."
          >
            <div className="mb-4 grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <div className={listClass}>
                <h3 className="mb-2.5 text-[16px] font-bold">What the client has</h3>
                {CLIENT_HAS.map(([value, label]) => (
                  <label key={value} className={tickClass}>
                    <input
                      type="checkbox"
                      checked={has.includes(value)}
                      onChange={(event) => setHas((now) => (event.target.checked ? [...now, value] : now.filter((item) => item !== value)))}
                      className={checkboxClass}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className={listClass}>
                <h3 className="mb-2.5 text-[16px] font-bold">What the client needs</h3>
                {needs.map((need, index) => (
                  <label key={need.text} className={tickClass}>
                    <input
                      type="checkbox"
                      checked={need.on}
                      onChange={(event) => setNeeds((now) => now.map((old, at) => (at === index ? { ...old, on: event.target.checked } : old)))}
                      className={checkboxClass}
                    />
                    {need.text}
                  </label>
                ))}
                <div className="mt-2 flex gap-2">
                  <input
                    className={`${smallInputClass} py-2 text-[14px]`}
                    placeholder="Something else they need"
                    aria-label="Something else they need"
                    value={needDraft}
                    onChange={(event) => setNeedDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      addNeed();
                    }}
                  />
                  <button type="button" className={addButtonClass} onClick={addNeed}>
                    Add
                  </button>
                </div>
              </div>
            </div>

            <h3 className={subheadClass}>Transfer checklists</h3>
            {hasWebsite || hasSocial ? null : (
              <div className="mb-4 rounded-xl border border-dashed border-[#e3e5e8] p-3.5 text-[14px] text-[#6b7280]">
                Tick &quot;Website&quot; or &quot;Social media accounts&quot; above to show the transfer checklists.
              </div>
            )}
            {hasWebsite ? <Checklist title="Website transfer checklist" items={WEBSITE_TRANSFER} ticked={websiteTicks} onToggle={(index) => setWebsiteTicks(toggleAt(index))} /> : null}
            {hasSocial ? <Checklist title="Social media transfer checklist" items={SOCIAL_TRANSFER} ticked={socialTicks} onToggle={(index) => setSocialTicks(toggleAt(index))} /> : null}
            <div className={hintClass}>Your team can keep updating these from the client&apos;s profile.</div>
          </Section>

          {/* 5. Account setup */}
          <Section icon="lock" step={5} title="Account setup" sub="Contract, billing, status and how the client gets updates.">
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

            {/* The login is made with the client; afterwards it is managed from their profile. */}
            {isEdit ? null : (
              <>
                <div className="mb-5 flex items-start gap-3.5 rounded-xl border border-[#e3e5e8] bg-[#fcfcfd] p-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={portal}
                    aria-labelledby={`${id}-portal-label`}
                    onClick={() => setPortal(!portal)}
                    className={`relative h-6 w-[42px] flex-none cursor-pointer rounded-full transition-colors duration-200 ${portal ? "bg-[#2563eb]" : "bg-[#d1d5db]"}`}
                  >
                    <span className={`absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white transition-transform duration-200 ${portal ? "translate-x-[18px]" : ""}`} />
                  </button>
                  <div>
                    <strong id={`${id}-portal-label`} className="font-bold">
                      Give this client a portal login
                    </strong>
                    <div className="mt-0.5 text-[13px] text-[#6b7280]">
                      Leave this off if the client doesn&apos;t want an account. Our team will manage everything and send updates by email. You can turn it on later.
                    </div>
                  </div>
                </div>
                {portal ? (
                  <div className={rowClass}>
                    <Field label="Portal password" htmlFor={`${id}-password`} required hint="At least 8 characters. Share this with the client so they can sign in.">
                      <div className="relative">
                        <input
                          id={`${id}-password`}
                          type={showPassword ? "text" : "password"}
                          className={`${inputClass} pr-16`}
                          required
                          minLength={8}
                          maxLength={72}
                          autoComplete="new-password"
                          placeholder="Enter a password"
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
                      required
                      hint={<span className={passwordsMatch ? "text-[#16a34a]" : passwordsMismatch ? "text-[#dc2626]" : ""}>{passwordsMatch ? "Passwords match." : passwordsMismatch ? "Passwords don't match." : "Type the same password again."}</span>}
                    >
                      <div className="relative">
                        <input
                          id={`${id}-confirm`}
                          type={showConfirmPassword ? "text" : "password"}
                          className={`${inputClass} pr-16`}
                          required
                          autoComplete="new-password"
                          placeholder="Re-enter the password"
                          aria-invalid={passwordsMismatch}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((shown) => !shown)}
                          aria-pressed={showConfirmPassword}
                          className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-[13px] text-[#6b7280] hover:text-[#111827]"
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </Field>
                  </div>
                ) : null}
              </>
            )}

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

          <div className="flex justify-end gap-3 rounded-2xl border border-[#e3e8e5] bg-white px-6 py-4 shadow-[0_1px_2px_rgba(11,21,34,0.04)] max-[640px]:px-5">
            <Link href={backHref} className={`${buttonClass} border-[#d9dee3] bg-white text-[#111827] no-underline hover:border-[#c3cad2] hover:bg-[#f8faf9]`}>
              Cancel
            </Link>
            <button type="submit" disabled={isPending} className={`${buttonClass} min-w-36 border-[#0b1522] bg-[#0b1522] text-white shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a]`}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Save client"}
            </button>
          </div>
        </form>

        {/* Beside the form. It stays at the top of the window while the form scrolls under it; the
            stickiness is on the grid's own column, which is as tall as the form — a wrapper only
            as tall as these cards would have nowhere to stick. */}
        <aside className="sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col gap-4 self-start overflow-y-auto max-[960px]:static max-[960px]:order-first max-[960px]:max-h-none">
          {client ? (
            <ClientSaid client={client} />
          ) : (
            <div className={`${sideCardClass} border-[#d6e2f9] bg-[#f4f8ff]`}>
              <div className="mb-4 flex items-center gap-3">
                <Icon name="people" />
                <h3 className="text-[16px] leading-snug font-bold text-[#0f172a]">Adding a client for the team</h3>
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
          <div className={`${sideCardClass} border-[#cfeedb] bg-[#f0fbf3]`}>
            <h4 className="mb-1.5 text-[14.5px] font-bold text-[#0f172a]">💡 Tip</h4>
            <p className="text-[13px] leading-normal text-[#4b5563]">Collect the client&apos;s logins and access details on the onboarding call so the transfer checklists can be completed right away.</p>
          </div>
          <div className={`${sideCardClass} border-[#e3e8e5] bg-white`}>
            <h4 className="mb-1.5 text-[14.5px] font-bold text-[#0f172a]">Need help?</h4>
            <p className="text-[13px] leading-normal text-[#4b5563]">Not sure how to set up a client? Check the help docs or contact support.</p>
            <span className="mt-2.5 inline-block text-[13px] font-semibold text-[#2563eb]">Contact Support →</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

// The Add Client page: the form, empty. Editing uses the same form filled in (ClientEdit.tsx).
const ClientAdd = ({ staff }: { staff?: StaffOption[] }) => <ClientForm staff={staff} />;

export default ClientAdd;
