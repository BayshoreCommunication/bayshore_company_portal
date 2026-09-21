"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { auth, signIn, signOut } from "@/auth";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";

export type SignInState = { error?: string } | undefined;

export async function signInAction(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const identifier = formData.get("identifier");
  const password = formData.get("password");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password) {
    return { error: "Email/phone and password are required." };
  }

  try {
    await signIn("credentials", { identifier, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "backend-unreachable") {
      return { error: "Could not reach the server. Please try again in a moment." };
    }
    if (error instanceof CredentialsSignin && error.code === "account-not-active") {
      return { error: "Your account is not active. Please contact your administrator." };
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email/phone or password." };
    }
    throw error;
  }
}

export async function signOutAction() {
  const session = await auth();

  if (session?.refreshToken) {
    // Best-effort: revoke the refresh token server-side so it can't be used
    // again even if it somehow leaked. Signing out proceeds regardless.
    try {
      await fetch(`${BACKEND_API_URL}/auth/signout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    } catch {
      // Backend unreachable — the Auth.js session is still cleared below,
      // and the refresh token will simply expire on its own later.
    }
  }

  await signOut({ redirectTo: "/sign-in" });
}
