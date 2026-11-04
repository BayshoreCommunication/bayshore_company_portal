import { auth } from "@/auth";
import { BACKEND_API_URL } from "@/lib/backend";

// A message to a client — its words, what it is about (`report`) and attached files — streamed on
// to the backend's POST /messages/:clientId. A route handler rather than a server action because
// actions cap request bodies at 1MB; this never holds the upload in memory.
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!/^[0-9a-f]{24}$/i.test(clientId)) return Response.json({ success: false, message: "Conversation not found." }, { status: 404 });

  const session = await auth();
  const accessToken = session?.accessToken;
  if (!accessToken) return Response.json({ success: false, message: "Your session has ended — sign in again." }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data") || !request.body) {
    return Response.json({ success: false, message: "Expected a multipart form upload." }, { status: 400 });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/messages/${clientId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
      body: request.body,
      // Required by Node's fetch to send a streamed body.
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    const body = await response.json().catch(() => ({ success: false, message: "The server sent an unexpected response." }));
    return Response.json(body, { status: response.status });
  } catch {
    return Response.json({ success: false, message: "Couldn't reach the server. Please try again." }, { status: 502 });
  }
}
