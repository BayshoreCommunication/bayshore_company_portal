"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";
const API = `${BACKEND_API_URL}/clients`;

export type ClientStatus = "pending" | "active" | "on_hold" | "closed";

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
  // Populated objects on read, plain ids if not populated.
  user?: ClientLogin | string;
  accountManager?: ClientStaff | string;
  team: (ClientStaff | string)[];
  createdBy?: string;
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
  accountManager?: string | null;
  team?: string[];
}

export interface CreatedClient {
  client: Client;
  // The login account created together with the client.
  user: ClientLogin & { role: "client"; client: string };
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

export async function createClientAction(
  input: ClientInput & { password: string },
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
