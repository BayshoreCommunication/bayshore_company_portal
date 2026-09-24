import { contentNotFound, forwardUpload, isContentId } from "../../forwardUpload";

// A team comment with attached images, videos or documents → POST /content/:id/comments.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isContentId(id)) return contentNotFound();
  return forwardUpload(request, `/content/${id}/comments`, "POST", [`/content/${id}`]);
}
