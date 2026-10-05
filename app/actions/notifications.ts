"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/notifications`;

// Where notifications are listed in this portal; refreshed after one is read.
const LIST_PATH = "/notifications";

// Mirrors the backend's notification model (models/notification.model.ts).
// Staff are told what a client did on a piece of content; the content_sent, content_resubmitted
// and content_comment types go to clients, and are listed here only so the two portals share one type.
export type NotificationType =
  | "content_sent"
  | "content_resubmitted"
  | "content_comment"
  | "content_feedback"
  | "content_approved"
  | "content_caption_edited";

// Named NotificationItem because `Notification` is already the browser's own (desktop alerts).
export interface NotificationItem {
  _id: string;
  recipient: string;
  type: NotificationType;
  // The line shown in the bell, e.g. "Carter Injury Law asked for changes".
  title: string;
  // A second line: the piece's title, or the start of the comment.
  body?: string;
  // Where it opens — a path in this portal, e.g. "/content/<id>".
  link: string;
  actor?: string;
  // Who did it, as they were named at the time.
  actorName?: string;
  client?: string;
  content?: string;
  // How many pieces it covers — more than 1 when several were sent together.
  pieces: number;
  // Missing until it has been read.
  readAt?: string;
  createdAt: string;
}

export interface NotificationListData {
  items: NotificationItem[];
  // Every unread notification the signed-in person has — the number on the bell — whatever is listed.
  unread: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

interface NotificationActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  // HTTP status of a failed request, so callers can tell "not found" from other errors.
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

const authorised = (accessToken: string, json = false): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

// The signed-in person's own notifications, newest first.
export async function listNotificationsAction(
  params: {
    page?: number;
    limit?: number;
    // Only the ones not read yet.
    unread?: boolean;
  } = {},
): Promise<NotificationActionResult<NotificationListData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 20),
    });
    if (params.unread) query.set("unread", "true");

    const response = await fetch(`${API}?${query}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch notifications.");

    const { data } = await response.json();
    const { items, unread, pagination } = data;
    return {
      ok: true,
      data: {
        items,
        unread,
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

// Just the number on the bell — light enough to ask for often.
export async function countUnreadNotificationsAction(): Promise<NotificationActionResult<{ unread: number }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/unread-count`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch the unread count.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Marks one notification as read; answers with it and the unread count afterwards.
export async function markNotificationReadAction(
  id: string,
): Promise<NotificationActionResult<{ notification: NotificationItem; unread: number }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}/read`, {
      method: "PATCH",
      headers: authorised(accessToken),
    });
    if (!response.ok) return failure(response, "Failed to mark the notification as read.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// Marks everything as read — or, given `ids`, just those (what the bell has just shown, so
// anything not seen yet stays unread). `updated` says how many were unread; `unread` how many still are.
export async function markNotificationsReadAction(
  ids?: string[],
): Promise<NotificationActionResult<{ updated: number; unread: number }>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/read-all`, {
      method: "PATCH",
      headers: authorised(accessToken, Boolean(ids)),
      body: ids ? JSON.stringify({ ids }) : undefined,
    });
    if (!response.ok) return failure(response, "Failed to mark notifications as read.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}
