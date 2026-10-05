import { forwardUpload } from "../content/forwardUpload";

// Opens a project with attached files (the Add Project page) → POST /projects.
// Without files, createProjectAction (app/actions/projects.ts) does the same.
export async function POST(request: Request) {
  return forwardUpload(request, "/projects", "POST", ["/projects"]);
}
