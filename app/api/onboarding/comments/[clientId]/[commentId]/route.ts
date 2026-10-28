import { forwardUpload } from "../../../../content/forwardUpload";

const isId = (id: string) => /^[0-9a-f]{24}$/i.test(id);

// A team reply — text and attached images, videos or documents — to a client's comment on their
// onboarding form → POST /onboarding/clients/:clientId/comments/:commentId/replies.
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string; commentId: string }> }) {
  const { clientId, commentId } = await params;
  if (!isId(clientId) || !isId(commentId)) return Response.json({ success: false, message: "Comment not found." }, { status: 404 });
  return forwardUpload(request, `/onboarding/clients/${clientId}/comments/${commentId}/replies`, "POST", []);
}
