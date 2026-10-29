"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The team's side of onboarding (backend: routes/onboarding.route.ts → /onboarding/requests).
// Someone with no account fills in the onboarding form in the client portal; that makes a
// pending client, and it shows here as a request until the team takes the client on.

const API = `${BACKEND_API_URL}/onboarding/requests`;

// ── What the backend stores (models/client.model.ts → IClientOnboarding) ──────

export type OnboardingStatus = "in_progress" | "submitted";
export type OnboardingYesNo = "yes" | "no";
export type OnboardingHas = "yes" | "no" | "unsure";

// A platform we need to get into: which one, and whether access has been given.
interface OnboardingPlatform {
  platform?: string;
  // Inviting our access email, or sharing the login (stored sealed; never shown).
  access?: "invite" | "secure";
  loginUsername?: string;
  loginPassword?: string;
  loginPasswordSet?: boolean;
  accessGiven?: boolean;
  needsHelp?: boolean;
}

// A Google or social account.
// A file the client uploaded with their onboarding (a logo, photos, videos).
export interface OnboardingFile {
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface OnboardingAccount {
  has?: OnboardingHas;
  link?: string;
  // Invite our access email, or share the login through a secure link.
  access?: "invite" | "secure";
  accessGiven?: boolean;
  needsHelp?: boolean;
  // They don't have one: should we create it?
  wantsCreated?: boolean;
  // Instagram: it is already connected to their Facebook Page.
  connected?: boolean;
  // The account's own login, when that is how we get in. The password is kept sealed and is
  // never shown: here it only says that there is one.
  loginUsername?: string;
  loginPassword?: string;
  // After the team saves answers, a stored password comes back only flagged.
  loginPasswordSet?: boolean;
}

// One kind of photos or videos.
export interface OnboardingMedia {
  mode?: "upload" | "create" | "none";
  // What they uploaded.
  files?: OnboardingFile[];
  // A shared folder holding them.
  link?: string;
  // What they need created.
  notes?: string;
}

export type OnboardingGoogleAccount = "businessProfile" | "analytics" | "searchConsole" | "tagManager" | "ads";
export type OnboardingSocialAccount = "facebook" | "instagram" | "youtube" | "linkedin" | "tiktok" | "x" | "email";
export type OnboardingMediaKind = "professionalPhotos" | "businessPhotos" | "videos";

// Every answer is optional — a missing one means the client didn't answer it.
// A number as it is in a typical month today, and as the client would like it to be.
export interface OnboardingTarget {
  current?: number;
  goal?: number;
}

export interface OnboardingAnswers {
  status: OnboardingStatus;
  submittedAt?: string;
  // The team's own ticks over the form (see OnboardingControls): what this client isn't asked —
  // steps ("step:google") and items ("social.facebook") — and the items that are approved.
  notNeeded?: string[];
  approved?: string[];
  // The items the team asked the client to update (a comment on the item), still to be done.
  updateAsked?: string[];
  // Asked in the steps a client goes through right after signing up (client-portal: ClientSignup).
  business?: {
    description?: string;
    // The work they do for their own clients, and where those clients come from.
    services?: string[];
    areas?: string[];
    contact?: { isAccountOwner?: boolean; name?: string; email?: string; phone?: string; reachBy?: "email" | "phone" | "text" };
  };
  goals?: {
    // Each per month; money in US dollars.
    revenue?: OnboardingTarget;
    leads?: OnboardingTarget;
    newClients?: OnboardingTarget;
    timeframe?: string;
    budget?: string;
    costPerLead?: number;
    clientValue?: number;
    leadSources?: string[];
  };
  // Whether they say they booked the kickoff call.
  // `bookedAt` is when the client first said so (set by the backend).
  kickoffCall?: { booked?: boolean; bookedAt?: string };
  website?: {
    url?: string;
    hasNone?: boolean;
    need?: "new" | "redesign" | "no";
    description?: string;
    competitors?: { url?: string; note?: string }[];
    pages?: string[];
    features?: string[];
  };
  domain?: OnboardingPlatform & { has?: OnboardingHas; name?: string; wantsCreated?: boolean; wishlist?: string };
  hosting?: OnboardingPlatform & { has?: OnboardingHas; wantsCreated?: boolean };
  // `has`: whether the website is built on a CMS. `giving`: with one, what they let us into.
  cms?: OnboardingPlatform & { has?: OnboardingHas; giving?: "cms" | "hosting" | "both"; developer?: string };
  // Their business email — not the contact's own email.
  email?: { has?: OnboardingYesNo; provider?: string; wantsCreated?: boolean; accounts?: number; addresses?: string };
  // `files` are what the client uploaded; `link` is a shared folder instead of, or with, them.
  logo?: { has?: OnboardingYesNo; link?: string; files?: OnboardingFile[]; wantsCreated?: boolean; style?: string; styleFiles?: OnboardingFile[] };
  google?: Partial<Record<OnboardingGoogleAccount, OnboardingAccount>>;
  // `metaAds` (the ad account behind Facebook and Instagram ads) is asked about at sign-up only.
  social?: Partial<Record<OnboardingSocialAccount, OnboardingAccount>> & { metaAds?: OnboardingAccount };
  media?: Partial<Record<OnboardingMediaKind, OnboardingMedia>>;
}

// A request as the list shows it: who sent it and where it stands.
export interface OnboardingRequestSummary {
  _id: string;
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  onboarding: Pick<OnboardingAnswers, "status" | "submittedAt">;
  createdAt: string;
  updatedAt: string;
}

// A request in full: the client it made, and every answer.
export interface OnboardingRequest extends Omit<OnboardingRequestSummary, "onboarding"> {
  // "pending" until the team takes the client on.
  status: "onboarding" | "pending" | "active" | "on_hold" | "closed";
  serviceTypes: string[];
  accountManager?: { _id: string; fullName: string } | string;
  onboarding: OnboardingAnswers;
}

export interface OnboardingRequestList {
  requests: OnboardingRequestSummary[];
  // Counts across every request waiting, whatever filter is applied.
  summary: Record<"total" | OnboardingStatus, number>;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface OnboardingActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  // HTTP status of a failed request, so pages can tell "not found" from other errors.
  status?: number;
}

async function token() {
  const session = await auth();
  return session?.accessToken;
}

async function failure(response: Response, fallback: string) {
  let message = fallback;
  try {
    const body = await response.json();
    if (typeof body?.message === "string") message = body.message;
  } catch {
    // Not JSON — keep the fallback message.
  }
  return { ok: false as const, error: message, status: response.status };
}

const NOT_SIGNED_IN = { ok: false as const, error: "Not authenticated." };
const NETWORK_ERROR = { ok: false as const, error: "Network error. Please try again." };

// The onboardings waiting to be taken on — those handed in first. For the roles that manage
// clients; anyone else gets a 403.
export async function listOnboardingRequestsAction(
  params: { status?: OnboardingStatus; page?: number; limit?: number } = {},
): Promise<OnboardingActionResult<OnboardingRequestList>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const query = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 20) });
    if (params.status) query.set("status", params.status);

    const response = await fetch(`${API}?${query}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return failure(response, "Failed to fetch onboarding requests.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// One onboarding in full: who sent it and every answer. `id` is the client's id.
export async function getOnboardingRequestAction(id: string): Promise<OnboardingActionResult<OnboardingRequest>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return failure(response, "Failed to fetch this onboarding request.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// ── Comments on a client's onboarding form ───────────────────────────────────

// What the client wrote on a step of their onboarding form, and the team's replies (backend:
// models/onboardingComment.model.ts). `step` is the step's id on the client's form ("domain");
// this portal's steps carry it as "step:domain". Comments and replies carry files, so they go
// through the upload routes (app/api/onboarding/comments/[clientId]/…).
export interface OnboardingCommentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}
export interface OnboardingCommentReply {
  _id: string;
  authorName: string;
  text: string;
  files: OnboardingCommentFile[];
  createdAt: string;
}
export interface OnboardingComment {
  _id: string;
  step: string;
  // The item of the step it is about, when it is about one ("social.facebook"), and its name.
  item?: string;
  itemLabel?: string;
  // Who wrote it: the client, or the team (started from the client's page). Missing means the client.
  side?: "client" | "team";
  authorName: string;
  text: string;
  files: OnboardingCommentFile[];
  createdAt: string;
  replies: OnboardingCommentReply[];
}

export async function listOnboardingCommentsAction(clientId: string): Promise<OnboardingActionResult<OnboardingComment[]>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;
  try {
    const response = await fetch(`${BACKEND_API_URL}/onboarding/clients/${clientId}/comments`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return failure(response, "Couldn't load the client's comments.");
    const { data } = (await response.json()) as { data: OnboardingComment[] };
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// The team fills in or corrects a client's onboarding answers (backend: PATCH
// /onboarding/clients/:clientId). Each section sent replaces the one stored. Back come the
// client's answers, with a stored password only flagged (`loginPasswordSet`), never sent.
export async function updateClientOnboardingAction(clientId: string, answers: Record<string, unknown>): Promise<OnboardingActionResult<{ onboarding: OnboardingAnswers }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;
  try {
    const response = await fetch(`${BACKEND_API_URL}/onboarding/clients/${clientId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!response.ok) return failure(response, "Couldn't save the answers.");
    const { data } = (await response.json()) as { data: { onboarding: OnboardingAnswers } };
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// One password a client shared on their onboarding form (backend: GET
// /onboarding/clients/:clientId/password), opened on request for those who manage clients.
// `login` is where it is kept: "hosting", "cms", "domain", or an account like "google.ads".
export async function revealOnboardingPasswordAction(clientId: string, login: string): Promise<OnboardingActionResult<{ password: string }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;
  try {
    const response = await fetch(`${BACKEND_API_URL}/onboarding/clients/${clientId}/password?login=${encodeURIComponent(login)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Couldn't show the password.");
    const { data } = (await response.json()) as { data: { password: string } };
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// The team taking one of a client's uploaded onboarding files off (backend: DELETE
// /onboarding/clients/:clientId/media/:kind). Back come the files left for that kind.
export async function removeClientOnboardingFileAction(clientId: string, kind: string, url: string): Promise<OnboardingActionResult<{ files: OnboardingFile[] }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;
  try {
    const response = await fetch(`${BACKEND_API_URL}/onboarding/clients/${clientId}/media/${kind}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) return failure(response, "Couldn't remove the file.");
    const { data } = (await response.json()) as { data: { files: OnboardingFile[] } };
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}
