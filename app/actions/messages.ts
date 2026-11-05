"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";
import type { ChatMessage, MessagePage } from "@/component/messages/chat";

// The clients' conversations with the team (backend: /messages). Sending goes from the browser
// straight to the backend (lib/sendToBackend.ts), since a message can carry files.

const token = async () => (await auth())?.accessToken;

const get = async <T,>(path: string): Promise<T | null> => {
  const accessToken = await token();
  if (!accessToken) return null;
  try {
    const response = await fetch(`${BACKEND_API_URL}${path}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return null;
    return ((await response.json()) as { data: T }).data;
  } catch {
    return null;
  }
};

export interface Conversation {
  client: { _id: string; companyName?: string; contactName?: string };
  last: ChatMessage;
  unread: number;
}

// The conversations of the clients the caller can see, most recently active first.
export async function listConversationsAction(): Promise<{ items: Conversation[]; unread: number } | null> {
  return get("/messages/conversations?limit=100");
}

// A page of one client's conversation, oldest first: the newest, or the one before `before`.
// `report`: only the comments on that report.
export async function listClientMessagesAction(clientId: string, params: { before?: string; report?: string } = {}): Promise<MessagePage | null> {
  if (!/^[0-9a-f]{24}$/i.test(clientId)) return null;
  const query = new URLSearchParams({ limit: "40" });
  if (params.before) query.set("before", params.before);
  if (params.report) query.set("report", params.report);
  return get(`/messages/${clientId}?${query}`);
}

// Everything in a client's conversation has been seen by the caller.
export async function markClientMessagesReadAction(clientId: string): Promise<boolean> {
  const accessToken = await token();
  if (!accessToken || !/^[0-9a-f]{24}$/i.test(clientId)) return false;
  try {
    const response = await fetch(`${BACKEND_API_URL}/messages/${clientId}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${accessToken}` } });
    return response.ok;
  } catch {
    return false;
  }
}

// How many messages from clients are unread, for the sidebar.
export async function countUnreadMessagesAction(): Promise<number> {
  return (await get<{ unread: number }>("/messages/unread-count"))?.unread ?? 0;
}
