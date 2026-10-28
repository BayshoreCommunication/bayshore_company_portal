import { forwardUpload } from "../../../../content/forwardUpload";

const KINDS = ["logo", "logoStyle", "professionalPhotos", "businessPhotos", "videos"];

// The team uploading files for a client's onboarding (their logo, style references, photos or
// videos) → POST /onboarding/clients/:clientId/media/:kind.
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string; kind: string }> }) {
  const { clientId, kind } = await params;
  if (!/^[0-9a-f]{24}$/i.test(clientId) || !KINDS.includes(kind)) return Response.json({ success: false, message: "Not found." }, { status: 404 });
  return forwardUpload(request, `/onboarding/clients/${clientId}/media/${kind}`, "POST", []);
}
