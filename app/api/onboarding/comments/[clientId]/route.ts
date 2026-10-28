import { forwardUpload } from "../../../content/forwardUpload";

// A team comment — text and attached images, videos or documents — on a step of a client's
// onboarding form → POST /onboarding/clients/:clientId/comments.
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!/^[0-9a-f]{24}$/i.test(clientId)) return Response.json({ success: false, message: "Client not found." }, { status: 404 });
  return forwardUpload(request, `/onboarding/clients/${clientId}/comments`, "POST", []);
}
