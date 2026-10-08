import type {
  OnboardingAccount,
  OnboardingAnswers,
  OnboardingGoogleAccount,
  OnboardingMedia,
  OnboardingMediaKind,
  OnboardingRequest,
  OnboardingSocialAccount,
  OnboardingStatus,
} from "@/app/actions/onboarding";

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
export type Group = { title: string; items: Item[] };

type Standing = [label: string, tone: Tone];
const NOT_ANSWERED: Standing = ["Not answered", "none"];
const NOT_NEEDED: Standing = ["Not needed", "none"];
const NOT_SURE = "Not sure";

// Site builders that host the site themselves: with one of these there is no hosting to get into.
const BUILDERS = ["Wix", "Squarespace", "Shopify"];

// How each kind of answer is written out. Every field is listed whether or not it was filled in.
const written = (value: string | number | undefined | null) => (value === undefined || value === null || String(value).trim() === "" ? NONE : String(value));
// "Do you have one?"
const having = (value?: "yes" | "no" | "unsure") => (value === "yes" ? "Yes" : value === "no" ? "No" : value === "unsure" ? "Not sure" : NONE);
// A question answered yes or no — or not at all.
const yesNo = (value?: boolean) => (value === undefined ? NONE : value ? "Yes" : "No");
// A box that is either ticked or not.
const ticked = (value?: boolean) => (value ? "Yes" : "No");
const listed = (values?: string[]) => (values?.length ? values.join(", ") : NONE);

// The two fields every platform we need access to has.
const accessFields = (entry: { accessGiven?: boolean; needsHelp?: boolean }): Item["details"] => [
  ["Access given", ticked(entry.accessGiven)],
  ["Needs help with access", ticked(entry.needsHelp)],
];

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
    return inviting(entry);
  }
  if (entry.has === "no") return wanted(entry.wantsCreated, creating);
  if (entry.has === "unsure") return ["Find out for them", "followup"];
  return NOT_ANSWERED;
};

const accountItem = (id: string, name: string, account: OnboardingAccount = {}): Item => {
  const standing: Standing =
    account.has === "yes"
      ? account.access === "invite"
        ? inviting(account)
        : account.access === "secure"
          ? ["Send a secure link for the login", "followup"]
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
    details: [
      ["Has an account", having(account.has)],
      ["Link or name", written(account.link)],
      ["How they give access", account.access === "invite" ? "Inviting our access email" : account.access === "secure" ? "Sharing the login securely" : NONE],
      ...accessFields(account),
      ["Wants us to create it", yesNo(account.wantsCreated)],
    ],
  };
};

const mediaItem = (id: string, name: string, media: OnboardingMedia = {}): Item => {
  const standing: Standing =
    media.mode === "upload"
      ? media.link
        ? ["Link shared", "ready"]
        : ["Waiting for a link", "waiting"]
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
      ["Shared folder", written(media.link)],
      ["What they need", written(media.notes)],
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
const SOCIAL_NAMES: Record<OnboardingSocialAccount, string> = {
  facebook: "Facebook Page",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn Company Page",
  tiktok: "TikTok",
  x: "X (Twitter)",
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

  const cmsStanding: Standing = !cms.platform
    ? NOT_ANSWERED
    : cms.platform === NOT_SURE
      ? ["Help them find it", "followup"]
      : cms.developer
        ? ["Contact their developer for access", "followup"]
        : inviting(cms);

  const emailStanding: Standing = email.has === "yes" ? ["Has one", "ready"] : email.has === "no" ? wanted(email.wantsCreated, "Set up Google Workspace") : NOT_ANSWERED;

  const logoStanding: Standing =
    logo.has === "yes" ? (logo.link ? ["Link shared", "ready"] : ["Waiting for the logo files", "waiting"]) : logo.has === "no" ? wanted(logo.wantsCreated, "Design a logo") : NOT_ANSWERED;

  const examples = (website.competitors ?? []).map((row) => [row.url, row.note].filter(Boolean).join(" — ")).filter(Boolean);

  // One group for each step of the form, under the step's own name.
  return [
    {
      title: "Website",
      items: [
        item("website", "Website", websiteStanding, [
          ["Current website", website.hasNone ? "No website yet" : written(website.url)],
          ["Needs a new website", website.need === "new" ? "Yes, build a new one" : website.need === "redesign" ? "Redesign the current site" : website.need === "no" ? "No, not right now" : NONE],
          ["How they want it", written(website.description)],
          ["Example websites", examples.length ? examples.join("\n") : NONE],
          ["Pages", listed(website.pages)],
          ["Features", listed(website.features)],
        ]),
      ],
    },
    {
      title: "Domain and hosting",
      items: [
        item("domain", "Domain name", platformStanding(domain, "Register a domain"), [
          ["Has a domain", having(domain.has)],
          ["Domain", written(domain.name)],
          ["Registered at", written(domain.platform)],
          ...accessFields(domain),
          ["Wants us to register one", yesNo(domain.wantsCreated)],
          ["Names they'd like", written(domain.wishlist)],
        ]),
        item("hosting", "Hosting", platformStanding(hosting, "Set up hosting", true), [
          ["Has hosting", having(hosting.has)],
          ["Hosted at", written(hosting.platform)],
          ...accessFields(hosting),
          ["Wants us to set it up", yesNo(hosting.wantsCreated)],
        ]),
        item("cms", "Website login (CMS)", cmsStanding, [["Built with", written(cms.platform)], ["Developer", written(cms.developer)], ...accessFields(cms)]),
      ],
    },
    {
      title: "Business email",
      items: [
        item("email", "Business email", emailStanding, [
          ["Has a business email", having(email.has)],
          ["Provider", written(email.provider)],
          ["Wants Google Workspace set up", yesNo(email.wantsCreated)],
          ["Accounts wanted", written(email.accounts)],
          ["Addresses wanted", written(email.addresses)],
        ]),
      ],
    },
    {
      title: "Logo",
      items: [
        item("logo", "Logo", logoStanding, [
          ["Has a logo", having(logo.has)],
          ["Logo files", written(logo.link)],
          ["Wants us to design one", yesNo(logo.wantsCreated)],
          ["Style they'd like", written(logo.style)],
        ]),
      ],
    },
    { title: "Google accounts", items: namesOf(GOOGLE_NAMES).map(([key, name]) => accountItem(key, name, onboarding.google?.[key])) },
    { title: "Social media", items: namesOf(SOCIAL_NAMES).map(([key, name]) => accountItem(key, name, onboarding.social?.[key])) },
    { title: "Photos and videos", items: namesOf(MEDIA_NAMES).map(([key, name]) => mediaItem(key, name, onboarding.media?.[key])) },
  ];
};

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
