"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/leads`;

// Where leads are listed in this portal; refreshed after every change.
const LIST_PATH = "/leads";

// Mirror backend/models/lead.model.ts — keep the lists in step.
export type LeadStatus = "new" | "contacted" | "qualified" | "consultation_set" | "converted" | "lost";
export type LeadChannel = "gmb" | "website" | "social" | "referral" | "direct";
export type LeadSource =
  | "gmb_call"
  | "gmb_message"
  | "website_form"
  | "website_chat"
  | "blog_cta"
  | "facebook"
  | "instagram"
  | "referral"
  | "walk_in"
  | "office_call"
  | "other";
export type LeadOrigin = "manual" | "import" | "integration";

export interface LeadPerson {
  _id: string;
  fullName: string;
}

export interface LeadClient {
  _id: string;
  companyName: string;
  contactName?: string;
}

export interface LeadStatusChange {
  status: LeadStatus;
  at: string;
  // Populated (name) on the single lead.
  by?: LeadPerson | string;
  byKind?: "client" | "team";
}

export interface Lead {
  _id: string;
  // Populated (company name) when read; a plain id when not.
  client: LeadClient | string;
  fullName: string;
  phone?: string;
  email?: string;
  // Typed in — each firm uses its own case types.
  caseType: string;
  source: LeadSource;
  // Worked out from source by the backend.
  channel: LeadChannel;
  origin: LeadOrigin;
  receivedAt: string;
  status: LeadStatus;
  statusHistory: LeadStatusChange[];
  consultationAt?: string;
  convertedAt?: string;
  lostReason?: string;
  // Visible to the client.
  notes?: string;
  // Team-only. Comes with the single lead (and after create / edit), not with the list.
  internalNotes?: string;
  createdBy?: LeadPerson | string;
  createdAt: string;
  updatedAt: string;
}

// The list leaves out each lead's timeline and internal notes.
export type LeadListItem = Omit<Lead, "statusHistory" | "internalNotes">;

export interface LeadListData {
  leads: LeadListItem[];
  // Per status and per channel, for the client and date range only — they don't
  // change when the table is narrowed by status, channel, source, case type or search.
  summary: Record<"total" | LeadStatus, number>;
  channels: Record<LeadChannel, number>;
  // The case types in use for the client and date range, A–Z — for the filter
  // and for the form's suggestions.
  caseTypes: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// The fields staff can set. When editing, send only what changed; null or ""
// clears an optional field.
export interface LeadFieldsInput {
  phone?: string | null;
  email?: string | null;
  // Defaults to now on create; can't be in the future.
  receivedAt?: string;
  status?: LeadStatus;
  // Required when status is consultation_set.
  consultationAt?: string | null;
  // Required when status is lost.
  lostReason?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
}

// A phone number or an email is required.
export interface LeadInput extends LeadFieldsInput {
  client: string;
  fullName: string;
  caseType: string;
  source: LeadSource;
}

// The client can't be changed.
export type LeadUpdateInput = LeadFieldsInput & Partial<Pick<LeadInput, "fullName" | "caseType" | "source">>;

interface LeadActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: string[];
  // HTTP status of a failed request, so pages can tell "not found" from other errors.
  status?: number;
}

async function token() {
  const session = await auth();
  return session?.accessToken;
}

async function failure(response: Response, fallback: string) {
  let message = fallback;
  let errors: string[] | undefined;
  try {
    const body = await response.json();
    if (typeof body?.message === "string") message = body.message;
    if (Array.isArray(body?.errors) && body.errors.length) errors = body.errors as string[];
  } catch {
    // Not JSON — keep the fallback message.
  }
  return { ok: false as const, error: message, fieldErrors: errors, status: response.status };
}

const NOT_SIGNED_IN = { ok: false as const, error: "Not authenticated." };
const NETWORK_ERROR = { ok: false as const, error: "Network error. Please try again." };

const authorised = (accessToken: string, json = false): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export async function listLeadsAction(
  params: {
    page?: number;
    limit?: number;
    client?: string;
    status?: "all" | LeadStatus;
    channel?: "all" | LeadChannel;
    source?: "all" | LeadSource;
    // "all", or one of the exact case types the list returned in `caseTypes`.
    caseType?: string;
    search?: string;
    // Received on or after / on or before. A bare date in `to` covers that whole day.
    from?: string;
    to?: string;
  } = {},
): Promise<LeadActionResult<LeadListData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    if (params.client) query.set("client", params.client);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.channel && params.channel !== "all") query.set("channel", params.channel);
    if (params.source && params.source !== "all") query.set("source", params.source);
    if (params.caseType && params.caseType !== "all") query.set("caseType", params.caseType);
    if (params.search?.trim()) query.set("q", params.search.trim());
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);

    const response = await fetch(`${API}?${query}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch leads.");

    const { data } = await response.json();
    const { leads, summary, channels, caseTypes, pagination } = data;
    return {
      ok: true,
      data: {
        leads,
        summary,
        channels,
        caseTypes: caseTypes ?? [],
        pagination: {
          ...pagination,
          hasPreviousPage: pagination.page > 1,
          hasNextPage: pagination.page < pagination.totalPages,
        },
      },
    };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function getLeadAction(id: string): Promise<LeadActionResult<Lead>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch lead.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function createLeadAction(input: LeadInput): Promise<LeadActionResult<Lead>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to create lead.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Changing the status adds it to the lead's timeline.
export async function updateLeadAction(id: string, input: LeadUpdateInput): Promise<LeadActionResult<Lead>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to update lead.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Managers, admins and superadmins only; anyone else gets `error` back.
export async function deleteLeadAction(id: string): Promise<LeadActionResult<null>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: authorised(accessToken),
    });
    if (!response.ok) return failure(response, "Failed to delete lead.");

    revalidatePath(LIST_PATH);
    return { ok: true, data: null };
  } catch {
    return NETWORK_ERROR;
  }
}
