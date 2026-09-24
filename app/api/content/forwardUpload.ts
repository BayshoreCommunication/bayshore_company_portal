import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000/api/v1";

// Streams a multipart upload from the browser on to the backend with the signed-in
// user's token — never buffered in full. Upload routes use this instead of server
// actions, which cap request bodies at 1MB (and the proxy, which skips /api, would
// buffer them). `refresh` lists the pages to revalidate after a success.
export async function forwardUpload(request: Request, path: string, method: "POST" | "PATCH", refresh: string[]) {
  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) {
    return Response.json({ success: false, message: "Your session has ended — sign in again." }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data") || !request.body) {
    return Response.json({ success: false, message: "Expected a multipart form upload." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
      body: request.body,
      // Required by Node's fetch to send a streamed body.
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const body = await response.json().catch(() => ({ success: false, message: "The server sent an unexpected response." }));
    if (response.ok) refresh.forEach((page) => revalidatePath(page));
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ success: false, message: "Couldn't reach the server. Please try again." }, { status: 502 });
  }
}

export const isContentId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

export const contentNotFound = () => Response.json({ success: false, message: "Content not found." }, { status: 404 });
