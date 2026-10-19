"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/dashboard`;

// Mirrors backend/controllers/dashboard.controller.ts. Money is in whole dollars.

// A figure now, and at the same point last month.
export interface DashboardFigure {
  value: number;
  previous: number;
}

export type DashboardReviewKind = "report" | "content" | "reel" | "project";
export type DashboardReviewStatus = "review" | "revision" | "request";

export interface DashboardOverviewData {
  // "YYYY-MM", oldest first; the last is this month. The charts' arrays line up with it.
  months: string[];
  cards: {
    activeClients: DashboardFigure;
    leads: DashboardFigure;
    collected: DashboardFigure;
    unpaid: DashboardFigure;
  };
  revenue: { collected: number[]; unpaid: number[] };
  newClients: {
    byMonth: number[];
    thisMonth: DashboardFigure;
    active: number;
    onboarding: number;
    closed: number;
  };
  unpaid: {
    clients: { client: string; companyName: string; amount: number; waitingDays: number; declined: number }[];
    others: { count: number; amount: number } | null;
    total: number;
    declined: number;
    orders: number;
    clientCount: number;
  };
  reviews: {
    items: { kind: DashboardReviewKind; id: string; title: string; client: string; status: DashboardReviewStatus }[];
    total: number;
    counts: { reports: number; content: number; projects: number };
  };
  meetings: {
    items: { id: string; title: string; startsAt: string; location?: string; client: string }[];
    total: number;
  };
}

export type DashboardActionResult = { ok: true; data: DashboardOverviewData } | { ok: false; error: string };

export async function getDashboardOverviewAction(): Promise<DashboardActionResult> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Not authenticated." };

  try {
    const response = await fetch(`${API}/overview`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, error: typeof body?.message === "string" ? body.message : "Failed to load the dashboard." };
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
