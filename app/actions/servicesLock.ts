"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";
import { SERVICES_PASS_COOKIE as COOKIE, servicesPass } from "@/lib/servicesPass";

// Services open only with a security code (backend: utils/serviceLock.ts). The right code gets a
// pass for a while, kept in a cookie only the server reads, and sent with every services request.

const API = `${BACKEND_API_URL}/services/unlock`;
export type ServicesLock = { available: boolean; unlocked: boolean };

// Whether this person can open Services with a code, and whether they already have.
export async function getServicesLockAction(): Promise<ServicesLock> {
  const session = await auth();
  if (!session?.accessToken) return { available: false, unlocked: false };
  const pass = await servicesPass();
  try {
    const response = await fetch(API, {
      headers: { Authorization: `Bearer ${session.accessToken}`, ...(pass ? { "X-Services-Unlock": pass } : {}) },
      cache: "no-store",
    });
    if (!response.ok) return { available: false, unlocked: false };
    const { data } = await response.json();
    return { available: Boolean(data?.available), unlocked: Boolean(data?.unlocked) };
  } catch {
    return { available: false, unlocked: false };
  }
}

export async function unlockServicesAction(code: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.accessToken) return { ok: false, error: "Not authenticated." };
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.data?.token) return { ok: false, error: body?.message || "Couldn't check the code. Please try again." };
    const expires = new Date(body.data.expiresAt);
    (await cookies()).set(COOKIE, body.data.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

// Closes Services again on this browser.
export async function lockServicesAction() {
  (await cookies()).delete(COOKIE);
}
