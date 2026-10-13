"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";
import type { OnboardingAnswers } from "./onboarding";

const API = `${BACKEND_API_URL}/clients`;

// "onboarding": a client who made their own account and is filling in the onboarding form.
export type ClientStatus = "onboarding" | "pending" | "active" | "on_hold" | "closed";

// Staff shown next to a client. The list endpoint only returns the account
// manager; the detail endpoint also returns the team and the login account.
export interface ClientStaff {
  _id: string;
  fullName: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface ClientLogin {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: "pending" | "active" | "inactive" | "blocked";
  lastLoginAt?: string;
}

// One service the client has agreed to, as it was set up for them.
export interface ClientServicePlan {
  name: string;
  // The quantities and prices, each under its label on the form.
  fields: { label: string; value: number }[];
  monthly: number;
  included: string[];
  // Rates to quote if the client asks for more later. Not billed now.
  addons: { label: string; price: number }[];
}

export type ClientSocial = "facebook" | "instagram" | "linkedin" | "tiktok" | "youtube" | "x";

// What the add/edit form asks that the client's onboarding form asks too: their website, their
// profiles, their logo. Each is kept once, with the onboarding answers (backend:
// client.controller.ts → applyShared), so there is one answer whoever gave it last.
export interface ClientShared {
  website?: string;
  googleBusinessProfile?: string;
  // Competitor websites, separated by commas.
  competitors?: string;
  social?: Partial<Record<ClientSocial, string>>;
  hasLogo?: boolean;
  logoStyle?: string;
}

// What the team fills in about a client on the add/edit form, beside the contact details
// (backend: models/client.model.ts → IClientDetails). Dates are yyyy-mm-dd.
export interface ClientProfile {
  communication?: { methods?: string[]; bestTime?: string; timeZone?: string };
  business?: {
    industry?: string;
    businessType?: string;
    serviceArea?: string;
    targetAudience?: string;
    logoDesign?: { add?: boolean; price?: number; concepts?: number; style?: string };
    otherDetails?: string;
    // No longer sent: these are kept with the onboarding answers now (see ClientShared). They
    // only come back for a client last saved before that — read them through `sharedOf`.
    website?: string;
    googleBusinessProfile?: string;
    competitors?: string;
    social?: Partial<Record<ClientSocial, string>>;
    hasLogo?: boolean;
  };
  services?: ClientServicePlan[];
  transfer?: { has?: string[]; needs?: string[]; websiteDone?: string[]; socialDone?: string[] };
  contract?: {
    // In months; missing for a custom length.
    termMonths?: number;
    endDate?: string;
    renewal?: string;
    cancellationNotice?: string;
    renewalReminder?: string;
    signed?: "yes" | "sent" | "no";
    dateSigned?: string;
    dateSent?: string;
  };
  billing?: { paymentOnFile?: boolean; method?: string; cycle?: string; day?: string; setupFee?: string };
  reportDelivery?: string;
}

export interface Client {
  _id: string;
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  serviceTypes: string[];
  startDate: string;
  status: ClientStatus;
  notes?: string;
  // The client-portal pages this client is shown. Missing means all of them.
  portalMenus?: string[];
  // What the team recorded on the add/edit form. Missing for a client from before it asked.
  details?: ClientProfile;
  // What the client answered on the onboarding form, if they went through it.
  onboarding?: OnboardingAnswers;
  // Populated objects on read, plain ids if not populated.
  user?: ClientLogin | string;
  accountManager?: ClientStaff | string;
  team: (ClientStaff | string)[];
  createdBy?: string;
  // When they agreed to the Terms and Privacy Policy, making their own account.
  termsAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListData {
  clients: Client[];
  // Counts across every client the caller can see, whatever filter is applied.
  summary: Record<"total" | ClientStatus, number>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface ClientInput {
  contactName: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  serviceTypes: string[];
  startDate: string;
  status?: ClientStatus;
  notes?: string;
  portalMenus?: string[];
  details?: ClientProfile;
  shared?: ClientShared;
  // The ticks over the client's onboarding form: what they aren't asked, and what is approved.
  onboardingControls?: { notNeeded: string[]; approved: string[] };
  accountManager?: string | null;
  team?: string[];
}

export interface CreatedClient {
  client: Client;
  // The login account created together with the client — none, when no password was given.
  user: (ClientLogin & { role: "client"; client: string }) | null;
}

interface ClientActionResult<T> {
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

async function parseError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return {
      message: typeof body?.message === "string" ? body.message : fallback,
      errors: Array.isArray(body?.errors) ? (body.errors as string[]) : undefined,
    };
  } catch {
    return { message: fallback };
  }
}

export async function listClientsAction(
  params: {
    page?: number;
    limit?: number;
    status?: "all" | ClientStatus;
    search?: string;
  } = {},
): Promise<ClientActionResult<ClientListData>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.search?.trim()) query.set("q", params.search.trim());

    const response = await fetch(`${API}?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const { message } = await parseError(response, "Failed to fetch clients.");
      return { ok: false, error: message };
    }

    const body = await response.json();
    const { clients, summary, pagination } = body.data;
    return {
      ok: true,
      data: {
        clients,
        summary,
        pagination: {
          ...pagination,
          hasPreviousPage: pagination.page > 1,
          hasNextPage: pagination.page < pagination.totalPages,
        },
      },
    };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function getClientAction(id: string): Promise<ClientActionResult<Client>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const { message } = await parseError(response, "Failed to fetch client.");
      return { ok: false, error: message, status: response.status };
    }
    const body = await response.json();
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// A team member a client can be given as their account manager.
export interface StaffOption {
  _id: string;
  fullName: string;
}

// The team, to pick an account manager from. The backend only lists staff for admins; for
// anyone else — or if it can't be reached — this is empty, and the manager is left as it is.
export async function listStaffAction(): Promise<StaffOption[]> {
  const accessToken = await token();
  if (!accessToken) return [];

  try {
    const response = await fetch(`${BACKEND_API_URL}/users/staff`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: { _id: string; fullName: string }[] };
    return (body.data ?? []).map(({ _id, fullName }) => ({ _id, fullName }));
  } catch {
    return [];
  }
}

// Without a password the client is made with no portal login.
export async function createClientAction(
  input: ClientInput & { password?: string },
): Promise<ClientActionResult<CreatedClient>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const { message, errors } = await parseError(response, "Failed to create client.");
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await response.json();
    revalidatePath("/clients");
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function updateClientAction(
  id: string,
  input: Partial<ClientInput>,
): Promise<ClientActionResult<Client>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const { message, errors } = await parseError(response, "Failed to update client.");
      return { ok: false, error: message, fieldErrors: errors };
    }
    const body = await response.json();
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function deleteClientAction(id: string): Promise<ClientActionResult<null>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const { message } = await parseError(response, "Failed to delete client.");
      return { ok: false, error: message };
    }
    revalidatePath("/clients");
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
