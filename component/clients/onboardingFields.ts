import type { OnboardingAnswers } from "@/app/actions/onboarding";
import { GOAL_BUDGETS, GOAL_TIMEFRAMES, REACH_BY } from "./clientUi";

// What the team can fill in for each item of a client's onboarding (OnboardingReview → the
// item's "Edit answers"): the same answers as the client's own form, by where they are kept on
// the record (`path`, from client.onboarding). Saved through updateClientOnboardingAction.

export type FieldKind = "text" | "textarea" | "list" | "number" | "select" | "yesno" | "check" | "password";
export type FieldDef = { path: string; label: string; kind: FieldKind; options?: [value: string, label: string][]; wide?: boolean; hint?: string };

const HAS: [string, string][] = [
  ["yes", "Yes"],
  ["no", "No"],
  ["unsure", "Not sure"],
];
const HAS_TWO: [string, string][] = [
  ["yes", "Yes"],
  ["no", "No"],
];
const entries = (record: Record<string, string>) => Object.entries(record) as [string, string][];

// How they let us into a platform: an invite to our email, or the login itself.
const ACCESS: [string, string][] = [
  ["invite", "Inviting our access email"],
  ["secure", "Sharing the login"],
];
const wayIn = (section: string): FieldDef[] => [
  { path: `${section}.access`, label: "How they give access", kind: "select", options: ACCESS },
  { path: `${section}.loginUsername`, label: "Login email or username", kind: "text" },
  { path: `${section}.loginPassword`, label: "Login password", kind: "password", hint: "Only to change it. Stored encrypted." },
  { path: `${section}.accessGiven`, label: "Access given", kind: "check" },
  { path: `${section}.needsHelp`, label: "Needs help giving access", kind: "check" },
];

// A platform we need to get into: whether they have it, where, and how we get in.
const platform = (section: string, has: string, where: string, create: string): FieldDef[] => [
  { path: `${section}.has`, label: has, kind: "select", options: HAS },
  { path: `${section}.platform`, label: where, kind: "text" },
  ...wayIn(section),
  { path: `${section}.wantsCreated`, label: create, kind: "yesno" },
];

// A Google or social account.
const account = (path: string, instagram = false): FieldDef[] => [
  { path: `${path}.has`, label: "Has an account", kind: "select", options: HAS },
  { path: `${path}.link`, label: "Link or name", kind: "text" },
  {
    path: `${path}.access`,
    label: "How they give access",
    kind: "select",
    options: [
      ["invite", "Inviting our access email"],
      ["secure", "Sharing the login"],
    ],
  },
  ...(instagram ? [{ path: `${path}.connected`, label: "Connected to their Facebook Page", kind: "check" } as FieldDef] : []),
  { path: `${path}.loginUsername`, label: "Login username", kind: "text" },
  { path: `${path}.loginPassword`, label: "Login password", kind: "password", hint: "Only to change it. Stored encrypted." },
  { path: `${path}.accessGiven`, label: "Access given", kind: "check" },
  { path: `${path}.needsHelp`, label: "Needs help giving access", kind: "check" },
  { path: `${path}.wantsCreated`, label: "Wants us to create it", kind: "yesno" },
];

