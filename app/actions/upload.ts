"use server";

import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// What the browser needs to send files straight to the backend (lib/sendToBackend.ts): its
// address and the signed-in user's access token. Being a server action, this request passes
// through proxy.ts first, which renews the token when it is near its end.
export async function uploadPassAction(): Promise<{ base: string; token: string } | null> {
  const session = await auth();
  return session?.accessToken ? { base: BACKEND_API_URL, token: session.accessToken } : null;
}
