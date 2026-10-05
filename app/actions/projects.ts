"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/projects`;

// Where projects are listed in this portal; refreshed after every change.
const LIST_PATH = "/projects";

// Mirror backend/models/project.model.ts — keep the lists in step.
export type ProjectPriority = "low" | "normal" | "high";
export type ProjectStatus = "new" | "in_progress" | "completed";

export interface ProjectPerson {
  _id: string;
  fullName: string;
}

export interface ProjectClient {
  _id: string;
  companyName: string;
  contactName?: string;
}

export interface ProjectFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Project {
  _id: string;
  // Populated (company name) when read; a plain id when not.
  client: ProjectClient | string;
  name: string;
  description?: string;
  targetDate?: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  files: ProjectFile[];
  // Whether the client opened it from their portal or the team did on their behalf.
  requestedBy: "client" | "team";
  createdBy?: ProjectPerson | string;
  // Stamped by the backend as the status moves.
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListData {
  projects: Project[];
  // Per status for the client filter only — it doesn't change when the list is
  // narrowed by status, priority or search.
  summary: Record<"total" | ProjectStatus, number>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export interface ProjectFieldsInput {
  description?: string;
  // A bare date, "2026-10-30". Send "" when editing to clear it.
  targetDate?: string;
  priority?: ProjectPriority;
  status?: ProjectStatus;
}

export interface ProjectInput extends ProjectFieldsInput {
  client: string;
  name: string;
}

// Editing sends only what changes; the client can't be changed. `removeFiles`
// drops attached files by URL.
export type ProjectUpdateInput = ProjectFieldsInput & { name?: string; removeFiles?: string[] };

interface ProjectActionResult<T> {
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

export async function listProjectsAction(
  params: {
    page?: number;
    limit?: number;
    client?: string;
    status?: "all" | ProjectStatus;
    priority?: "all" | ProjectPriority;
    // Matches the project's name or description, or the client's company name.
    search?: string;
  } = {},
): Promise<ProjectActionResult<ProjectListData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    if (params.client) query.set("client", params.client);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.priority && params.priority !== "all") query.set("priority", params.priority);
    if (params.search?.trim()) query.set("q", params.search.trim());

    const response = await fetch(`${API}?${query}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch projects.");

    const { data } = await response.json();
    const { projects, summary, pagination } = data;
    return {
      ok: true,
      data: {
        projects,
        summary,
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

export async function getProjectAction(id: string): Promise<ProjectActionResult<Project>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch project.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Opens a project without files. To attach files, post a multipart form to
// /api/projects instead (see app/api/projects/route.ts): a server action caps the
// request body at 1MB, so uploads go through that route handler.
export async function createProjectAction(input: ProjectInput): Promise<ProjectActionResult<Project>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to create project.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Changes a project's details or status and drops attached files (`removeFiles`).
// To add files, send a multipart PATCH to /api/projects/[id] instead
// (see app/api/projects/[id]/route.ts).
export async function updateProjectAction(id: string, input: ProjectUpdateInput): Promise<ProjectActionResult<Project>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to update project.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}/edit`);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Managers, admins and superadmins only; anyone else gets `error` back. The
// project's files are removed from storage with it.
export async function deleteProjectAction(id: string): Promise<ProjectActionResult<null>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: authorised(accessToken),
    });
    if (!response.ok) return failure(response, "Failed to delete project.");

    revalidatePath(LIST_PATH);
    return { ok: true, data: null };
  } catch {
    return NETWORK_ERROR;
  }
}