export const fieldsOf = (itemId: string): FieldDef[] => {
  if (itemId.startsWith("google.") || itemId.startsWith("social.")) return account(itemId, itemId === "social.instagram");
  if (itemId.startsWith("media.")) {
    return [
      {
        path: `${itemId}.mode`,
        label: "What they chose",
        kind: "select",
        options: [
          ["upload", "Share what they have"],
          ["create", "They need these created"],
          ["none", "They don't need these"],
        ],
      },
      { path: `${itemId}.link`, label: "Shared folder", kind: "text" },
      { path: `${itemId}.notes`, label: "What they need", kind: "textarea", wide: true },
    ];
  }
  switch (itemId) {
    case "contact":
      return [
        { path: "business.description", label: "What the business does", kind: "textarea", wide: true },
        { path: "business.services", label: "Services they offer", kind: "list", wide: true, hint: "Separate them with commas." },
        { path: "business.areas", label: "Areas they serve", kind: "list", wide: true, hint: "Separate them with commas." },
        { path: "business.contact.reachBy", label: "Best way to reach them", kind: "select", options: entries(REACH_BY) },
        { path: "kickoffCall.booked", label: "Onboarding call booked", kind: "yesno" },
        { path: "goals.revenue.current", label: "Revenue per month now", kind: "number" },
        { path: "goals.revenue.goal", label: "Revenue per month goal", kind: "number" },
        { path: "goals.leads.current", label: "Leads per month now", kind: "number" },
        { path: "goals.leads.goal", label: "Leads per month goal", kind: "number" },
        { path: "goals.newClients.current", label: "New clients per month now", kind: "number" },
        { path: "goals.newClients.goal", label: "New clients per month goal", kind: "number" },
        { path: "goals.timeframe", label: "How soon", kind: "select", options: entries(GOAL_TIMEFRAMES) },
        { path: "goals.budget", label: "Monthly marketing budget", kind: "select", options: entries(GOAL_BUDGETS) },
        { path: "goals.costPerLead", label: "Cost of one lead today", kind: "number" },
        { path: "goals.clientValue", label: "Worth of one new client", kind: "number" },
      ];
    case "website":
      return [
        { path: "website.url", label: "Current website", kind: "text" },
        { path: "website.hasNone", label: "No website yet", kind: "check" },
        {
          path: "website.need",
          label: "Needs a new website",
          kind: "select",
          options: [
            ["new", "Yes, build a new one"],
            ["redesign", "Redesign the current site"],
            ["no", "No, not right now"],
          ],
        },
        { path: "website.description", label: "How they want it", kind: "textarea", wide: true },
        { path: "website.pages", label: "Pages", kind: "list", wide: true, hint: "Separate them with commas." },
        { path: "website.features", label: "Features", kind: "list", wide: true, hint: "Separate them with commas." },
      ];
    case "domain":
      return [
        ...platform("domain", "Has a domain", "Registered at", "Wants us to register one"),
        { path: "domain.name", label: "Domain", kind: "text" },
        { path: "domain.wishlist", label: "Names they'd like", kind: "text" },
      ];
    case "hosting":
      return platform("hosting", "Has hosting", "Hosted at", "Wants us to set it up");
    case "cms":
      return [
        { path: "cms.has", label: "Built on a CMS", kind: "select", options: HAS },
        {
          path: "cms.giving",
          label: "Access they give",
          kind: "select",
          options: [
            ["cms", "Website dashboard"],
            ["hosting", "Hosting account"],
            ["both", "Both"],
          ],
        },
        { path: "cms.platform", label: "Built with", kind: "text" },
        { path: "cms.developer", label: "Developer", kind: "text" },
        ...wayIn("cms"),
      ];
    case "email":
      return [
        { path: "email.has", label: "Has a business email", kind: "select", options: HAS_TWO },
        { path: "email.provider", label: "Provider", kind: "text" },
        { path: "email.wantsCreated", label: "Wants Google Workspace set up", kind: "yesno" },
        { path: "email.accounts", label: "Accounts wanted", kind: "number" },
        { path: "email.addresses", label: "Addresses wanted", kind: "text" },
      ];
    case "logo":
      return [
        { path: "logo.has", label: "Has a logo", kind: "select", options: HAS_TWO },
        { path: "logo.link", label: "Link to the logo files", kind: "text" },
        { path: "logo.wantsCreated", label: "Wants us to design one", kind: "yesno" },
        { path: "logo.style", label: "Style they'd like", kind: "textarea", wide: true },
      ];
    default:
      return [];
  }
};

// ── Reading and writing by path ──────────────────────────────────────────────

type Plain = Record<string, unknown>;
const isPlain = (value: unknown): value is Plain => typeof value === "object" && value !== null && !Array.isArray(value);

export const getPath = (root: unknown, path: string): unknown => path.split(".").reduce<unknown>((at, key) => (isPlain(at) ? at[key] : undefined), root);

const setPath = (root: Plain, path: string, value: unknown) => {
  const keys = path.split(".");
  let at = root;
  for (const key of keys.slice(0, -1)) {
    if (!isPlain(at[key])) at[key] = {};
    at = at[key] as Plain;
  }
  if (value === undefined) delete at[keys[keys.length - 1]];
  else at[keys[keys.length - 1]] = value;
};

// What a field shows, from what is stored.
export const valueOf = (onboarding: OnboardingAnswers | undefined, field: FieldDef): string | boolean => {
  const stored = getPath(onboarding, field.path);
  if (field.kind === "password") return "";
  if (field.kind === "check") return stored === true;
  if (field.kind === "yesno") return stored === true ? "true" : stored === false ? "false" : "";
  if (field.kind === "list") return Array.isArray(stored) ? stored.join(", ") : "";
  return stored === undefined || stored === null ? "" : String(stored);
};

// What a field stores, from what it shows.
const storedOf = (field: FieldDef, shown: string | boolean): unknown => {
  if (field.kind === "check") return shown === true ? true : undefined;
  if (field.kind === "yesno") return shown === "true" ? true : shown === "false" ? false : undefined;
  const text = typeof shown === "string" ? shown.trim() : "";
  if (!text) return undefined;
  if (field.kind === "list") return text.split(",").map((part) => part.trim()).filter(Boolean);
  if (field.kind === "number") {
    const number = Number(text);
    return Number.isFinite(number) && number >= 0 ? number : undefined;
  }
  return text;
};

// The sections an item's fields are in, as stored, with the edits on them — whole, as the backend
// replaces a section with what is sent. A stored password never goes back: an account without a
// new one keeps the one it has.
export const answersFrom = (onboarding: OnboardingAnswers | undefined, fields: FieldDef[], shown: Record<string, string | boolean>) => {
  const answers: Plain = {};
  for (const section of new Set(fields.map((field) => field.path.split(".")[0]))) {
    const copy = JSON.parse(JSON.stringify(getPath(onboarding, section) ?? {})) as Plain;
    if (section === "google" || section === "social") {
      for (const entry of Object.values(copy)) {
        if (isPlain(entry)) {
          delete entry.loginPassword;
          delete entry.loginPasswordSet;
        }
      }
    }
    // A platform's own login: the stored (sealed) password never goes back either.
    if (section === "domain" || section === "hosting" || section === "cms") {
      delete copy.loginPassword;
      delete copy.loginPasswordSet;
    }
    answers[section] = copy;
  }
  for (const field of fields) {
    if (field.kind === "password" && !shown[field.path]) continue;
    setPath(answers, field.path, storedOf(field, shown[field.path] ?? ""));
  }
  return answers;
};
