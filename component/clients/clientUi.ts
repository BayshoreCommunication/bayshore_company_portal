import type { Client, ClientSocial, ClientStatus } from "@/app/actions/clients";
import type {
  OnboardingAccount,
  OnboardingAnswers,
  OnboardingFile,
  OnboardingGoogleAccount,
  OnboardingMedia,
  OnboardingMediaKind,
  OnboardingRequest,
  OnboardingSocialAccount,
  OnboardingStatus,
} from "@/app/actions/onboarding";

// Everything the client screens share that isn't a component: statuses, dates and who may do
// what; the lists behind the add/edit form; and how an onboarding's answers are read.

// ── Statuses, names, dates and permissions ───────────────────────────────────

// "Onboarding" comes first: it is where a new client who signed up themselves starts.
export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "on_hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
];

export const SERVICE_TYPES = ["SEO", "Social Media", "Google Ads", "Website", "Content", "Marketing"];

export const NOTES_LIMIT = 500;
export const CLIENTS_PER_PAGE = 9;

export const isClientStatus = (value: unknown): value is ClientStatus =>
  CLIENT_STATUS_OPTIONS.some((option) => option.value === value);

export const statusLabel = (status: ClientStatus) =>
  CLIENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

const STATUS_PILL = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1 text-[11px] font-bold";

const STATUS_COLORS: Partial<Record<ClientStatus, string>> = {
  onboarding: "bg-[#f1ebfe] text-[#6d28d9]",
  active: "bg-[#e5f6ea] text-[#15803d]",
  pending: "bg-[#fdf1de] text-[#a35a12]",
  on_hold: "bg-[#e8eefc] text-[#3457c9]",
  closed: "bg-[#f1f5f3] text-[#64748b]",
};

export const statusClassName = (status: ClientStatus) => `${STATUS_PILL} ${STATUS_COLORS[status] ?? ""}`;

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_COLORS = ["#2563eb", "#374151", "#b8365f", "#c8973a", "#2f8f6f", "#16a34a", "#3457c9", "#8b5cf6", "#dc2626"];

// Same client, same colour every time.
export const avatarColorFor = (seed: string) => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// Start dates are stored as UTC midnight, so format in UTC to avoid showing the day before.
export const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "—";

// Today's date in the visitor's own timezone, as an <input type="date"> value (yyyy-mm-dd).
export const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "Never";

// The answers both forms ask for — the team's add/edit form and the client's onboarding form —
// as they stand: with the onboarding answers, where they are kept, or, for a client last saved
// before they were moved there, where the add/edit form used to keep them.
export const sharedOf = (client?: Pick<Client, "details" | "onboarding">) => {
  const answered = client?.onboarding;
  const old = client?.details?.business;
  const socials: ClientSocial[] = ["facebook", "instagram", "linkedin", "tiktok", "youtube", "x"];
  return {
    website: answered?.website?.url || old?.website || "",
    hasNoWebsite: answered?.website?.hasNone === true,
    googleBusinessProfile: answered?.google?.businessProfile?.link || old?.googleBusinessProfile || "",
    // The websites, each with what the client said they like about it.
    competitors: (answered?.website?.competitors ?? []).filter((row) => row.url || row.note),
    // The same as the old form kept them: one line of text.
    competitorsBefore: old?.competitors ?? "",
    social: Object.fromEntries(socials.map((key) => [key, answered?.social?.[key]?.link || old?.social?.[key] || ""])) as Record<ClientSocial, string>,
    hasLogo: answered?.logo?.has ? answered.logo.has === "yes" : old?.hasLogo,
    logoStyle: answered?.logo?.style || old?.logoDesign?.style || "",
  };
};

// The portal pages a client is shown, where the team has chosen them — and, where they
// haven't, for a client who signed up themselves: only the first ones, the onboarding form and
// the services (backend: models/client.model.ts → portalMenusOf). Undefined is every page.
export const FIRST_PORTAL_MENUS = ["onboarding", "services"];
export const portalMenusOf = (client: Pick<Client, "portalMenus" | "createdBy">) => client.portalMenus ?? (client.createdBy ? undefined : FIRST_PORTAL_MENUS);

// Populated references come back as objects, unpopulated ones as plain ids.
export const staffName = (staff: Client["accountManager"]) =>
  staff && typeof staff === "object" ? staff.fullName : undefined;

