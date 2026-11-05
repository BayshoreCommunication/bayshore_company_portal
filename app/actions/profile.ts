"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// The signed-in team member's own profile (backend: GET/PATCH /users/me).

export interface MyProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  status?: string;
  phone?: string;
  companyName?: string;
  designation?: string;
  department?: string;
  responsibilities?: string;
  address?: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export type ProfileInput = Partial<Pick<MyProfile, "fullName" | "email" | "phone" | "companyName" | "designation" | "department" | "responsibilities" | "address">>;

const token = async () => (await auth())?.accessToken;

export async function getMyProfileAction(): Promise<MyProfile | null> {
  const accessToken = await token();
  if (!accessToken) return null;
  try {
    const response = await fetch(`${BACKEND_API_URL}/users/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    if (!response.ok) return null;
    return ((await response.json()) as { data: MyProfile }).data;
  } catch {
    return null;
  }
}

export async function updateMyProfileAction(input: ProfileInput): Promise<{ ok: true; data: MyProfile } | { ok: false; error: string }> {
  const accessToken = await token();
  if (!accessToken) return { ok: false, error: "Your session has ended — sign in again." };
  try {
    const response = await fetch(`${BACKEND_API_URL}/users/me`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = Array.isArray(body?.errors) && body.errors.length ? body.errors.join(" ") : body?.message;
      return { ok: false, error: typeof detail === "string" ? detail : "Couldn't save your profile." };
    }
    revalidatePath("/settings");
    return { ok: true, data: body.data as MyProfile };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
