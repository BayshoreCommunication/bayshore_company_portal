"use server";

import { auth } from "@/auth";

// The task manager's team overview, shown on the settings page and used by the project assignee
// picker: each member with this month's KPI score. Fetched server-side so the key never reaches
// the browser. The URL and key come from the environment (TASKMANAGER_URL, TASKMANAGER_KEY).
const BASE = (process.env.TASKMANAGER_URL ?? "https://os.bayshorecommunication.com").replace(/\/+$/, "");
const KEY = process.env.TASKMANAGER_KEY ?? "";

export type TeamMember = { id: string; name: string; role: string; avatar: string | null; score: number };
export type TeamOverviewResult = { ok: true; members: TeamMember[] } | { ok: false; error: string };

export async function getTeamOverviewAction(): Promise<TeamOverviewResult> {
  // Staff only — this is the company portal, but guard anyway.
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Please sign in again." };

  try {
    const response = await fetch(`${BASE}/api/team-overview?key=${encodeURIComponent(KEY)}`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, error: response.status === 404 ? "Couldn't reach the team overview — is it deployed on the task manager?" : `Team overview request failed (${response.status}).` };
    }
    const data = (await response.json()) as { members: TeamMember[] };
    return { ok: true, members: data.members ?? [] };
  } catch {
    return { ok: false, error: "Couldn't reach the task manager. Please try again." };
  }
}