export const clientsHref = ({ status, q, page }: { status?: string; q?: string; page?: number }) => {
  const params = new URLSearchParams();
  // "all" is said too: without a tab named, the page picks one itself (onboarding, if anyone is).
  if (status) params.set("status", status);
  if (q?.trim()) params.set("q", q.trim());
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/clients?${query}` : "/clients";
};

// These only decide what the UI shows — the backend enforces the real permissions.
export const canManageClients = (role?: string) =>
  ["assistant_manager", "manager", "admin", "superadmin"].includes(role ?? "");

export const canDeleteClients = (role?: string) => ["admin", "superadmin"].includes(role ?? "");

// ── The add/edit form's lists ────────────────────────────────────────────────

// What the client form offers: the lists behind its dropdowns, chips and checklists, and the
// services a client can be signed up for with their default quantities and prices.

export const COMMUNICATION_METHODS = ["Email", "Phone call", "Text message", "WhatsApp", "Video call (Zoom / Meet)"];
export const BEST_TIMES = ["Any time", "Morning (9am–12pm)", "Afternoon (12–5pm)", "Evening (after 5pm)"];
export const TIME_ZONES = ["Eastern (ET)", "Central (CT)", "Mountain (MT)", "Pacific (PT)", "Other"];

// "Other" opens a box to type it in.
export const OTHER = "Other";
export const INDUSTRIES = ["Legal", "Healthcare / Dental", "Home services", "Real estate", "Restaurant / Hospitality", "Retail / E-commerce", "Professional services", OTHER];
export const BUSINESS_TYPES = ["Sole proprietor", "LLC", "Corporation", "Partnership", "Nonprofit", OTHER];

export const SOCIAL_PROFILES = [
  ["facebook", "Facebook URL"],
  ["instagram", "Instagram URL"],
  ["linkedin", "LinkedIn URL"],
  ["tiktok", "TikTok URL"],
  ["youtube", "YouTube URL"],
  ["x", "X (Twitter) URL"],
] as const;

// ── Services and pricing ─────────────────────────────────────────────────────

export type ServiceField = { label: string; value: number; money?: boolean };

export type Service = {
  name: string;
  note?: string;
  fields: ServiceField[];
  // The monthly amount, from the fields' values in order.
  amount: (values: number[]) => number;
  includes: string[];
  // Rates to quote if the client asks for more later. Not billed now.
  addons: [label: string, price: number][];
};

export const SERVICES: Service[] = [
  {
    name: "Website maintenance",
    fields: [
      { label: "Number of websites", value: 1 },
      { label: "Price per website / month", value: 150, money: true },
    ],
    amount: (v) => v[0] * v[1],
    includes: ["Plugin and core updates", "Security monitoring", "Weekly backups", "Uptime monitoring", "Small content edits (up to 1 hr)", "Monthly maintenance report"],
    addons: [
      ["Additional website / month", 150],
      ["Extra edits, per hour", 75],
    ],
  },
  {
    name: "Google Business Profile management",
    fields: [
      { label: "Number of profiles", value: 1 },
      { label: "Price per profile / month", value: 200, money: true },
    ],
    amount: (v) => v[0] * v[1],
    includes: ["Monthly profile audit", "Weekly posts", "Review responses", "Q&A management", "Photo updates", "Monthly insights report"],
    addons: [["Additional location / month", 150]],
  },
  {
    name: "SEO",
    note: "The client can use their pages for blog posts or service pages in any mix each month.",
    fields: [
      { label: "Monthly price", value: 900, money: true },
      { label: "Total pages / month", value: 6 },
      { label: "Total words / month", value: 6000 },
    ],
    amount: (v) => v[0],
    includes: ["Keyword research", "On-page optimization", "Blog posts and service pages (any mix)", "Internal linking", "Technical SEO check", "Monthly ranking report"],
    addons: [
      ["Additional words, per word", 0.1],
      ["Additional blog post", 120],
      ["Additional service page", 150],
    ],
  },
  {
    name: "Social media management",
    note: "One flat fee. The quantities below are what the fee covers.",
    fields: [
      { label: "Flat fee / month", value: 600, money: true },
      { label: "Posts / month", value: 12 },
      { label: "Reels / month", value: 4 },
      { label: "Platforms", value: 3 },
    ],
    amount: (v) => v[0],
    includes: ["Content calendar", "Graphic design", "Captions and hashtags", "Scheduling and posting", "Comment and DM replies", "Monthly performance report"],
    addons: [
      ["Extra post", 40],
      ["Extra reel", 75],
      ["Extra platform / month", 150],
      ["Story pack (5 stories)", 50],
    ],
  },
  {
    name: "Video production",
    fields: [
      { label: "Hours / month", value: 4 },
      { label: "Monthly price", value: 400, money: true },
    ],
    amount: (v) => v[1],
    includes: ["Filming (on site or remote)", "Editing and color correction", "Captions / subtitles", "Short-form cuts for social", "Royalty-free music"],
    addons: [
      ["Additional hour", 100],
      ["Drone footage", 250],
    ],
  },
  {
    name: "Dedicated account manager",
    fields: [{ label: "Price / month", value: 300, money: true }],
    amount: (v) => v[0],
    includes: ["Single point of contact", "Monthly strategy call", "Priority support", "Quarterly business review"],
    addons: [],
  },
];

export const money = (amount: number) => `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Onboarding and transfer ──────────────────────────────────────────────────

export const CLIENT_HAS = [
  ["website", "Website"],
  ["domain", "Domain name"],
  ["hosting", "Hosting account"],
  ["logo", "Logo / brand guide"],
  ["gbp", "Google Business Profile"],
  ["social", "Social media accounts"],
  ["analytics", "Google Analytics / Search Console"],
  ["ads", "Ad accounts (Google / Meta)"],
  ["media", "Photos and videos"],
] as const;

// The one need that follows from the logo question in the business details.
export const NEEDS_LOGO = "Logo design";
export const CLIENT_NEEDS = [
  "New website",
  "Website redesign",
  NEEDS_LOGO,
  "Brand guide (colors and fonts)",
  "Google Business Profile setup",
  "Social media account setup",
  "Analytics and tracking setup",
  "Professional photos / video shoot",
  "Website copy / content writing",
];

export const WEBSITE_TRANSFER = [
  "Domain registrar access",
  "Hosting or server access",
  "CMS admin login (e.g. WordPress)",
  "Full site backup taken",
  "DNS records documented",
  "Google Analytics and Search Console access",
  "SSL certificate confirmed",
];

export const SOCIAL_TRANSFER = [
  "Admin access granted on each platform",
  "Meta Business Manager access",
  "Login details for any personal-only accounts are stored securely",
  "Brand assets and past content collected",
  "Ad accounts and billing reviewed",
  "Posting schedule and content history reviewed",
];

// ── Account setup ────────────────────────────────────────────────────────────

// Contract lengths in months; the empty one is "Custom" (the end date is typed in).
export const CONTRACT_TERMS = [
  ["1", "1 month"],
  ["3", "3 months"],
  ["6", "6 months"],
  ["12", "12 months"],
  ["24", "24 months"],
  ["", "Custom"],
] as const;

export const RENEWAL_TYPES = ["Auto-renew monthly", "Auto-renew for the same term", "Manual renewal (needs approval)", "No renewal (fixed term)"];
export const CANCELLATION_NOTICES = ["None", "30 days", "60 days", "90 days"];
export const RENEWAL_REMINDERS = ["Don't remind", "15 days before end date", "30 days before end date", "60 days before end date"];
export const PAYMENT_METHODS = ["Credit / debit card", "Bank transfer (ACH)", "Check", "Invoice (net 15)", "Invoice (net 30)"];
export const BILLING_CYCLES = ["Monthly", "Quarterly", "Annually"];
export const BILLING_DAYS = ["1st of the month", "15th of the month", "Same day as contract start"];
export const SETUP_FEES = ["No setup fee", "Paid", "Not paid yet"];

// Only on offer once the client has a portal login.
export const DELIVERY_PORTAL = "Client portal";
export const REPORT_DELIVERIES = ["Email a PDF each month", "Account manager shares on a call", DELIVERY_PORTAL];

// The last day of a contract: the day before the same date `months` later, so 12 months from
// 11 October ends on 10 October. Dates are yyyy-mm-dd, as a date input holds them.
export const contractEnd = (start: string, months: number) => {
  const [year, month, day] = start.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(Date.UTC(year, month - 1 + months, day - 1)).toISOString().slice(0, 10);
};

// The pages of the client portal a client can be shown or not, by the key the backend knows
// them by (models/client.model.ts → CLIENT_PORTAL_MENUS) and as the portal's menu names them.
// Settings is always there, so it isn't offered.
export const PORTAL_MENUS = [
  ["dashboard", "Dashboard"],
  ["onboarding", "Onboarding"],
  ["reports", "Reports"],
  ["content", "Content"],
  ["leads", "Leads"],
  ["projects", "Projects"],
  ["services", "Services"],
  ["calendar", "Calendar"],
  ["messages", "Messages"],
  ["payments", "Payments"],
  ["notifications", "Notifications"],
] as const;

export const PERKS = [
  "Set up a client without them creating an account",
  "Record what the client has and needs",
  "Set services, included items and future rates",
  "Track the contract, renewal and payment status",
  "Assign an account manager",
  "Send reports by email or through the portal",
  "Turn on portal access any time later",
];

// ── Reading an onboarding ────────────────────────────────────────────────────

// Reading an onboarding request the way the team needs it: for each thing the client was
// asked about, where it stands — is it ours to create, are we waiting on them, does someone
// need to follow up — and every field of the form with what they put in it, filled in or not.

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = { submitted: "Submitted", in_progress: "Still filling in" };
export const ONBOARDING_STATUS_COLORS: Record<OnboardingStatus, string> = {
  submitted: "bg-[#e5f6ea] text-[#15803d]",
  in_progress: "bg-[#fdf1de] text-[#a35a12]",
};

// What an item needs next, from the team's side.
export type Tone = "create" | "followup" | "waiting" | "ready" | "none";

export const TONES: Record<Tone, { label: string; className: string; dot: string }> = {
  create: { label: "For us to create", className: "bg-[#dbeafe] text-[#1d4ed8]", dot: "#2563eb" },
  followup: { label: "Follow up", className: "bg-[#ede9fe] text-[#6d28d9]", dot: "#7c3aed" },
  waiting: { label: "Waiting on client", className: "bg-[#fdf1de] text-[#a35a12]", dot: "#d97706" },
  ready: { label: "Ready", className: "bg-[#e5f6ea] text-[#15803d]", dot: "#16a34a" },
  none: { label: "Nothing to do", className: "bg-[#f1f5f3] text-[#64748b]", dot: "#94a3b8" },
};
// The order the summary counts them in: what needs the team first.
export const TONE_ORDER: Tone[] = ["create", "followup", "waiting", "ready"];

// One thing the client was asked about: where it stands, and every field the form has for it
// with what they put there — `NONE` where they put nothing.
export type Item = { id: string; name: string; label: string; tone: Tone; details: [label: string, value: string][] };

// What a field shows when the client left it empty.
export const NONE = "None";
// `id` is the step's name on the client's own form (client-portal: onboardingData.ts → STEPS).
export type Group = { id: string; title: string; items: Item[] };

type Standing = [label: string, tone: Tone];
const NOT_ANSWERED: Standing = ["Not answered", "none"];
const NOT_NEEDED: Standing = ["Not needed", "none"];
const NOT_SURE = "Not sure";

// The website builder a developer holds the keys to, as the client's form names it.
const BUILT_BY_DEVELOPER = "Custom / built by a developer";

// Site builders that host the site themselves: with one of these there is no hosting to get into.
const BUILDERS = ["Wix", "Squarespace", "Shopify"];

// How each kind of answer is written out. Every field is listed whether or not it was filled in.
const written = (value: string | number | undefined | null) => (value === undefined || value === null || String(value).trim() === "" ? NONE : String(value));
// "Do you have one?"
const having = (value?: "yes" | "no" | "unsure") => (value === "yes" ? "Yes" : value === "no" ? "No" : value === "unsure" ? "Not sure" : NONE);
// A question answered yes or no — or not at all.
const yesNo = (value?: boolean) => (value === undefined ? NONE : value ? "Yes" : "No");
const listed = (values?: string[]) => (values?.length ? values.join(", ") : NONE);

// Where access to a platform stands, in one field: given, stuck, or still to do. "Needs help"
// only shows when they asked for it — not beside an access already given.
const accessFields = (entry: { accessGiven?: boolean; needsHelp?: boolean }): Item["details"] =>
  entry.accessGiven ? [["Access given", "Yes"]] : entry.needsHelp ? [["Needs help with access", "Yes — help them give it"]] : [["Access given", NONE]];

// Access to a platform (the domain, hosting, the website's login): how they give it, and then
// either the login they shared or where the invite stands.
type PlatformLogin = { access?: "invite" | "secure"; loginUsername?: string; loginPassword?: string; loginPasswordSet?: boolean; accessGiven?: boolean; needsHelp?: boolean };
const loginShared = (entry: PlatformLogin) => Boolean(entry.loginUsername && (entry.loginPassword || entry.loginPasswordSet));
const platformAccessFields = (entry: PlatformLogin): Item["details"] =>
  entry.access === "secure"
    ? [
        ["How they give access", "Sharing the login"],
        ["Login username", written(entry.loginUsername)],
        // The password itself is sealed and isn't shown; this says whether one was given.
        ["Login password", entry.loginPassword || entry.loginPasswordSet ? "Saved (encrypted)" : NONE],
      ]
    : [["How they give access", "Inviting our access email"], ...accessFields(entry)];
const platformAccessStanding = (entry: PlatformLogin): Standing =>
  entry.access === "secure" ? (loginShared(entry) ? ["Login shared", "ready"] : ["Waiting for the login", "waiting"]) : inviting(entry);

// Access being given by invite: given, stuck, or still to do.
const inviting = (entry: { accessGiven?: boolean; needsHelp?: boolean }): Standing =>
  entry.accessGiven ? ["Access given", "ready"] : entry.needsHelp ? ["Needs help giving access", "followup"] : ["Waiting on access", "waiting"];

// "They don't have one — shall we make it?"
const wanted = (wantsCreated: boolean | undefined, creating: string): Standing => (wantsCreated === true ? [creating, "create"] : wantsCreated === false ? NOT_NEEDED : NOT_ANSWERED);

const platformStanding = (entry: NonNullable<OnboardingAnswers["domain"]>, creating: string, hosted = false): Standing => {
  if (entry.has === "yes") {
    if (!entry.platform) return ["Platform not chosen", "waiting"];
    if (entry.platform === NOT_SURE) return ["Help them find it", "followup"];
    if (hosted && BUILDERS.includes(entry.platform)) return ["Included with their site builder", "ready"];
    return platformAccessStanding(entry);
  }
  if (entry.has === "no") return wanted(entry.wantsCreated, creating);
  if (entry.has === "unsure") return ["Find out for them", "followup"];
  return NOT_ANSWERED;
};

// The accounts we sign in to with their own login, typed on the client's form (the business
// email; the others only on older answers).
const LOGIN_ACCOUNTS = ["instagram", "youtube", "linkedin", "tiktok", "x", "email"];

// How a social account's access is given on the platform itself — the client's form (Step 7)
// walks them through it; no password. Google accounts are shared with our access email instead.
const SOCIAL_GRANTS: Record<string, string> = {
  facebook: "Partner access in Meta Business Suite (our Business ID)",
  instagram: "Meta Business Suite → Instagram Accounts (our Business ID)",
  youtube: "YouTube Studio invite to our Google account (Editor)",
  linkedin: "LinkedIn Page admin — our profile as Content Admin",
  tiktok: "TikTok Business Center partner access (our Business Center ID)",
};

// Where access stands, in the words the client sees: Pending (still to give), Invited (given —
// ours to accept and check), Connected (a login shared). Verified is the team's tick on the item.
const granted = (account: OnboardingAccount): Standing =>
  account.accessGiven ? ["Invited — accept and verify", "ready"] : account.needsHelp ? ["Needs help giving access", "followup"] : ["Pending — waiting on access", "waiting"];

const accountItem = (id: string, name: string, account: OnboardingAccount = {}): Item => {
  const grant = SOCIAL_GRANTS[id];
  const onPlatform = Boolean(grant) && account.access !== "secure";
  const standing: Standing =
    account.has === "yes"
      ? onPlatform
        ? granted(account)
        : account.access === "invite"
          ? inviting(account)
          : account.access === "secure"
            ? account.loginUsername && (account.loginPassword || account.loginPasswordSet)
              ? ["Connected — login shared", "ready"]
              : LOGIN_ACCOUNTS.includes(id)
                ? ["Pending — waiting for the login", "waiting"]
                : ["Send a secure link for the login", "followup"]
            : ["Access not chosen yet", "waiting"]
      : account.has === "no"
        ? wanted(account.wantsCreated, "Create the account")
        : account.has === "unsure"
          ? ["Check whether one exists", "followup"]
          : NOT_ANSWERED;
  return {
    id,
    name,
    label: standing[0],
    tone: standing[1],
    // Only what goes with their answer: how we get in, for an account they have; whether to make
    // one, for an account they don't (or aren't sure of).
    details: [
      ["Has an account", having(account.has)],
      ...(account.has === "yes"
        ? ([
            ["Link or name", written(account.link)],
            ["How they give access", onPlatform ? grant : account.access === "invite" ? "Inviting our access email" : account.access === "secure" ? "Sharing the login" : NONE],
            // A login is only theirs to give when that is how they give access.
            ...(account.access === "secure"
              ? ([
                  ["Login username", written(account.loginUsername)],
                  // The password itself is sealed and isn't shown; this says whether one was given.
                  ["Login password", account.loginPassword || account.loginPasswordSet ? "Saved (encrypted)" : NONE],
                ] as Item["details"])
              : accessFields(account)),
          ] as Item["details"])
        : account.has === "no" || account.has === "unsure"
          ? ([["Wants us to create it", yesNo(account.wantsCreated)]] as Item["details"])
          : []),
    ],
  };
};

const mediaItem = (id: string, name: string, media: OnboardingMedia = {}): Item => {
  const standing: Standing =
    media.mode === "upload" || media.files?.length
      ? media.files?.length
        ? ["Files uploaded", "ready"]
        : media.link
          ? ["Link shared", "ready"]
          : ["Waiting for files or a link", "waiting"]
      : media.mode === "create"
        ? ["Plan the shoot with them", "followup"]
        : media.mode === "none"
          ? NOT_NEEDED
          : NOT_ANSWERED;
  return {
    id,
    name,
    label: standing[0],
    tone: standing[1],
    details: [
      ["What they chose", media.mode === "upload" ? "Share what they have" : media.mode === "create" ? "They need these created" : media.mode === "none" ? "They don't need these" : NONE],
      ...(media.mode === "upload" || media.files?.length || media.link
        ? ([
            ["Uploaded", media.files?.length ? `${media.files.length} file${media.files.length === 1 ? "" : "s"}` : NONE],
            ["Shared folder", written(media.link)],
          ] as Item["details"])
        : []),
      ...(media.mode === "create" ? ([["What they need", written(media.notes)]] as Item["details"]) : []),
    ],
  };
};

const GOOGLE_NAMES: Record<OnboardingGoogleAccount, string> = {
  businessProfile: "Google Business Profile",
  analytics: "Google Analytics",
  searchConsole: "Google Search Console",
  tagManager: "Google Tag Manager",
  ads: "Google Ads",
};
// X (Twitter) is no longer on the client's form, so it isn't one of its items.
const SOCIAL_NAMES: Record<Exclude<OnboardingSocialAccount, "x">, string> = {
  facebook: "Facebook Page",
  instagram: "Instagram Business Account",
  youtube: "YouTube Channel",
  linkedin: "LinkedIn Company Page",
  tiktok: "TikTok Account",
  email: "Business Email",
};
const MEDIA_NAMES: Record<OnboardingMediaKind, string> = {
  professionalPhotos: "Professional photos",
  businessPhotos: "Business photos",
  videos: "Professional videos",
};

const namesOf = <Key extends string>(names: Record<Key, string>) => Object.entries(names) as [Key, string][];

// Everything on the request, grouped as the form asks it.
export const groupsOf = ({ onboarding }: Pick<OnboardingRequest, "onboarding">): Group[] => {
  const { website = {}, domain = {}, hosting = {}, cms = {}, email = {}, logo = {} } = onboarding;
  const item = (id: string, name: string, [label, tone]: Standing, details: Item["details"]): Item => ({ id, name, label, tone, details });

  const websiteStanding: Standing =
    website.need === "new" ? ["Build a new website", "create"] : website.need === "redesign" ? ["Redesign their website", "create"] : website.need === "no" ? ["Keeping their current site", "ready"] : NOT_ANSWERED;

  // Hosting on a site builder is its own CMS; with a hosting account of their own and a CMS, they
  // chose what to let us into (cms.giving). A CMS named before that was asked means there is one.
  const onBuilder = hosting.has === "yes" && Boolean(hosting.platform) && BUILDERS.includes(hosting.platform ?? "");
  const hasCms = onBuilder ? "yes" : (cms.has ?? (cms.platform ? "yes" : undefined));
  const giving = onBuilder || hosting.has !== "yes" ? "cms" : cms.giving;
  // A CMS whose dashboard is all they give: the hosting needs nothing more from them.
  const dashboardOnly = hasCms === "yes" && giving === "cms" && hosting.has === "yes" && !onBuilder && !website.hasNone;
  const cmsStanding: Standing = hasCms === "no"
    ? ["No CMS — hosting is enough", "ready"]
    : hasCms === "unsure"
      ? ["Find out whether there is one", "followup"]
      : giving === "hosting"
        ? ["Through their hosting", "ready"]
        : !cms.platform
    ? NOT_ANSWERED
    : cms.platform === NOT_SURE
      ? ["Help them find it", "followup"]
      : cms.developer || cms.platform === BUILT_BY_DEVELOPER
        ? ["Contact their developer for access", "followup"]
        : platformAccessStanding(cms);

  const emailStanding: Standing = email.has === "yes" ? ["Has one", "ready"] : email.has === "no" ? wanted(email.wantsCreated, "Set up Google Workspace") : NOT_ANSWERED;

  const logoStanding: Standing =
    logo.has === "yes"
      ? logo.files?.length
        ? ["Logo uploaded", "ready"]
        : logo.link
          ? ["Link shared", "ready"]
          : ["Waiting for the logo files", "waiting"]
      : logo.has === "no"
        ? wanted(logo.wantsCreated, "Design a logo")
        : NOT_ANSWERED;

  const examples = (website.competitors ?? []).map((row) => [row.url, row.note].filter(Boolean).join(" — ")).filter(Boolean);

  // One group for each step of the form, under the step's own name.
  return [
    {
      id: "web",
      title: "Website",
      items: [
        item("website", "Website", websiteStanding, [
          ["Current website", website.hasNone ? "No website yet" : written(website.url)],
          ["Needs a new website", website.need === "new" ? "Yes, build a new one" : website.need === "redesign" ? "Redesign the current site" : website.need === "no" ? "No, not right now" : NONE],
          // What they want of it: only when we are to build or redesign it.
          ...(website.need === "no"
            ? []
            : ([
                ["How they want it", written(website.description)],
                ["Example websites", examples.length ? examples.join("\n") : NONE],
                ["Pages", listed(website.pages)],
                ["Features", listed(website.features)],
              ] as Item["details"])),
        ]),
      ],
    },
    {
      id: "domain",
      title: "Domain and hosting",
      items: [
        item("domain", "Domain name", platformStanding(domain, "Register a domain"), [
          ["Has a domain", having(domain.has)],
          ...(domain.has === "yes"
            ? ([["Domain", written(domain.name)], ["Registered at", written(domain.platform)], ...platformAccessFields(domain)] as Item["details"])
            : domain.has === "no"
              ? ([
                  ["Wants us to register one", yesNo(domain.wantsCreated)],
                  ...(domain.wantsCreated === false ? [] : ([["Names they'd like", written(domain.wishlist)]] as Item["details"])),
                ] as Item["details"])
              : []),
        ]),
        item("hosting", "Hosting", dashboardOnly ? ["Dashboard access instead", "ready"] : platformStanding(hosting, "Set up hosting", true), [
          ["Has hosting", having(hosting.has)],
          ...(hosting.has === "yes"
            ? ([
                ["Hosted at", written(hosting.platform)],
                // A site builder hosts the site itself: there is no hosting account to get into. And
                // with only the website's dashboard given, the hosting isn't ours to get into either.
                ...(hosting.platform && BUILDERS.includes(hosting.platform)
                  ? []
                  : dashboardOnly
                    ? ([["Hosting access", "Not needed — they gave the website dashboard"]] as Item["details"])
                    : platformAccessFields(hosting)),
              ] as Item["details"])
            : hosting.has === "no"
              ? ([["Wants us to set it up", yesNo(hosting.wantsCreated)]] as Item["details"])
              : []),
        ]),
        // Without a website there is no login to it: the client's form doesn't ask either.
        ...(website.hasNone ? [] : [
              item("cms", "Website login (CMS)", cmsStanding, [
                ["Built on a CMS", onBuilder ? `Yes — ${hosting.platform}` : having(hasCms)],
                ...(hasCms === "yes" && !onBuilder && hosting.has === "yes"
                  ? ([["Access they give", giving === "cms" ? "Website dashboard" : giving === "hosting" ? "Hosting account" : giving === "both" ? "Both" : NONE]] as Item["details"])
                  : []),
                // Which CMS, and our way into its dashboard: only when that is what they give us.
                ...(hasCms === "yes" && giving !== "hosting"
                  ? ([
                      ["Built with", written(cms.platform)],
                      ...(cms.developer || cms.platform === BUILT_BY_DEVELOPER ? ([["Developer", written(cms.developer)]] as Item["details"]) : platformAccessFields(cms)),
                    ] as Item["details"])
                  : []),
              ]),
            ]),
      ],
    },
    {
      id: "email",
      title: "Business email",
      items: [
        item("email", "Business email", emailStanding, [
          ["Has a business email", having(email.has)],
          ...(email.has === "yes"
            ? ([["Provider", written(email.provider)]] as Item["details"])
            : email.has === "no"
              ? ([
                  ["Wants Google Workspace set up", yesNo(email.wantsCreated)],
                  ...(email.wantsCreated
                    ? ([
                        ["Accounts wanted", written(email.accounts)],
                        ["Addresses wanted", written(email.addresses)],
                      ] as Item["details"])
                    : []),
                ] as Item["details"])
              : []),
        ]),
      ],
    },
    {
      id: "logo",
      title: "Logo",
      items: [
        item("logo", "Logo", logoStanding, [
          ["Has a logo", having(logo.has)],
          ...(logo.has === "yes"
            ? ([
                ["Uploaded", logo.files?.length ? `${logo.files.length} file${logo.files.length === 1 ? "" : "s"}` : NONE],
                ["Logo files", written(logo.link)],
              ] as Item["details"])
            : logo.has === "no"
              ? ([
                  ["Wants us to design one", yesNo(logo.wantsCreated)],
                  ...(logo.wantsCreated
                    ? ([
                        ["Style they'd like", written(logo.style)],
                        ["Attached to the style", logo.styleFiles?.length ? `${logo.styleFiles.length} file${logo.styleFiles.length === 1 ? "" : "s"}` : NONE],
                      ] as Item["details"])
                    : []),
                ] as Item["details"])
              : []),
        ]),
      ],
    },
    { id: "google", title: "Google accounts", items: namesOf(GOOGLE_NAMES).map(([key, name]) => accountItem(key, name, onboarding.google?.[key])) },
    { id: "social", title: "Social media", items: namesOf(SOCIAL_NAMES).map(([key, name]) => accountItem(key, name, onboarding.social?.[key])) },
    { id: "media", title: "Photos and videos", items: namesOf(MEDIA_NAMES).map(([key, name]) => mediaItem(key, name, onboarding.media?.[key])) },
  ];
};

// Everything the client uploaded with their onboarding, by what it is: their logo, then each
// kind of photos and videos. Only what has files.
export const uploadsOf = (onboarding?: OnboardingAnswers): { title: string; files: OnboardingFile[] }[] =>
  [
    { title: "Logo", files: onboarding?.logo?.files ?? [] },
    { title: "Logo style references", files: onboarding?.logo?.styleFiles ?? [] },
    ...namesOf(MEDIA_NAMES).map(([key, title]) => ({ title, files: onboarding?.media?.[key]?.files ?? [] })),
  ].filter((group) => group.files.length);

// What a client says in the steps they go through right after signing up (client-portal:
// ClientSignup), in words: the backend keeps their choices as keys.
export const REACH_BY: Record<string, string> = { email: "Email", phone: "Phone call", text: "Text message" };
export const GOAL_TIMEFRAMES: Record<string, string> = { "3_months": "3 months", "6_months": "6 months", "12_months": "12 months", unsure: "Not sure" };
export const GOAL_BUDGETS: Record<string, string> = {
  under_1000: "Under $1,000",
  "1000_3000": "$1,000–$3,000",
  "3000_5000": "$3,000–$5,000",
  "5000_10000": "$5,000–$10,000",
  over_10000: "$10,000+",
  unsure: "Not sure yet",
};
export const LEAD_SOURCES: Record<string, string> = { referrals: "Referrals", google_search: "Google search", google_maps: "Google Maps", paid_ads: "Paid ads", social_media: "Social media", other: "Other" };

// A number as it is today and as they want it: "20 → 40".
export const targetOf = (pair: { current?: number; goal?: number } | undefined, show: (value: number) => string) =>
  pair?.current === undefined && pair?.goal === undefined ? undefined : `${pair.current === undefined ? "—" : show(pair.current)} → ${pair.goal === undefined ? "—" : show(pair.goal)}`;

export const isAnswered = (item: Item) => item.label !== NOT_ANSWERED[0];

// How many items stand where — the request at a glance.
export const countsOf = (groups: Group[]) => {
  const items = groups.flatMap((group) => group.items);
  return {
    answered: items.filter(isAnswered).length,
    total: items.length,
    byTone: Object.fromEntries(TONE_ORDER.map((tone) => [tone, items.filter((entry) => entry.tone === tone).length])) as Record<Tone, number>,
  };
};

// A value a client typed is only ever a link when it is plainly a web address.
export const linkOf = (value: string) => (/^https?:\/\/\S+$/i.test(value.trim()) ? value.trim() : null);
