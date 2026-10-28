"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// A short-lived ticket to hear live updates (backend: GET /messages/realtime-ticket → its
// Socket.io server), and where to connect: the backend's own address, unless the browser
// reaches it at another one (NEXT_PUBLIC_REALTIME_URL).
export async function getRealtimeTicketAction(): Promise<{ ticket: string; url: string } | null> {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) return null;
  try {
    const response = await fetch(`${BACKEND_API_URL}/messages/realtime-ticket`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return null;
    const { data } = (await response.json()) as { data: { ticket: string } };
    return { ticket: data.ticket, url: process.env.NEXT_PUBLIC_REALTIME_URL || new URL(BACKEND_API_URL).origin };
  } catch {
    return null;
  }
}
