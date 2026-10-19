"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  Pencil,
  PenLine,
  Phone,
  Plus,
  RefreshCw,
  Server,
  StickyNote,
  Target,
  Trash2,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { deleteClientAction, updateClientAction, type Client, type ClientLogin, type ClientStatus } from "@/app/actions/clients";
import type { OnboardingAnswers, OnboardingFile, OnboardingRequest } from "@/app/actions/onboarding";
import {
  CLIENT_HAS,
  CLIENT_STATUS_OPTIONS,
  GOAL_BUDGETS,
  GOAL_TIMEFRAMES,
  LEAD_SOURCES,
  NONE,
  ONBOARDING_STATUS_COLORS,
  ONBOARDING_STATUS_LABELS,
  PORTAL_MENUS,
  REACH_BY,
  SERVICES,
  SOCIAL_PROFILES,
  SOCIAL_TRANSFER,
  TONES,
  TONE_ORDER,
  WEBSITE_TRANSFER,
  avatarColorFor,
  countsOf,
  formatDate,
  formatDateTime,
  groupsOf,
  initialsOf,
  isAnswered,
  linkOf,
  money,
  portalMenusOf,
  sharedOf,
  staffName,
  statusClassName,
  statusLabel,
  targetOf,
  uploadsOf,
  type Item,
  type Tone,
} from "./clientUi";
import {
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDanger,
  btnDangerOutline,
  btnDraft,
  deleteConfirm,
  dashPendingSub,
  sectionCard,
  sectionHeader,
  sectionTitle,
} from "@/component/shared/ui";

// ── Shared pieces ────────────────────────────────────────────────────────────

const iconText = "inline-flex items-center gap-1.25";

// "Add New Content" / "Add New Report" in the sidebar's dark navy.
const btnDark =
  "inline-flex cursor-pointer items-center gap-1.25 whitespace-nowrap rounded-md bg-[#0b1522] px-5 py-2.75 text-[13px] font-bold text-white no-underline shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a]";

const sinceLabel = "mb-0.5 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]";
const sinceValue = "flex items-center gap-1.5 text-[12.5px] font-bold text-[#17242f]";

// The pieces a client's details are laid out with, shared by every card on their page.

// Label / value rows: a fixed label column, the value beside it.
const infoTable =
  "flex flex-col gap-3 [&>div]:grid [&>div]:grid-cols-[110px_1fr] [&>div]:gap-2.5 [&>div]:text-[12.5px] [&>div>span]:font-semibold [&>div>span]:text-[#7a8e9b] [&>div>b]:font-bold [&>div>b]:text-[#17242f]";

// What a field holds — or "None", greyed, when the record has nothing in it.
const Value = ({ children }: { children?: string | null }) =>
  children?.trim() ? <b className="whitespace-pre-wrap break-words">{children}</b> : <b className="font-medium! text-[#a3b1ba]!">None</b>;

// ── What the team recorded (the add/edit form) ───────────────────────────────

// A client's record, read back the way the add/edit form asks for it (ClientAdd.tsx): the same
// five parts in the same order, every field filled in or not — "None" where nothing was given.
// A client from before the form asked, or one who signed up themselves, has little of it.

const listed = (values?: string[]) => (values?.length ? values.join(", ") : undefined);
const yesNo = (value?: boolean) => (value === undefined ? undefined : value ? "Yes" : "No");
// A date the form saved as yyyy-mm-dd.
const day = (value?: string) => (value ? formatDate(value) : undefined);

const SIGNED = { yes: "Yes, signed", sent: "Sent, waiting for signature", no: "Not sent yet" };

// A quantity or a price, as its field on the form holds it.
const fieldValue = (service: string, label: string, value: number) =>
  SERVICES.find((entry) => entry.name === service)?.fields.find((field) => field.label === label)?.money ? money(value) : String(value);

// One field as it is read back: an icon, its label, and what it holds. A `wide` one (an
// address, a list, a note) takes the whole row.
// With a `tone` the value is where the thing stands, shown as a pill; `note` is a line of detail under it.
type Row = { icon: LucideIcon; label: string; value?: string | null; wide?: boolean; tone?: Tone; note?: string };

