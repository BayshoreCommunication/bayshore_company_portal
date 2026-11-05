import { sendToBackend } from "./sendToBackend";

// Sends a form straight to the backend (`path`, e.g. "/onboarding/clients/…/comments"),
// reporting how much of it has gone up (0–100) as it does. For attachments, so it can be seen
// that they are going, and went.
export const sendWithProgress = async (path: string, form: FormData, onProgress: (percent: number) => void) => {
  const { status, body } = await sendToBackend<{ data?: unknown; message?: string }>("POST", path, form, {
    onProgress: (percent) => onProgress(Math.min(99, percent)),
  });
  onProgress(100);
  return { ok: status >= 200 && status < 300, body };
};
