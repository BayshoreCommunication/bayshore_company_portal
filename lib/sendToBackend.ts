import { uploadPassAction } from "@/app/actions/upload";

// Sends a form — files and all — from the browser straight to the backend, not through this
// app's own routes: the host the portal runs on (Vercel) turns away any request over 4.5MB, far
// below the videos people upload. The backend's address and the user's access token come from a
// server action; the form then goes up with XMLHttpRequest, which (unlike fetch) reports progress.
// `refresh` lists the pages to rebuild once it's saved.

export type Sent<Body> = { status: number; body: Body | null };

const SESSION_ENDED = { success: false, message: "Your session has ended — refresh the page and sign in again." };

export const sendToBackend = async <Body = { success?: boolean; message?: string; data?: unknown; errors?: string[] }>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: FormData | Record<string, unknown>,
  { onProgress, refresh = [] }: { onProgress?: (percent: number) => void; refresh?: string[] } = {},
): Promise<Sent<Body>> => {
  const pass = await uploadPassAction();
  if (!pass) return { status: 401, body: SESSION_ENDED as Body };

  const sent = await new Promise<Sent<Body>>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, `${pass.base}${path}`);
    request.setRequestHeader("Authorization", `Bearer ${pass.token}`);
    const isForm = body instanceof FormData;
    if (!isForm) request.setRequestHeader("Content-Type", "application/json");
    request.responseType = "json";
    if (onProgress) {
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
      };
    }
    request.onload = () => resolve({ status: request.status, body: (request.response as Body | null) ?? null });
    request.onerror = () => reject(new Error("Network error"));
    request.send(isForm ? body : JSON.stringify(body));
  });

  if (sent.status >= 200 && sent.status < 300 && refresh.length) {
    await fetch("/api/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pages: refresh }) }).catch(() => undefined);
  }
  return sent;
};
