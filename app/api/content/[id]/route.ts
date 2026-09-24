import { contentNotFound, forwardUpload, isContentId } from "../forwardUpload";

// Saves the Edit Content page (details, files to remove, new files) → PATCH /content/:id.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isContentId(id)) return contentNotFound();
  return forwardUpload(request, `/content/${id}`, "PATCH", ["/content", `/content/${id}`]);
}
