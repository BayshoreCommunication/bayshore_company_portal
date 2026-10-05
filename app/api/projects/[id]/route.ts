import { forwardUpload } from "../../content/forwardUpload";

// Saves the Edit Project page when it adds files (details, files to remove, new
// files) → PATCH /projects/:id. Without new files, updateProjectAction does the same.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{24}$/i.test(id)) {
    return Response.json({ success: false, message: "Project not found." }, { status: 404 });
  }

  return forwardUpload(request, `/projects/${id}`, "PATCH", ["/projects", `/projects/${id}/edit`]);
}
