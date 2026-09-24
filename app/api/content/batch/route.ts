import { forwardUpload } from "../forwardUpload";

// Uploads for the Add Content page → the backend's POST /content/batch.
export async function POST(request: Request) {
  return forwardUpload(request, "/content/batch", "POST", ["/content"]);
}
