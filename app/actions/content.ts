"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/content`;

// Where content is managed in this portal; refreshed after every change.
const LIST_PATH = "/content";

// Mirrors the backend's content model (models/content.model.ts).
export type ContentType = "image" | "carousel" | "story" | "video" | "blog" | "website" | "email" | "gmb" | "ad";
export type ContentStatus = "draft" | "pending_approval" | "revision_requested" | "approved";
export type ContentBatchType = "monthly" | "weekly" | "event" | "individual";
export type ContentMedia = "image" | "video" | "doc";

export interface ContentPerson {
  _id: string;
  fullName: string;
}

export interface ContentClientRef {
  _id: string;
  companyName: string;
  contactName?: string;
}

export interface ContentComment {
  author: "client" | "team";
  user?: ContentPerson | string;
  name?: string;
  // May be empty when the comment is only attachments.
  text: string;
  attachments?: ContentFile[];
  createdAt: string;
}

// One uploaded file, stored in DigitalOcean Spaces.
export interface ContentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  media: ContentMedia;
}

export interface ContentItem {
  _id: string;
  // Populated (company name) when read; a plain id when not.
  client: ContentClientRef | string;
  type: ContentType;
  title: string;

  batchMonth: string;
  // Older records may not have it — read those from isIndividual.
  batchType?: ContentBatchType;
  weekStart?: string;
  eventName?: string;
  eventDate?: string;
  sentReason?: string;
  isIndividual: boolean;

  status: ContentStatus;

  // Up to 10 files, and/or a pasted link (video, blog, website, email).
  files?: ContentFile[];
  link?: string;
  pageName?: string;
  pageUrl?: string;
  subject?: string;
  headline?: string;
  cta?: string;
  caption?: string;
  tags: string[];

  // Single-URL fields from before `files` existed — still filled in by the backend.
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  docName?: string;
  docTitle?: string;
  docUrl?: string;

  comments: ContentComment[];
  createdBy?: ContentPerson | string;
  submittedAt?: string;
  approvedBy?: ContentPerson | string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentListData {
  items: ContentItem[];
  // Counts across every item the caller can see, whatever filter is applied.
  summary: Record<"total" | ContentStatus, number>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// What POST /api/content/batch (the upload route) answers with.
export interface ContentBatchResponse {
  success: boolean;
  message: string;
  data?: { items: ContentItem[] };
  errors?: string[];
}

interface ContentActionResult<T> {
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

export async function listContentAction(
  params: {
    page?: number;
    limit?: number;
    client?: string;
    type?: ContentType;
    status?: "all" | ContentStatus;
    batchMonth?: string;
    batchType?: ContentBatchType;
    individual?: boolean;
    search?: string;
  } = {},
): Promise<ContentActionResult<ContentListData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 50),
    });
    if (params.client) query.set("client", params.client);
    if (params.type) query.set("type", params.type);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.batchMonth) query.set("batchMonth", params.batchMonth);
    if (params.batchType) query.set("batchType", params.batchType);
    if (params.individual !== undefined) query.set("individual", String(params.individual));
    if (params.search?.trim()) query.set("q", params.search.trim());

    const response = await fetch(`${API}?${query}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch content.");

    const { data } = await response.json();
    const { items, summary, pagination } = data;
    return {
      ok: true,
      data: {
        items,
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

export async function getContentAction(id: string): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch content.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Creating pieces — which carries files — goes through the upload route
// (app/api/content/batch/route.ts), not a server action: server actions cap request
// bodies at 1MB, and the upload route streams straight to the backend instead.

// Details only (title, caption, fields, removeFiles…). New files go through the
// upload route for the same reason as above.
export async function updateContentAction(
  id: string,
  formData: FormData,
): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: authorised(accessToken),
      body: formData,
    });
    if (!response.ok) return failure(response, "Failed to update content.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// draft → pending_approval is the normal move (and revision_requested → pending_approval,
// once feedback has been addressed); what else a given role may do is decided by the backend.
export async function changeContentStatusAction(
  id: string,
  status: ContentStatus,
): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}/status`, {
      method: "PATCH",
      headers: authorised(accessToken, true),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return failure(response, "Failed to change the content status.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function deleteContentAction(id: string): Promise<ContentActionResult<null>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: authorised(accessToken),
    });
    if (!response.ok) return failure(response, "Failed to delete content.");

    revalidatePath(LIST_PATH);
    return { ok: true, data: null };
  } catch {
    return NETWORK_ERROR;
  }
}

// A team reply on the item's comment thread — unlike the client's, this doesn't
// move the status.
export async function addContentCommentAction(
  id: string,
  text: string,
): Promise<ContentActionResult<ContentItem>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}/comments`, {
      method: "POST",
      headers: authorised(accessToken, true),
      body: JSON.stringify({ text }),
    });
    if (!response.ok) return failure(response, "Failed to add comment.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}