const Rows = ({ rows }: { rows: Row[] }) => (
  <div className="grid grid-cols-2 gap-x-6 gap-y-4.5 max-[900px]:grid-cols-1">
    {rows.map((row) => (
      <div key={row.label} className={`flex items-start gap-3 ${row.wide ? "col-span-full" : ""}`}>
        <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f3] text-[#4a5c68]">
          <row.icon size={15} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="text-[11.5px] font-semibold text-[#7a8e9b]">{row.label}</div>
          {row.value?.trim() && row.tone ? (
            <span className={`${pill} mt-1 ${TONES[row.tone].className}`}>{row.value}</span>
          ) : row.value?.trim() && linkOf(row.value) ? (
            <a href={linkOf(row.value) ?? undefined} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-[13px] leading-snug font-semibold text-[#2563eb] hover:underline">
              <span className="truncate">{row.value.trim()}</span>
              <ArrowUpRight size={12} strokeWidth={2.25} className="shrink-0" />
            </a>
          ) : row.value?.trim() ? (
            <div className="text-[13px] leading-snug font-semibold break-words whitespace-pre-wrap text-[#17242f]">{row.value}</div>
          ) : (
            <div className="text-[13px] leading-snug font-medium text-[#a3b1ba]">None</div>
          )}
          {row.note ? <div className="mt-1 text-[12px] leading-normal break-words whitespace-pre-wrap text-[#657787]">{row.note}</div> : null}
        </div>
      </div>
    ))}
  </div>
);

// One of the form's five parts: its icon and name as the form has them, and — for those who
// can — the way to the form to change it.
const Section = ({ icon: Icon, title, sub, editHref, children }: { icon: LucideIcon; title: string; sub: string; editHref?: string; children: ReactNode }) => (
  <section className="rounded-xl border border-[#dbe3de] bg-white">
    <div className="flex items-center justify-between gap-3 border-b border-[#eef3ef] px-5.5 py-4">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eff4fe] text-[#2563eb]">
          <Icon size={19} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15.5px] leading-tight font-bold text-[#0d1e2c]">{title}</h2>
          <p className="mt-0.5 text-[12px] text-[#7a8e9b]">{sub}</p>
        </div>
      </div>
      {editHref ? (
        <Link href={editHref} className={`${btnDraft} ${iconText}`}>
          <Pencil size={12} strokeWidth={2} /> Edit
        </Link>
      ) : null}
    </div>
    <div className="px-5.5 py-5">{children}</div>
  </section>
);

// What the client uploaded with their onboarding — their logo, their photos and videos — a
// tile for each file, which opens it.
const Uploads = ({ groups }: { groups: { title: string; files: OnboardingFile[] }[] }) => (
  <div className="flex flex-col gap-4.5">
    {groups.map((group) => (
      <div key={group.title}>
        <div className="mb-2 text-[11.5px] font-semibold text-[#7a8e9b]">
          {group.title} · {group.files.length} file{group.files.length === 1 ? "" : "s"}
        </div>
        <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2.5">
          {group.files.map((file) => (
            <li key={file.url}>
              <a href={file.url} target="_blank" rel="noopener noreferrer" title={file.name} className="block overflow-hidden rounded-lg border border-[#dbe3de] bg-[#f7f9f8] no-underline hover:border-[#2563eb]">
                <span className="block aspect-square">
                  {file.mimeType?.startsWith("video/") ? (
                    <video src={`${file.url}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                  ) : (
                    // The file sits on the storage's own address, which next/image isn't set up for.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt="" className="h-full w-full object-contain" />
                  )}
                </span>
                <span className="block truncate border-t border-[#eef3ef] bg-white px-1.5 py-1 text-[10.5px] font-semibold text-[#4a5c68]">{file.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

// A heading inside a part, as "Contract", "Billing" and "Account" are inside Account setup.
const Subhead = ({ first = false, children }: { first?: boolean; children: ReactNode }) => (
  <h3 className={`mb-4 text-[11px] font-bold tracking-[0.6px] text-[#8496a3] uppercase ${first ? "" : "mt-5.5 border-t border-[#eef3ef] pt-5"}`}>{children}</h3>
);

// The questions the onboarding form asks the client too. On the client's page each is shown
// once, under Business details — so these lines, where the same answer would show again, are
// left out of the onboarding answers further down: by the item's id, the labels of its fields.
const ACCOUNT_LINK = ["Link or name"];
const ASKED_TWICE: Record<string, string[]> = {
  website: ["Current website", "Example websites"],
  logo: ["Has a logo", "Style they'd like"],
  businessProfile: ACCOUNT_LINK,
  ...Object.fromEntries(SOCIAL_PROFILES.map(([key]) => [key, ACCOUNT_LINK])),
};

// The icon for each thing the onboarding form asks about, by the item's id — any Google
// account, social account or kind of media has its group's.
const ANSWER_ICONS: Record<string, LucideIcon> = { website: Globe, domain: Globe, hosting: Server, cms: Lock, email: Mail, logo: Palette };

// One thing the client was asked about on the onboarding form, as a row of their record:
// where it stands for the team, and under it what they answered — less what Business details
// already shows, and the fields they left empty or said no to.
const answerRow = (item: Item, icon: LucideIcon): Row => ({
  icon: ANSWER_ICONS[item.id] ?? icon,
  label: item.name,
  value: item.label,
  tone: item.tone,
  note: item.details
    .filter(([label, value]) => value !== NONE && value !== "No" && !ASKED_TWICE[item.id]?.includes(label))
    .map(([label, value]) => `${label}: ${value}`)
    .join(" · "),
  wide: item.id === "website",
});

// The five parts. `manager` and `team` are the names of the staff on the account.
const RecordSections = ({ client, editHref, manager, team }: { client: Client; editHref?: string; manager?: string; team: string[] }) => {
  const { communication, business, services = [], contract, billing, transfer, reportDelivery } = client.details ?? {};
  const logoDesign = business?.logoDesign;
  const monthly = services.reduce((sum, plan) => sum + plan.monthly, 0);
  // What both forms ask — the team's and the client's onboarding form — is kept once, and shown once.
  const shared = sharedOf(client);
  const oneTime = shared.hasLogo === false && logoDesign?.add ? (logoDesign.price ?? 0) : 0;
  // Services on the client that were never priced on the form.
  const unpriced = client.serviceTypes.filter((name) => !services.some((plan) => plan.name === name));
  const has = transfer?.has ?? [];
  // How far a transfer has got, and which of its steps are done.
  const checklist = (all: string[], done: string[] = []) => `${done.length} of ${all.length} done${done.length ? ` — ${done.join(", ")}` : ""}`;
  const menus = portalMenusOf(client);

  const examples = shared.competitors.map((row) => [row.url, row.note].filter(Boolean).join(" — "));
  // What the client said when signing up: about the business, its goals, the kickoff call, and
  // the one account only asked about then.
  const about = client.onboarding?.business;
  const goals = client.onboarding?.goals;
  const kickoff = client.onboarding?.kickoffCall;
  const metaAds = client.onboarding?.social?.metaAds;
  const metaAdsRow: Row | undefined = metaAds?.has
    ? {
        icon: Link2,
        label: "Meta Ads (Facebook / Instagram)",
        value: metaAds.has === "yes" ? "Has an account" : metaAds.wantsCreated ? "Create the account" : metaAds.has === "unsure" ? "Check whether one exists" : "Doesn't have one",
        tone: metaAds.has === "yes" ? "ready" : metaAds.wantsCreated ? "create" : metaAds.has === "unsure" ? "followup" : "none",
        note: metaAds.link ? `Link or name: ${metaAds.link}` : undefined,
      }
    : undefined;
  // What the client answered on the onboarding form, by the form's own steps. It sits with
  // what the team recorded, under Onboarding and transfer — once they have answered any of it.
  const [site, domains, mail, brand, google, social, media] = groupsOf({ onboarding: client.onboarding ?? { status: "in_progress" } });
  const answeredAny = [site, domains, mail, brand, google, social, media].some((group) => group.items.some(isAnswered));
  const uploads = uploadsOf(client.onboarding);

  return (
    <>
      <Section icon={Users} title="Client information" sub="The client's main contact details." editHref={editHref}>
        <Rows
          rows={[
            { icon: User, label: "Contact name", value: client.contactName },
            { icon: Building2, label: "Company name", value: client.companyName },
            { icon: Mail, label: "Email", value: client.email },
            { icon: Phone, label: "Phone", value: client.phone },
            { icon: MapPin, label: "Address", value: client.address, wide: true },
            { icon: MessageSquare, label: "Preferred communication", value: listed(communication?.methods) },
            { icon: Clock, label: "Best time to reach", value: communication?.bestTime },
            { icon: Globe, label: "Time zone", value: communication?.timeZone },
          ]}
        />
      </Section>

      <Section icon={Briefcase} title="Business details" sub="What the team collected about the business." editHref={editHref}>
        <Rows
          rows={[
            { icon: Briefcase, label: "Industry", value: business?.industry },
            { icon: Building2, label: "Business type", value: business?.businessType },
            { icon: Globe, label: "Website", value: shared.hasNoWebsite ? "No website yet" : shared.website },
            { icon: MapPin, label: "Google Business Profile", value: shared.googleBusinessProfile },
            { icon: Target, label: "Service area", value: business?.serviceArea },
            { icon: Users, label: "Target audience", value: business?.targetAudience },
            { icon: FileText, label: "Competitors", value: examples.length ? examples.join("\n") : shared.competitorsBefore, wide: true },
            ...SOCIAL_PROFILES.map(([key, label]) => ({ icon: Link2, label: label.replace(/ URL$/, ""), value: shared.social[key] })),
            { icon: Palette, label: "Has a logo", value: yesNo(shared.hasLogo) },
            ...(shared.hasLogo === false
              ? [
                  {
                    icon: Palette,
                    label: "Logo design",
                    value: logoDesign?.add ? `Added to onboarding · ${money(logoDesign.price ?? 0)} one-time · ${logoDesign.concepts ?? 0} concepts` : "Not added to onboarding",
                  },
                  { icon: PenLine, label: "Logo style", value: shared.logoStyle },
                ]
              : []),
            { icon: FileText, label: "Other details", value: business?.otherDetails, wide: true },
          ]}
        />
        {about ? (
          <>
            <Subhead>From the client, at sign-up</Subhead>
            <Rows
              rows={[
                { icon: FileText, label: "Business description", value: about.description, wide: true },
                { icon: Briefcase, label: "Services they offer", value: listed(about.services), wide: true },
                { icon: MapPin, label: "Areas they serve", value: listed(about.areas), wide: true },
                { icon: User, label: "Main contact", value: [about.contact?.name, about.contact?.email, about.contact?.phone].filter(Boolean).join(" · ") },
                { icon: MessageSquare, label: "Best way to reach them", value: REACH_BY[about.contact?.reachBy ?? ""] },
              ]}
            />
          </>
        ) : null}
      </Section>

      {/* Asked only of a client who signs up themselves: a part of its own when they answered it. */}
      {goals ? (
        <Section icon={Target} title="Goals" sub="Where the client is today and where they want to be, as they said when signing up.">
          <Rows
            rows={[
              { icon: DollarSign, label: "Revenue per month", value: targetOf(goals.revenue, money) },
              { icon: Users, label: "Leads per month", value: targetOf(goals.leads, String) },
              { icon: User, label: "New clients per month", value: targetOf(goals.newClients, String) },
              { icon: Clock, label: "How soon", value: GOAL_TIMEFRAMES[goals.timeframe ?? ""] },
              { icon: CreditCard, label: "Monthly marketing budget", value: GOAL_BUDGETS[goals.budget ?? ""] },
              { icon: DollarSign, label: "Cost of one lead today", value: goals.costPerLead === undefined ? undefined : money(goals.costPerLead) },
              { icon: DollarSign, label: "Worth of one new client", value: goals.clientValue === undefined ? undefined : money(goals.clientValue) },
              { icon: Link2, label: "Where leads come from", value: listed(goals.leadSources?.map((source) => LEAD_SOURCES[source] ?? source)), wide: true },
            ]}
          />
        </Section>
      ) : null}

      <Section icon={DollarSign} title="Services and pricing" sub="The services the client agreed to, with their quantities and prices." editHref={editHref}>
        {services.map((plan) => (
          <div key={plan.name} className="border-t border-[#eef3ef] py-3.5 text-[12.5px] first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-3 text-[13.5px] font-bold text-[#17242f]">
              <span>{plan.name}</span>
              <span className="tabular-nums whitespace-nowrap">{money(plan.monthly)}/mo</span>
            </div>
            <div className="mt-1 text-[12px] leading-normal text-[#556977]">{plan.fields.map((field) => `${field.label}: ${fieldValue(plan.name, field.label, field.value)}`).join(" · ")}</div>
            <div className="mt-1.5 text-[12px] leading-normal text-[#556977]">
              <b className="font-semibold text-[#7a8e9b]">Included:</b> {listed(plan.included) ?? "Nothing ticked"}
            </div>
            {plan.addons.length ? (
              <div className="mt-1 text-[12px] leading-normal text-[#556977]">
                <b className="font-semibold text-[#7a8e9b]">Add-on rates (not billed now):</b> {plan.addons.map((addon) => `${addon.label} ${money(addon.price)}`).join(" · ")}
              </div>
            ) : null}
          </div>
        ))}
        {unpriced.length ? (
          <div className={`${services.length ? "border-t border-[#eef3ef] pt-3.5" : ""} text-[12.5px]`}>
            <b className="text-[13.5px] font-bold text-[#17242f]">{unpriced.join(", ")}</b>
            <div className={`${dashPendingSub} mt-1`}>No quantities or prices were recorded for {unpriced.length === 1 ? "this service" : "these services"}.</div>
          </div>
        ) : null}
        {services.length || unpriced.length ? null : <div className="text-[13px] font-medium text-[#a3b1ba]">No services yet.</div>}
        <div className="mt-4 rounded-lg bg-[#0b1522] px-4 py-3 text-[12.5px] text-white">
          <div className="flex items-baseline justify-between gap-3">
            <span>Monthly total</span>
            <b className="text-[16px] font-bold tabular-nums">{money(monthly)}</b>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-[#23374e] pt-1.5 text-[#c7d2da]">
            <span>One-time fees (logo design)</span>
            <span className="tabular-nums">{money(oneTime)}</span>
          </div>
        </div>
      </Section>

      <Section icon={ClipboardList} title="Onboarding and transfer" sub="What the client already has, what they need, and what we are taking over." editHref={editHref}>
        {answeredAny ? <Subhead first>Recorded by the team</Subhead> : null}
        <Rows
          rows={[
            { icon: Check, label: "Client has", value: listed(CLIENT_HAS.filter(([key]) => has.includes(key)).map(([, label]) => label)), wide: true },
            { icon: Plus, label: "Client needs", value: listed(transfer?.needs), wide: true },
            ...(has.includes("website") ? [{ icon: Globe, label: "Website transfer", value: checklist(WEBSITE_TRANSFER, transfer?.websiteDone), wide: true }] : []),
            ...(has.includes("social") ? [{ icon: Users, label: "Social media transfer", value: checklist(SOCIAL_TRANSFER, transfer?.socialDone), wide: true }] : []),
          ]}
        />
        {answeredAny ? (
          <>
            <Subhead>Website, domain and brand — from the client</Subhead>
            <Rows rows={[...site.items, ...domains.items, ...mail.items, ...brand.items].map((item) => answerRow(item, Globe))} />
            <Subhead>Google accounts — from the client</Subhead>
            <Rows rows={google.items.map((item) => answerRow(item, MapPin))} />
            <Subhead>Social media — from the client</Subhead>
            <Rows rows={[...social.items.map((item) => answerRow(item, Link2)), ...(metaAdsRow ? [metaAdsRow] : [])]} />
            <Subhead>Photos and videos — from the client</Subhead>
            <Rows rows={media.items.map((item) => answerRow(item, Camera))} />
          </>
        ) : null}
        {uploads.length ? (
          <>
            <Subhead>Files the client uploaded</Subhead>
            <Uploads groups={uploads} />
          </>
        ) : null}
      </Section>

      <Section icon={Lock} title="Account setup" sub="Contract, billing, who looks after the client and what their portal shows." editHref={editHref}>
        <Subhead first>Contract</Subhead>
        <Rows
          rows={[
            { icon: Calendar, label: "Start date", value: client.startDate ? formatDate(client.startDate) : undefined },
            { icon: Clock, label: "Length", value: contract?.termMonths ? `${contract.termMonths} month${contract.termMonths === 1 ? "" : "s"}` : contract ? "Custom" : undefined },
            { icon: Calendar, label: "End date", value: day(contract?.endDate) },
            { icon: RefreshCw, label: "Renewal", value: contract?.renewal },
            { icon: Bell, label: "Cancellation notice", value: contract?.cancellationNotice },
            { icon: Bell, label: "Renewal reminder", value: contract?.renewalReminder },
            { icon: PenLine, label: "Signed", value: contract?.signed ? SIGNED[contract.signed] : undefined },
            ...(contract?.signed === "yes" ? [{ icon: Calendar, label: "Date signed", value: day(contract.dateSigned) }] : []),
            ...(contract?.signed === "sent" ? [{ icon: Calendar, label: "Date sent", value: day(contract.dateSent) }] : []),
          ]}
        />

        <Subhead>Billing</Subhead>
        <Rows
          rows={[
            { icon: CreditCard, label: "Payment on file", value: billing ? (billing.paymentOnFile ? "Yes, added" : "Not yet") : undefined },
            { icon: CreditCard, label: "Payment method", value: billing?.method },
            { icon: RefreshCw, label: "Billing cycle", value: billing?.cycle },
            { icon: Calendar, label: "Billing day", value: billing?.day },
            { icon: DollarSign, label: "Setup fee", value: billing?.setupFee },
            { icon: Mail, label: "Report delivery", value: reportDelivery },
          ]}
        />

        <Subhead>Account</Subhead>
        <Rows
          rows={[
            { icon: UserCog, label: "Account manager", value: manager },
            { icon: Users, label: "Assigned staff", value: team.join(", ") },
            // No choice made is every page. Settings is always there, so it isn't among them.
            {
              icon: LayoutGrid,
              label: "Portal pages shown",
              value: menus ? (listed(PORTAL_MENUS.filter(([key]) => menus.includes(key)).map(([, label]) => label)) ?? "None of them — only Settings") : "All pages",
              wide: true,
            },
            ...(menus ? [{ icon: LayoutGrid, label: "Portal pages hidden", value: listed(PORTAL_MENUS.filter(([key]) => !menus.includes(key)).map(([, label]) => label)), wide: true }] : []),
            ...(kickoff ? [{ icon: Calendar, label: "Kickoff call", value: kickoff.booked ? "Booked (the client says so)" : "Not booked yet" }] : []),
            { icon: StickyNote, label: "Internal notes", value: client.notes, wide: true },
          ]}
        />
      </Section>
    </>
  );
};

// ── What the client answered (the onboarding form) ───────────────────────────

const pill = "inline-flex shrink-0 items-center whitespace-nowrap rounded-xl px-2.5 py-0.75 text-[11px] font-bold";

// Fields and what is in them — "None", greyed, where there is nothing. A web address opens in
// a new tab.
const Fields = ({ rows }: { rows: [label: string, value: string][] }) => (
  <dl className="flex flex-col gap-1.5">
    {rows.map(([label, value]) => {
      const link = linkOf(value);
      return (
        <div key={label} className="grid grid-cols-[150px_minmax(0,1fr)] gap-2.5 text-[12px]">
          <dt className="font-semibold text-[#7a8e9b]">{label}</dt>
          <dd className={`whitespace-pre-line break-words ${value === NONE ? "text-[#a3b1ba]" : "text-[#24333f]"}`}>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-[#2563eb] hover:underline">
                <span className="truncate">{link}</span>
                <ArrowUpRight size={12} strokeWidth={2.25} className="shrink-0" />
              </a>
            ) : (
              value
            )}
          </dd>
        </div>
      );
    })}
  </dl>
);

// One thing the client was asked about, in a box of its own: where it stands for the team,
// and all of its fields.
const ItemBox = ({ item }: { item: Item }) => (
  <div className="rounded-lg border border-[#e6ece8] bg-[#fbfcfb] p-4">
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#eef3ef] pb-2.5">
      <span className="text-[13px] font-bold text-[#17242f]">{item.name}</span>
      <span className={`${pill} ${TONES[item.tone].className}`}>{item.label}</span>
    </div>
    <Fields rows={item.details} />
  </div>
);

// The onboarding form's answers, a tab for each step of the form in the order it asks them —
// Website, Domain and hosting, Business email and so on — one step on show at a time. Every
// field is listed with what the client put in it, and "None" where they put nothing, so a
// client who never went through onboarding shows every field as "None". Each tab says how many
// of its items were answered. `first` is a tab to put ahead of the form's own.
const OnboardingAnswerTabs = ({ onboarding, first }: { onboarding?: OnboardingAnswers; first?: { title: string; content: ReactNode } }) => {
  const tabs: { title: string; items?: Item[]; content?: ReactNode }[] = [
    ...(first ? [first] : []),
    ...groupsOf({ onboarding: onboarding ?? { status: "in_progress" } }),
  ];
  const [chosen, setChosen] = useState(0);
  const active = Math.min(chosen, tabs.length - 1);
  const tab = tabs[active];

  return (
    <div>
      <div role="tablist" aria-label="Onboarding answers" className="flex gap-1.5 overflow-x-auto rounded-lg border border-[#dbe3de] bg-white p-1">
        {tabs.map((entry, index) => {
          const on = index === active;
          return (
            <button
              key={entry.title}
              type="button"
              role="tab"
              id={`onboarding-tab-${index}`}
              aria-selected={on}
              aria-controls="onboarding-tab-panel"
              onClick={() => setChosen(index)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-1.75 text-[12.5px] font-semibold transition-colors ${
                on ? "bg-[#2563eb] text-white" : "text-[#64748b] hover:bg-[#f1f5f3] hover:text-[#17242f]"
              }`}
            >
              <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold ${on ? "bg-white/20 text-white" : "bg-[#eef1ef] text-[#64748b]"}`}>
                {index + 1}
              </span>
              {entry.title}
              {entry.items ? (
                <span className={`rounded-full px-1.5 text-[10.5px] font-bold ${on ? "bg-white/20 text-white" : "bg-[#eef1ef] text-[#7a8e9b]"}`}>
                  {entry.items.filter(isAnswered).length}/{entry.items.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section role="tabpanel" id="onboarding-tab-panel" aria-labelledby={`onboarding-tab-${active}`} className={`${sectionCard} mt-3.5`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={sectionTitle}>{tab.title}</h2>
          <span className="text-[11.5px] text-[#7a8e9b]">
            Step {active + 1} of {tabs.length}
          </span>
        </div>
        {tab.items ? (
          <div className={`grid items-start gap-4 ${tab.items.length > 1 ? "min-[1000px]:grid-cols-2" : ""}`}>
            {tab.items.map((item) => (
              <ItemBox item={item} key={item.id} />
            ))}
          </div>
        ) : (
          tab.content
        )}
      </section>
    </div>
  );
};

// ── A client's page ──────────────────────────────────────────────────────────

// Delete, then "Delete {name} and its portal login?" to confirm.
const DeleteClientButton = ({ clientId, name }: { clientId: string; name: string }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteClientAction(clientId);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete client.");
        return;
      }
      toast.success("Client deleted successfully");
      router.push("/clients");
    });
  };

  if (!confirming) {
    return (
      <button type="button" className={btnDangerOutline} onClick={() => setConfirming(true)}>
        <Trash2 size={13} strokeWidth={2} /> Delete
      </button>
    );
  }

  return (
    <span className={deleteConfirm}>
      <span>Delete {name} and its portal login?</span>
      <button type="button" className={btnDanger} disabled={isPending} aria-busy={isPending} onClick={handleDelete}>
        {isPending ? (
          <>
            <Loader2 size={13} strokeWidth={2.5} className="animate-spin" /> Deleting…
          </>
        ) : (
          "Yes, delete"
        )}
      </button>
      <button type="button" className={btnDraft} disabled={isPending} onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
};

// What each status means for the client, said under its name in the status menu. Pausing or
// closing a client also switches off its portal logins (the backend does that).
const STATUS_NOTES: Record<ClientStatus, { dot: string; note: string }> = {
  onboarding: { dot: "#7c3aed", note: "New — filling in onboarding, portal login on" },
  active: { dot: "#16a34a", note: "Working with us — portal login on" },
  pending: { dot: "#d97706", note: "Not started yet" },
  on_hold: { dot: "#3457c9", note: "Paused — portal login off" },
  closed: { dot: "#94a3b8", note: "No longer a client — portal login off" },
};

// The client's status as a pill that opens a menu: pick another status and it is saved there
// and then, without a trip to the edit page.
const StatusPicker = ({ clientId, name, status }: { clientId: string; name: string; status: ClientStatus }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // A click anywhere else, or Escape, closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: ClientStatus) => {
    setOpen(false);
    if (next === status) return;
    startTransition(async () => {
      const result = await updateClientAction(clientId, { status: next });
      if (!result.ok) {
        toast.error([result.error, ...(result.fieldErrors ?? [])].filter(Boolean).join(" — ") || "Couldn't change the status.");
        return;
      }
      toast.success(`${name} is now ${statusLabel(next)}`);
      router.refresh();
    });
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${statusLabel(status)}. Change status`}
        disabled={isPending}
        onClick={() => setOpen((shown) => !shown)}
        className={`${statusClassName(status)} cursor-pointer ring-1 ring-black/5 transition-shadow hover:shadow-[0_1px_4px_rgba(11,21,34,0.15)] disabled:cursor-wait`}
      >
        {isPending ? <Loader2 size={11} strokeWidth={2.5} className="animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_NOTES[status].dot }} />}
        {statusLabel(status)}
        <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div role="listbox" aria-label="Change status" className="absolute top-full left-0 z-30 mt-1.5 w-64 rounded-[10px] border border-[#dbe3de] bg-white p-1.5 shadow-[0_12px_32px_rgba(11,21,34,0.16)]">
          <div className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3] uppercase">Change status</div>
          {CLIENT_STATUS_OPTIONS.map((option) => {
            const current = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={current}
                onClick={() => choose(option.value)}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-[#f4f7f5] ${current ? "bg-[#f7f9f8]" : ""}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_NOTES[option.value].dot }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold text-[#17242f]">{option.label}</span>
                  <span className="block text-[11px] text-[#7a8e9b]">{STATUS_NOTES[option.value].note}</span>
                </span>
                {current ? <Check size={14} strokeWidth={2.5} className="shrink-0 text-[#2563eb]" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const TABS = ["Overview", "Reports", "Content", "Meetings", "Messages", "Payments"];

const LOGIN_STATUS_LABEL: Record<ClientLogin["status"], string> = {
  pending: "Pending",
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
};

const ClientDetails = ({
  client,
  canManage,
  canDelete,
}: {
  client: Client;
  canManage: boolean;
  canDelete: boolean;
}) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const login = client.user && typeof client.user === "object" ? client.user : undefined;
  const manager = staffName(client.accountManager);
  const team = client.team.map((member) => staffName(member)).filter(Boolean) as string[];

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/clients" className={breadcrumbLink}>
            Clients
          </Link>{" "}
          / <b>{client.companyName}</b>
        </div>
      </div>

      <div className="flex items-start justify-between rounded-[10px] border border-[#dbe3de] bg-white px-5.5 py-5">
        <div className="flex gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[14px] text-[18px] font-bold text-white"
            style={{ background: avatarColorFor(client._id) }}
          >
            {initialsOf(client.companyName)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="font-[Georgia,serif] text-[22px] font-bold text-[#0b1a26]">{client.companyName}</div>
              {/* Those who manage clients change the status right here; everyone else just sees it. */}
              {canManage ? (
                <StatusPicker clientId={client._id} name={client.companyName} status={client.status} />
              ) : (
                <span className={statusClassName(client.status)}>{statusLabel(client.status)}</span>
              )}
            </div>
            <div className="mt-0.5 text-[13px] text-[#657787]">
              {[client.contactName, client.serviceTypes.join(", ")].filter(Boolean).join(" · ")}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-[#556977]">
              {client.address ? (
                <span className={iconText}>
                  <MapPin size={12} strokeWidth={2} /> {client.address}
                </span>
              ) : null}
              <span className={iconText}>
                <Mail size={12} strokeWidth={2} /> {client.email}
              </span>
              {client.phone ? (
                <span className={iconText}>
                  <Phone size={12} strokeWidth={2} /> {client.phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            <button className={`${btnDraft} ${iconText}`} type="button">
              <MessageSquare size={13} strokeWidth={2} /> Message
            </button>
            {canManage ? (
              <Link href={`/clients/${client._id}/edit`} className={`${btnDraft} ${iconText}`}>
                <Pencil size={13} strokeWidth={2} /> Edit Client
              </Link>
            ) : null}
            {/* Both open with this client already picked. */}
            <Link href={`/content/add?client=${client._id}`} className={btnDark}>
              <Plus size={13} strokeWidth={2.5} /> Add New Content
            </Link>
            <Link href={`/monthly-reports/add?client=${client._id}`} className={btnDark}>
              <Plus size={13} strokeWidth={2.5} /> Add New Report
            </Link>
            {canDelete ? <DeleteClientButton clientId={client._id} name={client.companyName} /> : null}
          </div>
          <div className="flex gap-5 rounded-lg border border-[#eef3ef] bg-[#f7f9f8] px-4 py-2.5">
            <div>
              <div className={sinceLabel}>Client Since</div>
              <div className={sinceValue}>
                <Calendar size={12} strokeWidth={2} /> {formatDate(client.startDate)}
              </div>
            </div>
            <div>
              <div className={sinceLabel}>Account Manager</div>
              <div className={sinceValue}>
                {manager ? (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1522] text-[9px] font-bold text-white">
                      {initialsOf(manager)}
                    </span>{" "}
                    {manager}
                  </>
                ) : (
                  "Unassigned"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-5.5 border-b border-[#dbe3de] px-1">
        {TABS.map((tab) => (
          <span
            key={tab}
            className={`cursor-pointer pb-2.5 text-[13px] font-semibold ${
              tab === activeTab ? "border-b-2 border-[#2563eb] text-[#2563eb]" : "text-[#7a8e9b]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      {activeTab !== "Overview" ? (
        <div className={sectionCard}>
          <div className="px-5 py-12 text-center text-[13px] text-[#657787]">
            <b>{activeTab}</b> for this client will appear here once that module is connected.
          </div>
        </div>
      ) : (
        // Laid out as the add/edit form is: its five parts down the page, and beside them — staying
        // in view as the page scrolls — what the form doesn't hold.
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[1100px]:grid-cols-1">
          <div className="flex min-w-0 flex-col gap-5">
            <RecordSections client={client} editHref={canManage ? `/clients/${client._id}/edit` : undefined} manager={manager} team={team} />
          </div>

          <aside className="sticky top-5 flex flex-col gap-4 max-[1100px]:static">
            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Portal Login</span>
              </div>
              {/* Without a login the fields are still listed, as "None". */}
              <div className={infoTable}>
                <div>
                  <span>Sign-in email</span>
                  <Value>{login?.email}</Value>
                </div>
                <div>
                  <span>Login status</span>
                  <Value>{login ? LOGIN_STATUS_LABEL[login.status] : undefined}</Value>
                </div>
                <div>
                  <span>Last sign-in</span>
                  <Value>{login ? formatDateTime(login.lastLoginAt) : undefined}</Value>
                </div>
              </div>
              {login ? null : <div className={`${dashPendingSub} mt-3`}>This client has no portal login.</div>}
            </div>

            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Onboarding Form</span>
              </div>
              <div className={infoTable}>
                <div>
                  <span>Form status</span>
                  <Value>{client.onboarding?.status ? ONBOARDING_STATUS_LABELS[client.onboarding.status] : undefined}</Value>
                </div>
                <div>
                  <span>Submitted on</span>
                  <Value>{client.onboarding?.submittedAt ? formatDate(client.onboarding.submittedAt) : undefined}</Value>
                </div>
              </div>
              {client.onboarding?.status ? null : <div className={`${dashPendingSub} mt-3`}>This client didn&apos;t go through the onboarding form.</div>}
            </div>

            <div className={sectionCard}>
              <div className={sectionHeader}>
                <span className={sectionTitle}>Record</span>
              </div>
              <div className={infoTable}>
                <div>
                  <span>Added on</span>
                  <Value>{client.createdAt ? formatDate(client.createdAt) : undefined}</Value>
                </div>
                <div>
                  <span>Last updated</span>
                  <Value>{client.updatedAt ? formatDate(client.updatedAt) : undefined}</Value>
                </div>
                {/* Only a client who made their own account agreed to them there. */}
                {client.termsAcceptedAt ? (
                  <div>
                    <span>Terms agreed</span>
                    <Value>{formatDate(client.termsAcceptedAt)}</Value>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

// ── An onboarding request's page ─────────────────────────────────────────────

// The "About them" tab: who they are, then everything they said about their business and their
// goals — on the onboarding form's first step, and in the steps right after signing up — and
// whether they booked the kickoff call. A field they left empty shows as "None".
const AboutThem = ({ request }: { request: OnboardingRequest }) => {
  const { business, goals, kickoffCall } = request.onboarding;
  const metaAds = request.onboarding.social?.metaAds;
  const or =(value: string | undefined) => (value?.trim() ? value : NONE);
  const head = "mt-5 mb-2.5 border-t border-[#eef3ef] pt-4 text-[12px] font-bold tracking-[0.04em] text-[#17242f] uppercase";
  return (
    <>
      <Fields
        rows={[
          ["Name", or(request.contactName)],
          ["Company", or(request.companyName)],
          ["Email", or(request.email)],
          ["Phone", or(request.phone)],
        ]}
      />
      <div className={head}>Their business</div>
      <Fields
        rows={[
          ["About the business", or(business?.description)],
          ["Services they offer", or(business?.services?.join(", "))],
          ["Areas they serve", or(business?.areas?.join(", "))],
          ["Main contact", or([business?.contact?.name, business?.contact?.email, business?.contact?.phone].filter(Boolean).join(" · "))],
          ["Best way to reach them", or(REACH_BY[business?.contact?.reachBy ?? ""])],
        ]}
      />
      <div className={head}>Goals</div>
      <Fields
        rows={[
          ["Revenue per month", or(targetOf(goals?.revenue, money))],
          ["Leads per month", or(targetOf(goals?.leads, String))],
          ["New clients per month", or(targetOf(goals?.newClients, String))],
          ["How soon", or(GOAL_TIMEFRAMES[goals?.timeframe ?? ""])],
          ["Monthly marketing budget", or(GOAL_BUDGETS[goals?.budget ?? ""])],
          ["Cost of one lead today", goals?.costPerLead === undefined ? NONE : money(goals.costPerLead)],
          ["Worth of one new client", goals?.clientValue === undefined ? NONE : money(goals.clientValue)],
          ["Where leads come from", or(goals?.leadSources?.map((source) => LEAD_SOURCES[source] ?? source).join(", "))],
        ]}
      />
      <div className={head}>Also asked at sign-up</div>
      <Fields
        rows={[
          ["Kickoff call booked", kickoffCall ? (kickoffCall.booked ? "Yes (the client says so)" : "Not yet") : NONE],
          [
            "Meta Ads account",
            metaAds?.has
              ? [metaAds.has === "yes" ? "Has one" : metaAds.wantsCreated ? "Wants us to create it" : metaAds.has === "unsure" ? "Not sure" : "Doesn't have one", metaAds.link]
                  .filter(Boolean)
                  .join(" — ")
              : NONE,
          ],
        ]}
      />
    </>
  );
};

// An onboarding request in full: who sent it, how much they answered, and then a tab for
// each step of the form — where each thing stands for the team, and every field with what the
// client put in it. A field they left empty still shows, as "None".
// `canOpenClient` is for those who can open the client record it made (admins: the client has
// no account manager or team yet, so nobody else can see it there).
export const OnboardingRequestDetails = ({ request, canOpenClient }: { request: OnboardingRequest; canOpenClient: boolean }) => {
  const { onboarding } = request;
  const groups = groupsOf(request);
  const counts = countsOf(groups);
  const takenOn = request.status !== "pending";

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/clients" className={breadcrumbLink}>
            Clients
          </Link>{" "}
          / Onboarding request / <b>{request.companyName}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[10px] border border-[#dbe3de] bg-white px-5.5 py-5">
        <div className="flex min-w-0 gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px] text-[18px] font-bold text-white"
            style={{ background: avatarColorFor(request._id) }}
          >
            {initialsOf(request.companyName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="font-[Georgia,serif] text-[22px] font-bold text-[#0b1a26]">{request.companyName}</div>
              <span className={`${pill} ${ONBOARDING_STATUS_COLORS[onboarding.status]}`}>{ONBOARDING_STATUS_LABELS[onboarding.status]}</span>
            </div>
            <div className="mt-0.5 text-[13px] text-[#657787]">{request.contactName}</div>
            <div className="mt-2.5 flex flex-wrap gap-4 text-[12px] text-[#556977]">
              <a href={`mailto:${request.email}`} className={`${iconText} text-inherit hover:text-[#2563eb]`}>
                <Mail size={13} strokeWidth={2} /> {request.email}
              </a>
              {request.phone ? (
                <span className={iconText}>
                  <Phone size={13} strokeWidth={2} /> {request.phone}
                </span>
              ) : null}
              <span className={iconText}>
                <Calendar size={13} strokeWidth={2} />
                {onboarding.status === "submitted" ? `Submitted ${formatDate(onboarding.submittedAt)}` : `Started ${formatDate(request.createdAt)} · last saved ${formatDate(request.updatedAt)}`}
              </span>
            </div>
          </div>
        </div>

        {canOpenClient ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/clients/${request._id}`} className={`${btnDraft} ${iconText}`}>
              Open client record <ArrowUpRight size={13} strokeWidth={2} />
            </Link>
            <Link href={`/clients/${request._id}/edit`} className={`${btnDraft} ${iconText}`}>
              <Pencil size={13} strokeWidth={2} /> Edit client
            </Link>
          </div>
        ) : null}
      </div>

      {takenOn ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#cfe9d6] bg-[#f0faf3] px-4 py-2.75 text-[12.5px] text-[#14532d]">
          This client has already been taken on <span className={statusClassName(request.status)}>{statusLabel(request.status)}</span> — their answers stay here to work from.
        </div>
      ) : onboarding.status === "in_progress" ? (
        <div className="rounded-lg border border-[#f1dfbf] bg-[#fdf6ea] px-4 py-2.75 text-[12.5px] text-[#7a4b0f]">
          They haven&apos;t handed this in yet — what you see is what they have saved so far, and it can still change.
        </div>
      ) : null}

      {/* The request at a glance: how much was answered, and what kind of work it adds up to. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] border border-[#dbe3de] bg-white px-5 py-3.5">
        <span className="text-[12.5px] text-[#657787]">
          <b className="text-[15px] font-bold text-[#0d1e2c]">{counts.answered}</b> of {counts.total} answered
        </span>
        {TONE_ORDER.map((tone) => (
          <span key={tone} className="inline-flex items-center gap-2 text-[12.5px] text-[#556977]">
            <span className="h-2 w-2 rounded-full" style={{ background: TONES[tone].dot }} />
            <b className="font-bold text-[#17242f]">{counts.byTone[tone]}</b> {TONES[tone].label.toLowerCase()}
          </span>
        ))}
      </div>

      <OnboardingAnswerTabs
        onboarding={onboarding}
        first={{
          title: "About them",
          content: <AboutThem request={request} />,
        }}
      />
    </>
  );
};

export default ClientDetails;
