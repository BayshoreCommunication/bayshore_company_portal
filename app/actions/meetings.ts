"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The team's meetings (backend: /meetings). A client opens a meeting from their portal and picks
// the staff on it; here each staff member sees the meetings they're on, and a super user (admin)
// sees them all.

export interface MeetingPerson {
  email: string;
  name: string;
  role: string;
  avatar: string | null;
}

export interface TeamMeeting {
  _id: string;
  client: { _id: string; companyName: string; contactName?: string } | null;
  title: string;
  notes: string;
  start: string;
  end: string;
  timeZone: string;
  status: "scheduled" | "cancelled";
  meetLink: string | null;
  createdBy: { _id: string; fullName: string } | null;
  participants: MeetingPerson[];
  createdAt: string;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const token = async () => (await auth())?.accessToken;

export async function listMeetingsAction(): Promise<Result<{ meetings: TeamMeeting[] }>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Your session has ended — sign in again." };
  try {
    const response = await fetch(`${BACKEND_API_URL}/meetings`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: typeof body?.message === "string" ? body.message : "Couldn't load meetings." };
    return { ok: true, data: body.data as { meetings: TeamMeeting[] } };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function cancelMeetingAction(id: string): Promise<Result<TeamMeeting>> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Your session has ended — sign in again." };
  try {
    const response = await fetch(`${BACKEND_API_URL}/meetings/${id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: typeof body?.message === "string" ? body.message : "Couldn't cancel the meeting." };
    revalidatePath("/meetings");
    return { ok: true, data: body.data as TeamMeeting };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
