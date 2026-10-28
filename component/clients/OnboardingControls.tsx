"use client";

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { MessageSquare } from "lucide-react";
import { listOnboardingCommentsAction, type OnboardingComment } from "@/app/actions/onboarding";
import type { Client } from "@/app/actions/clients";
import OnboardingThread from "./OnboardingThread";
import { GOAL_BUDGETS, GOAL_TIMEFRAMES, LEAD_SOURCES, NONE, REACH_BY, groupsOf, isAnswered, linkOf, money, targetOf, type Item } from "./clientUi";

// Step 4 of the client form: the client's onboarding as the account manager works through it.
// Two views of the same steps and items. "Onboarding controls" says which of them this client
// needs and which are approved; "Credentials & onboarding" shows what the client gave for each,
// and how far along it is. Built from the "Onboarding controls · Bayshore Admin" mockup, in
// the form's own face and colors (ClientAdd.tsx).
//
// Where an item stands comes from the client's own answers (clientUi.ts → groupsOf). What is
// ticked here is the form's to hold and save (ClientAdd.tsx): a step or item the client doesn't
// need is left off their own onboarding form (client-portal: OnboardingProcess), and "Approved"
// is the account manager's word that what they gave was checked.

// ── What is shown ────────────────────────────────────────────────────────────

// Where the client stands on an item: they filled it in, they asked for help, or nothing yet.
export type Status = "filled" | "help" | "wait";
// What the client gave for an item, as the credentials view names it.
export type Kind = "login" | "invite" | "link" | "files" | "details" | "help" | "empty";
export type Entry = { id: string; name: string; answer: string; st: Status; kind: Kind; details: Item["details"] };
// `locked` is a step every client has: it can't be taken off.
export type Step = { id: string; title: string; items: Entry[]; locked?: boolean };

// What a client isn't asked until the team turns it on: every step but who they are, their
// website, their business email and their logo. It stands until the team saves ticks of its
// own — and it is the client's form's list too (client-portal: onboardingData.ts → DEFAULT_NOT_NEEDED).
export const DEFAULT_NOT_NEEDED = ["step:domain", "step:google", "step:social", "step:media"];

// The ticks, by the id of the step or item: what the client doesn't need, and what is approved.
export type Ticks = Record<string, boolean>;
export const ticksOf = (ids: string[] = []): Ticks => Object.fromEntries(ids.map((id) => [id, true]));
export const tickedIn = (ticks: Ticks) => Object.keys(ticks).filter((id) => ticks[id]);

// The steps whose items are kept by name under the step's own (onboarding.google.ads): their
// ids carry it, so that the business email and the email login don't share one.
const NAMED_UNDER_STEP = ["google", "social", "media"];

export const KIND_LABELS: Record<Kind, string> = { login: "Login & password", invite: "Access invite", link: "Link", files: "Files", details: "Details", help: "Needs help", empty: "Nothing yet" };

// The fields of an item that hold something to copy: a login, or an address.
const COPIED = ["Login username", "Link or name", "Current website", "Shared folder", "Logo files", "Email"];

// One of the client's answers (clientUi.ts → Item), as this step shows it.
const entryOf = (step: string, item: Item): Entry => {
  const id = NAMED_UNDER_STEP.includes(step) ? `${step}.${item.id}` : item.id;
  const given = item.details.filter(([, value]) => value !== NONE);
  const of = (label: string) => given.find(([name]) => name === label)?.[1];
  // "Not needed" is the client's own no: an answer like any other.
  const st: Status = item.tone === "ready" || (item.tone === "none" && isAnswered(item)) ? "filled" : item.tone === "followup" || item.tone === "create" ? "help" : "wait";
  const kind: Kind =
    st === "help"
      ? "help"
      : !isAnswered(item)
        ? "empty"
        : of("Login username")
          ? "login"
          : of("Access given") === "Yes" || (of("How they give access") && of("How they give access") !== "Sharing the login")
            ? "invite"
            : of("Uploaded")
              ? "files"
              : given.some(([, value]) => linkOf(value))
                ? "link"
                : "details";
  return { id, name: item.name, answer: isAnswered(item) ? item.label : "No answer yet", st, kind, details: given };
};

