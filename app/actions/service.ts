"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/services`;

// Where services are listed in this portal; refreshed after every change. The
// client's view is the same page with ?client=, so one path covers both.
const LIST_PATH = "/services";

// Mirror backend/models/service.model.ts — keep the lists in step.
export type ServicePlan = "growth" | "core";

export interface SubService {
  _id: string;
  name: string;
  // Whole dollars a month.
  price: number;
}

// A service in the catalog.
export interface Service {
  _id: string;
  title: string;
  description?: string;
  plan: ServicePlan;
  color?: string;
  subServices: SubService[];
  // The sum of the sub-services' prices; worked out by the backend.
  monthlyPrice: number;
  createdAt: string;
  updatedAt: string;
}

// A catalog row also says how many of the caller's clients take the service and
// what they pay for it a month.
export interface ServiceListItem extends Service {
  clientCount: number;
  monthlyRevenue: number;
}

export interface ServiceListData {
  services: ServiceListItem[];
  summary: {
    services: number;
    subServices: number;
    clientsServed: number;
    // What all the caller's clients pay a month, together.
    monthlyTotal: number;
  };
}

// One catalog service a client takes: the sub-services included, and what the
// client pays for it a month.
export interface ClientService {
  _id: string;
  client: string;
  // The catalog service in full, so "4 of 6 sub-services" and what's left out can be shown.
  service: Service;
  subServices: { subService: string; name: string; price: number }[];
  monthlyPrice: number;
  assignedBy?: { _id: string; fullName: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientServicesData {
  services: ClientService[];
  // The client's monthly payment: the sum of their services.
  monthlyTotal: number;
}

// The whole sub-service list. When editing: an item with its `_id` is the same
// sub-service renamed or re-priced; one without is new; one left out is removed.
export interface SubServiceInput {
  _id?: string;
  name: string;
  price: number;
}

export interface ServiceInput {
  title: string;
  description?: string;
  plan?: ServicePlan;
  color?: string;
  subServices: SubServiceInput[];
}

export type ServiceUpdateInput = Partial<ServiceInput>;

// What editing a catalog service did to the clients who take it.
export interface ServiceUpdateResult {
  service: Service;
  clients: { updated: number; removed: number };
}

// A service for a client: its id and the ids of the sub-services they take.
export interface ClientServiceInput {
  service: string;
  subServices: string[];
}

interface ServiceActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: string[];
  // HTTP status of a failed request, so pages can tell "not found" (404) from
  // "not allowed" (403) and "still in use" (409).
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

// ── The catalog ──────────────────────────────────────────────────────────────

export async function listServicesAction(): Promise<ServiceActionResult<ServiceListData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(API, { headers: authorised(accessToken), cache: "no-store" });
    if (!response.ok) return failure(response, "Failed to fetch services.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function getServiceAction(id: string): Promise<ServiceActionResult<Service>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, { headers: authorised(accessToken), cache: "no-store" });
    if (!response.ok) return failure(response, "Failed to fetch service.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Superadmins only; anyone else gets `error` back.
export async function createServiceAction(input: ServiceInput): Promise<ServiceActionResult<Service>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to create service.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Superadmins only. Clients who take the service are brought along by the backend:
// renamed or re-priced sub-services change for them, removed ones are dropped.
export async function updateServiceAction(
  id: string,
  input: ServiceUpdateInput,
): Promise<ServiceActionResult<ServiceUpdateResult>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to update service.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}/edit`);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Superadmins only, and refused (409) while any client still takes the service.
export async function deleteServiceAction(id: string): Promise<ServiceActionResult<null>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, { method: "DELETE", headers: authorised(accessToken) });
    if (!response.ok) return failure(response, "Failed to delete service.");

    revalidatePath(LIST_PATH);
    return { ok: true, data: null };
  } catch {
    return NETWORK_ERROR;
  }
}

// ── A client's services and monthly payment ──────────────────────────────────

export async function getClientServicesAction(clientId: string): Promise<ServiceActionResult<ClientServicesData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/clients/${clientId}`, { headers: authorised(accessToken), cache: "no-store" });
    if (!response.ok) return failure(response, "Failed to fetch the client's services.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Replaces the whole set of services a client takes: what's left out is removed,
// and an empty list removes them all. Prices come from the catalog.
export async function setClientServicesAction(
  clientId: string,
  services: ClientServiceInput[],
): Promise<ServiceActionResult<ClientServicesData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/clients/${clientId}`, {
      method: "PUT",
      headers: authorised(accessToken, true),
      body: JSON.stringify({ services }),
    });
    if (!response.ok) return failure(response, "Failed to save the client's services.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}
