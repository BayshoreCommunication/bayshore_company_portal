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
  accessGiven?: boolean;
  needsHelp?: boolean;
}

// A Google or social account.
export interface OnboardingAccount {
  has?: OnboardingHas;
  link?: string;
  // Invite our access email, or share the login through a secure link.
  access?: "invite" | "secure";
  accessGiven?: boolean;
  needsHelp?: boolean;
  // They don't have one: should we create it?
  wantsCreated?: boolean;
}

// One kind of photos or videos.
export interface OnboardingMedia {
  mode?: "upload" | "create" | "none";
  // A shared folder holding them.
  link?: string;
  // What they need created.
  notes?: string;
}

export type OnboardingGoogleAccount = "businessProfile" | "analytics" | "searchConsole" | "tagManager" | "ads";
export type OnboardingSocialAccount = "facebook" | "instagram" | "youtube" | "linkedin" | "tiktok" | "x";
export type OnboardingMediaKind = "professionalPhotos" | "businessPhotos" | "videos";

// Every answer is optional — a missing one means the client didn't answer it.
export interface OnboardingAnswers {
  status: OnboardingStatus;
  submittedAt?: string;
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
  cms?: OnboardingPlatform & { developer?: string };
  // Their business email — not the contact's own email.
  email?: { has?: OnboardingYesNo; provider?: string; wantsCreated?: boolean; accounts?: number; addresses?: string };
  logo?: { has?: OnboardingYesNo; link?: string; wantsCreated?: boolean; style?: string };
  google?: Partial<Record<OnboardingGoogleAccount, OnboardingAccount>>;
  social?: Partial<Record<OnboardingSocialAccount, OnboardingAccount>>;
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
  status: "pending" | "active" | "on_hold" | "closed";
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