// Who the client is — the first step, from what the form above holds.
export type About = { contactName: string; companyName: string; email: string; phone: string };

const aboutStep = (about: About, onboarding?: Client["onboarding"]): Step => {
  const rows = (pairs: [string, string | undefined][]): Item["details"] => pairs.flatMap(([label, value]) => (value?.trim() ? [[label, value.trim()] as [string, string]] : []));
  const entry = (id: string, name: string, details: Item["details"], needed: string): Entry =>
    needed.trim()
      ? { id, name, answer: "Submitted", st: "filled", kind: "details", details }
      : { id, name, answer: "No answer yet", st: "wait", kind: "empty", details };
  const { business, goals, kickoffCall } = onboarding ?? {};
  // Asked only when signing up.
  const metaAds = onboarding?.social?.metaAds;
  // One item, as on the client's own form: who is answering — with what they said there, and
  // right after signing up, about their business and their goals.
  return {
    id: "step:contact",
    title: "About you",
    locked: true,
    items: [
      entry(
        "contact",
        "Your details",
        rows([
          ["Name", about.contactName],
          ["Company", about.companyName],
          ["Email", about.email],
          ["Phone", about.phone],
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
          ["Cost of one lead today", goals?.costPerLead === undefined ? undefined : money(goals.costPerLead)],
          ["Worth of one new client", goals?.clientValue === undefined ? undefined : money(goals.clientValue)],
          ["Where leads come from", goals?.leadSources?.map((source) => LEAD_SOURCES[source] ?? source).join(", ")],
          [
            "Meta Ads (Facebook / Instagram)",
            metaAds?.has
              ? [
                  metaAds.has === "yes" ? "Has an account" : metaAds.wantsCreated ? "Create the account" : metaAds.has === "unsure" ? "Not sure whether one exists" : "Doesn't have one",
                  metaAds.link,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : undefined,
          ],
          ["Kickoff call", kickoffCall ? (kickoffCall.booked ? "Booked (the client says so)" : "Not booked yet") : undefined],
        ]),
        about.contactName && about.companyName && about.email,
      ),
    ],
  };
};

export const stepsOf = (about: About, client?: Client): Step[] => [
  aboutStep(about, client?.onboarding),
  ...groupsOf({ onboarding: client?.onboarding ?? { status: "in_progress" } }).map((group) => ({ id: `step:${group.id}`, title: group.title, items: group.items.map((item) => entryOf(group.id, item)) })),
];

// ── Looks ────────────────────────────────────────────────────────────────────

const PILLS = {
  filled: ["Client filled", "bg-[#E8F7EE] text-[#15803D] font-bold"],
  help: ["Client needs help", "bg-[#F3EEFF] text-[#6D28D9] font-bold"],
  wait: ["Waiting", "bg-[#FEF3E2] text-[#92400E] font-bold"],
  off: ["Not needed", "bg-[#F3F4F6] text-[#6B7280] font-semibold"],
} as const;
type PillTone = keyof typeof PILLS;

// Where a whole step stands — the same three the client sees beside their own form
// (client-portal: OnboardingProcess → STEP_DOTS): approved once every item on it is, todo while
// the client still owes an answer, and submitted otherwise. Plus not needed.
type StepStanding = "approved" | "submitted" | "todo" | "off";
const STANDINGS: Record<StepStanding, { label: string; pill: string; dot: string; legend: string }> = {
  approved: { label: "Approved", pill: "bg-[#E8F7EE] text-[#15803D]", dot: "bg-[#16A34A] text-white shadow-[0_0_0_1px_#E5E7EB]", legend: "bg-[#16A34A]" },
  submitted: { label: "Submitted", pill: "bg-[#E8EEFF] text-[#2F5FD8]", dot: "bg-[#2F5FD8] text-white shadow-[0_0_0_1px_#E5E7EB]", legend: "bg-[#2F5FD8]" },
  todo: { label: "Todo", pill: "bg-[#FEF3C7] text-[#B45309]", dot: "bg-[#FEF3C7] text-[#B45309] shadow-[0_0_0_2px_#D97706]", legend: "bg-[#FEF3C7] shadow-[0_0_0_2px_#D97706]" },
  off: { label: "Not needed", pill: "bg-[#F3F4F6] text-[#6B7280]", dot: "bg-[#D1D5DB] text-[#6B7280] shadow-[0_0_0_1px_#E5E7EB]", legend: "bg-[#D1D5DB]" },
};

const pillClass = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[12px] whitespace-nowrap";
const Pill = ({ tone }: { tone: PillTone }) => <span className={`${pillClass} ${PILLS[tone][1]}`}>{PILLS[tone][0]}</span>;
const StandingPill = ({ standing }: { standing: StepStanding }) => <span className={`${pillClass} font-bold ${STANDINGS[standing].pill}`}>{STANDINGS[standing].label}</span>;

const gridClass = "grid grid-cols-[minmax(0,1fr)_150px_140px_170px_52px] items-center";
const stepNumClass = "text-[11px] font-bold tracking-[0.06em] text-[#2563eb]";
const checkClass = "size-4 cursor-pointer accent-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40";
const smallButtonClass = "h-8 cursor-pointer rounded-lg border border-[#e3e8e5] bg-white px-2.5 text-[12px] font-semibold text-[#111827] hover:bg-[#F9FAFB]";
const cardClass = "rounded-xl border border-[#e3e8e5] bg-white";
// A line from the stop before this one — the first has none.
const lineClass = "before:absolute before:-left-1/2 before:w-full before:content-[''] first:before:hidden";

// A box to tick, with what it says. The words fade with the box when it can't be ticked.
const Tick = ({ label, checked, disabled = false, onChange, short = false }: { label: string; checked: boolean; disabled?: boolean; onChange: () => void; short?: boolean }) => (
  <label className={`inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#374151] ${short ? "min-h-9" : "min-h-11"}`}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className={checkClass} />
    <span className={disabled ? "opacity-50" : ""}>{label}</span>
  </label>
);

const TickMark = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  return (
    <button type="button" className={smallButtonClass} onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

// ── Credentials view ─────────────────────────────────────────────────────────

// What the client gave for one item.
const Given = ({ item }: { item: Entry }) => {
  const list = item.details.length ? (
    <dl className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1.5 text-[13px]">
      {item.details.map(([label, value]) => {
        const link = linkOf(value);
        return (
          <div key={label} className="contents">
            <dt className="text-[12px] font-semibold text-[#6B7280]">{label}</dt>
            <dd className="flex min-w-0 flex-wrap items-center gap-2 break-all whitespace-pre-wrap">
              {link ? (
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline">
                  {value}
                </a>
              ) : (
                <span className={label === "Login username" ? "font-mono text-[13px] font-medium" : ""}>{value}</span>
              )}
              {COPIED.includes(label) || link ? <CopyButton value={value} label={label.toLowerCase()} /> : null}
            </dd>
          </div>
        );
      })}
    </dl>
  ) : null;

  if (item.kind === "empty") return <div className="rounded-[10px] bg-[#FEF3E2] px-3 py-2.5 text-[13px] text-[#92400E]">The client hasn&apos;t entered anything for this yet.</div>;
  if (item.kind !== "help") return list;
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[10px] bg-[#F3EEFF] px-3 py-2.5 text-[13px] text-[#6D28D9]">{item.answer}</div>
      {list}
    </div>
  );
};

type Shown = Entry & { on: boolean; ap: boolean };

// How far along one item is: asked for, given by the client, approved.
const Track = ({ item }: { item: Shown }) => {
  const input = item.st === "filled" ? ["Entered", "border-[#16A34A] bg-[#16A34A]"] : item.st === "help" ? ["Needs help", "border-[#7C3AED] bg-[#7C3AED]"] : ["Waiting", "border-[#D97706] bg-white"];
  const stops: { label: string; sub: string; dot: string; line: boolean; ticked: boolean }[] = [
    { label: "Requested", sub: item.on ? "Asked client" : "Not needed", dot: item.on ? "border-[#16A34A] bg-[#16A34A]" : "border-[#D1D5DB] bg-white", line: item.on, ticked: item.on },
    { label: "Client input", sub: item.on ? input[0] : "—", dot: item.on ? input[1] : "border-[#D1D5DB] bg-white", line: item.on && item.st === "filled", ticked: item.on && item.st === "filled" },
    { label: "Approved", sub: item.ap ? "By account manager" : "Pending", dot: item.ap ? "border-[#16A34A] bg-[#16A34A]" : "border-[#D1D5DB] bg-white", line: item.ap, ticked: item.ap },
  ];
  return (
    <div className="grid grid-cols-3" aria-label={`Progress for ${item.name}`}>
      {stops.map((stop) => (
        <div key={stop.label} className={`relative flex flex-col items-center gap-1.5 text-center ${lineClass} before:top-[9px] before:h-[3px] ${stop.line ? "before:bg-[#16A34A]" : "before:bg-[#D1D5DB]"}`}>
          <div className={`relative z-[1] flex size-5 items-center justify-center rounded-full border-[3px] ${stop.dot}`}>{stop.ticked ? <TickMark /> : null}</div>
          <div className="text-[11px] font-bold text-[#374151]">{stop.label}</div>
          <div className="text-[11px] text-[#6B7280]">{stop.sub}</div>
        </div>
      ))}
    </div>
  );
};

// ── The step ─────────────────────────────────────────────────────────────────

const Legend = ({ dot, children }: { dot: string; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5">
    <i className={`inline-block size-2.5 rounded-full ${dot}`} />
    {children}
  </span>
);

// `off` is what this client doesn't need — steps and items, by id — and `approved` the items
// that are approved: both the form's, which saves them with the client.
const OnboardingControls = ({
  client,
  about,
  off,
  setOff,
  approved,
  setApproved,
}: {
  client?: Client;
  about: About;
  off: Ticks;
  setOff: Dispatch<SetStateAction<Ticks>>;
  approved: Ticks;
  setApproved: Dispatch<SetStateAction<Ticks>>;
}) => {
  const steps = stepsOf(about, client);
  const [tab, setTab] = useState<"controls" | "creds">("controls");
  const [open, setOpen] = useState<Ticks>({});
  const flip = (id: string) => (now: Ticks) => ({ ...now, [id]: !now[id] });

  // What the client wrote on their own form, step by step, with the team's replies. Only a
  // client already saved has any.
  const clientId = client?._id;
  const [comments, setComments] = useState<OnboardingComment[]>([]);
  useEffect(() => {
    if (!clientId) return;
    let live = true;
    void listOnboardingCommentsAction(clientId).then((result) => {
      if (live && result.ok && result.data) setComments(result.data);
    });
    return () => {
      live = false;
    };
  }, [clientId]);
  const commentsOn = (stepId: string) => comments.filter((comment) => `step:${comment.step}` === stepId);
  const replaced = (updated: OnboardingComment) => setComments((now) => now.map((comment) => (comment._id === updated._id ? updated : comment)));

  // Both views read the same sums.
  const totals = { included: 0, approved: 0, off: 0, filled: 0, help: 0, wait: 0 };
  // The steps the client's own form has, counted as it counts them: one with nothing left to
  // ask isn't on their form, so it has no number here either.
  let asked = 0;
  const shown = steps.map((step) => {
    const stepOn = step.locked || !off[step.id];
    const items: Shown[] = step.items.map((item) => {
      const on = stepOn && (step.locked || !off[item.id]);
      const ap = on && Boolean(approved[item.id]);
      if (on) {
        totals.included++;
        if (ap) totals.approved++;
        totals[item.st]++;
      } else totals.off++;
      return { ...item, on, ap };
    });
    const onItems = items.filter((item) => item.on);
    const apCount = onItems.filter((item) => item.ap).length;
    const hasItems = onItems.length > 0;
    const allApproved = hasItems && apCount === onItems.length;
    const standing: StepStanding = !hasItems ? "off" : allApproved ? "approved" : onItems.some((item) => item.st === "wait") ? "todo" : "submitted";
    return { ...step, stepOn, items, onCount: onItems.length, apCount, hasItems, allApproved, standing, number: hasItems ? ++asked : 0 };
  });
  // "Step 3 of 7", as the client reads it on their form.
  const numberOf = (step: (typeof shown)[number]) => (step.number ? `STEP ${step.number} OF ${asked}` : "NOT ON THE CLIENT\u2019S FORM");

  // Ticking a step approves every item in it; unticking takes them all back.
  const approveStep = (step: (typeof shown)[number]) =>
    setApproved((now) => ({ ...now, ...Object.fromEntries(step.items.filter((item) => item.on).map((item) => [item.id, !step.allApproved])) }));

  const said = client?.onboarding;
  // The same on the server and in the browser, whatever its timezone.
  const submittedOn = said?.submittedAt ? new Date(said.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
  const tabClass = (on: boolean) =>
    `h-9 cursor-pointer rounded-lg px-3.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-150 ${on ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "bg-transparent text-[#4B5563]"}`;

  return (
    <div className="flex flex-col gap-4 text-[#111827]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Onboarding views" className="flex max-w-full gap-1 overflow-x-auto rounded-[10px] bg-[#f1f3f5] p-1">
          <button type="button" role="tab" aria-selected={tab === "controls"} className={tabClass(tab === "controls")} onClick={() => setTab("controls")}>
            Onboarding controls
          </button>
          <button type="button" role="tab" aria-selected={tab === "creds"} className={tabClass(tab === "creds")} onClick={() => setTab("creds")}>
            Credentials &amp; onboarding
          </button>
        </div>
        {said?.status === "submitted" ? (
          <span className={`${pillClass} bg-[#E8F7EE] font-semibold text-[#15803D]`}>Client submitted{submittedOn ? ` ${submittedOn}` : ""}</span>
        ) : said?.status ? (
          <span className={`${pillClass} bg-[#FEF3E2] font-semibold text-[#92400E]`}>Client still filling in</span>
        ) : (
          <span className={`${pillClass} bg-[#F3F4F6] font-semibold text-[#6B7280]`}>Not started</span>
        )}
      </div>

      {tab === "controls" ? (
        <div role="tabpanel">
          <div className="flex min-w-0 flex-col gap-3.5">
            {shown.map((step) => (
              <section key={step.id} className={`${cardClass} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    <div className={`${gridClass} px-4.5 py-2.5`}>
                      <div>
                        <div className={step.number ? stepNumClass : `${stepNumClass} text-[#9CA3AF]!`}>{numberOf(step)}</div>
                        <div className={`text-[15.5px] font-bold ${step.stepOn ? "" : "text-[#9CA3AF] line-through"}`}>{step.title}</div>
                        <div className="text-[12px] text-[#6B7280]">
                          {step.stepOn ? `${step.apCount} of ${step.onCount} approved · ${step.items.length - step.onCount} not needed` : "Removed from this client’s onboarding"}
                        </div>
                      </div>
                      <Tick label="Client needs" checked={step.stepOn} disabled={step.locked} onChange={() => setOff(flip(step.id))} />
                      <Tick label="Approved" checked={step.allApproved} disabled={!step.hasItems} onChange={() => approveStep(step)} />
                      <div>
                        <StandingPill standing={step.standing} />
                      </div>
                      <button
                        type="button"
                        aria-expanded={Boolean(open[step.id])}
                        aria-label={`Show or hide ${step.title} items`}
                        onClick={() => setOpen(flip(step.id))}
                        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#e3e8e5] bg-white text-[#374151] hover:bg-[#F3F4F6]"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform duration-150 ${open[step.id] ? "rotate-180" : ""}`}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                    {open[step.id] ? (
                      <div className="border-t border-[#EEF0F3]">
                        {step.items.map((item) => (
                          <div key={item.id} className={`${gridClass} border-t border-[#F1F2F4] py-0.5 pr-4.5 pl-[42px] first:border-t-0 ${item.on ? "" : "bg-[#FAFAFB]"}`}>
                            <div className="flex min-w-0 flex-col gap-0.5 py-2">
                              <div className={`text-[14px] font-semibold ${item.on ? "" : "text-[#9CA3AF] line-through"}`}>{item.name}</div>
                              <div className="text-[12px] text-[#6B7280]">{item.answer}</div>
                            </div>
                            <Tick label="Client needs" checked={step.locked || !off[item.id]} disabled={step.locked || !step.stepOn} onChange={() => setOff(flip(item.id))} />
                            <Tick label="Approved" checked={item.ap} disabled={!item.on} onChange={() => setApproved(flip(item.id))} />
                            <div>
                              <Pill tone={item.on ? item.st : "off"} />
                            </div>
                            <div />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div role="tabpanel" className="flex flex-col gap-4">
          <section className={`${cardClass} px-5.5 pt-5.5 pb-4.5`}>
            <h4 className="mb-1 text-[15.5px] font-bold">Onboarding map</h4>
            <p className="mb-4.5 text-[13px] text-[#6B7280]">
              {totals.approved} / {totals.included} items approved. Each stop is one step; the line turns green as steps are fully approved.
            </p>
            <div className="overflow-x-auto pb-1">
              <div className="relative grid min-w-[880px]" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(110px, 1fr))` }}>
                {shown.map((step) => {
                  const dot = STANDINGS[step.standing].dot;
                  return (
                    <div key={step.id} className={`relative flex flex-col items-center gap-2 px-1.5 text-center ${lineClass} before:top-[15px] before:z-0 before:h-1 ${step.allApproved ? "before:bg-[#16A34A]" : "before:bg-[#D1D5DB]"}`}>
                      <div className={`relative z-[1] flex size-[34px] items-center justify-center rounded-full border-[3px] border-white text-[13px] font-extrabold ${dot}`}>
                        {step.allApproved ? <TickMark size={14} /> : step.number || "–"}
                      </div>
                      <div className="text-[13px] font-bold">{step.title}</div>
                      <div className="text-[11px] font-semibold text-[#6B7280]">
                        {STANDINGS[step.standing].label}
                        {step.hasItems && !step.allApproved ? ` · ${step.apCount}/${step.onCount} approved` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3.5 text-[12px] text-[#374151]">
              {(Object.keys(STANDINGS) as StepStanding[]).map((standing) => (
                <Legend key={standing} dot={STANDINGS[standing].legend}>
                  {STANDINGS[standing].label}
                </Legend>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3.5">
            {shown.map((step) => (
              <section key={step.id} className={`${cardClass} overflow-hidden`}>
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#EEF0F3] px-4.5 py-3.5">
                  <div>
                    <div className={step.number ? stepNumClass : `${stepNumClass} text-[#9CA3AF]!`}>{numberOf(step)}</div>
                    <div className="text-[15.5px] font-bold">{step.title}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {commentsOn(step.id).length ? (
                      <span className={`${pillClass} bg-[#E8EEFF] font-bold text-[#1E3A8A]`}>
                        <MessageSquare size={12} strokeWidth={2.25} /> {commentsOn(step.id).length}
                      </span>
                    ) : null}
                    {step.hasItems ? (
                      <span className={`${pillClass} bg-[#F3F4F6] font-bold text-[#374151]`}>
                        {step.apCount} of {step.onCount} approved
                      </span>
                    ) : null}
                    <StandingPill standing={step.standing} />
                  </div>
                </div>
                {step.items.map((item, at) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(220px,1fr)] items-start gap-4.5 px-4.5 py-4 max-[820px]:grid-cols-1 ${at ? "border-t border-[#F1F2F4]" : ""} ${item.on ? "" : "opacity-50"}`}
                  >
                    <div>
                      <div className="text-[14px] font-bold">{item.name}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className={`${pillClass} bg-[#E8EEFF] font-semibold text-[#1E3A8A]`}>{KIND_LABELS[item.kind]}</span>
                        <Pill tone={item.on ? item.st : "off"} />
                      </div>
                      <div className="mt-1.5 text-[12px] text-[#6B7280]">Client answer: {item.answer}</div>
                    </div>
                    <div>{item.on ? <Given item={item} /> : <div className="rounded-[10px] bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-[#374151]">Removed from this client&apos;s onboarding.</div>}</div>
                    <div>
                      <Track item={item} />
                      <div className="mt-2.5 flex justify-end">
                        <Tick short label="Approved" checked={item.ap} disabled={!item.on} onChange={() => setApproved(flip(item.id))} />
                      </div>
                    </div>
                  </div>
                ))}
                {clientId ? <OnboardingThread clientId={clientId} comments={commentsOn(step.id)} onChange={replaced} /> : null}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingControls;
