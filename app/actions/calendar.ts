"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/calendar`;

// Mirrors backend/controllers/calendar.controller.ts.

export interface GoogleAccount {
  _id: string;
  email: string;
  name?: string;
  connectedBy?: { _id: string; fullName: string } | null;
  // Google no longer accepts it: connect it again.
  broken: boolean;
  // Connected with leave to add events: clients' calls can be booked on it.
  canBook: boolean;
  booking?: BookingHours;
  createdAt: string;
}

// When clients may book their onboarding call on a calendar, in its own time zone.
export interface BookingHours {
  enabled: boolean;
  timeZone: string;
  // 0 = Sunday … 6 = Saturday.
  days: number[];
  start: string;
  end: string;
  duration: number;
  notice: number;
  ahead: number;
}

export interface GoogleAccounts {
  // False until Google sign-in is set up on the server.
  configured: boolean;
  canConnect: boolean;
  accounts: GoogleAccount[];
}

export interface CalendarGuest {
  email: string;
  name?: string;
  // Google's: "accepted", "declined", "tentative", "needsAction".
  status?: string;
  organizer: boolean;
}

export interface CalendarEvent {
  id: string;
  accountId: string;
  accountEmail: string;
  title: string;
  // A date and time; for an all-day event a date ("2026-11-04"), and `end` the day after it ends.
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  description?: string;
  meetLink?: string;
  link?: string;
  organizer?: string;
  guests: CalendarGuest[];
  client: { _id: string; companyName: string } | null;
  // As the team marked it, once it has happened.
  outcome: MeetingOutcome | null;
}

export type MeetingOutcome = "done" | "missed";

export interface CalendarEvents {
  events: CalendarEvent[];
  // Accounts that couldn't be read this time. `lost`: it must be connected again.
  failed: { _id: string; email: string; lost: boolean; reason?: string }[];
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, init: RequestInit, fallback: string): Promise<Result<T>> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Not authenticated." };
  try {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${session.accessToken}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const details = Array.isArray(body?.errors) ? (body.errors as string[]) : [];
      return { ok: false, error: details.length ? details.join(" ") : typeof body?.message === "string" ? body.message : fallback };
    }
    return { ok: true, data: body?.data as T };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function getGoogleAccountsAction() {
  return call<GoogleAccounts>("/google", {}, "Couldn't load the connected Google accounts.");
}

// Google's sign-in page, to send the browser to.
export async function connectGoogleAction() {
  return call<{ url: string }>("/google/connect", {}, "Couldn't start connecting Google.");
}

export async function disconnectGoogleAction(id: string) {
  return call<null>(`/google/${encodeURIComponent(id)}`, { method: "DELETE" }, "Couldn't disconnect that account.");
}

export async function listCalendarEventsAction(from: string, to: string) {
  return call<CalendarEvents>(`/events?${new URLSearchParams({ from, to })}`, {}, "Couldn't load the calendar.");
}

export async function updateBookingHoursAction(id: string, hours: Partial<BookingHours>) {
  return call<BookingHours>(`/google/${encodeURIComponent(id)}/booking`, { method: "PATCH", body: JSON.stringify(hours) }, "Couldn't save the booking hours.");
}

// How a meeting went — "done", "missed", or null to take the mark off.
export async function markMeetingAction(accountId: string, eventId: string, outcome: MeetingOutcome | null) {
  return call<{ outcome: MeetingOutcome | null }>(
    `/google/${encodeURIComponent(accountId)}/events/${encodeURIComponent(eventId)}/outcome`,
    { method: "PUT", body: JSON.stringify({ outcome }) },
    "Couldn't save that."
  );
}
