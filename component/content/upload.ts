import { MAX_BYTES_PER_REQUEST, MAX_FILES_PER_REQUEST } from "./contentUi";
import { sendToBackend } from "@/lib/sendToBackend";

// Sending a piece's files to the backend. One request carries a limited number of files and
// bytes, so a long list goes up in turns — however many files a piece has.

export type UploadResponse = { success: boolean; message: string; errors?: string[] };

// What to say when the answer isn't the API's (a proxy or host stopped the upload on the way).
export const uploadFailureMessage = (status: number) =>
  status === 413
    ? "These files are too big to send in one go. Try saving fewer files at a time, or smaller ones."
    : status === 502 || status === 503 || status === 504 || status === 0
      ? "The upload took too long or the server didn't answer. Check your connection and save again — anything already saved stays."
      : status === 401
        ? "Your session has ended — refresh the page and sign in again, then save."
        : `The upload didn't go through (error ${status}). Please save again.`;

// The files, split into lots one request can carry: so many files, so many bytes in each.
// A file bigger than a lot goes up on its own.
export const sliceFiles = <T extends { size: number }>(files: T[]): T[][] => {
  const lots: T[][] = [];
  let bytes = 0;
  for (const file of files) {
    const lot = lots[lots.length - 1];
    if (!lot || lot.length >= MAX_FILES_PER_REQUEST || bytes + file.size > MAX_BYTES_PER_REQUEST) {
      lots.push([file]);
      bytes = 0;
    } else lot.push(file);
    bytes += file.size;
  }
  return lots;
};

// Sends a piece's form straight to the backend (lib/sendToBackend.ts), reporting progress
// (0–100) as the files go up. When the answer isn't the API's (a proxy stopped it on the way),
// says what most likely happened.
export const sendContent = async <Body extends UploadResponse = UploadResponse>(
  method: "POST" | "PATCH",
  path: string,
  form: FormData,
  onProgress: (percent: number) => void,
  refresh: string[],
) => {
  const { status, body } = await sendToBackend<Body>(method, path, form, { onProgress, refresh });
  return { status, body: body ?? ({ success: false, message: uploadFailureMessage(status) } as Body) };
};

// Sends a change to one piece (PATCH /content/:id).
export const patchPiece = <Body extends UploadResponse = UploadResponse>(id: string, form: FormData, onProgress: (percent: number) => void) =>
  sendContent<Body>("PATCH", `/content/${id}`, form, onProgress, ["/content", `/content/${id}`]);

// Adds more files to a piece whose first lot is already saved: they join that upload — the
// same version, right after its files. `onSent` hears how many bytes each lot was as it
// lands, `onProgress` how far the lot in hand has got. Returns what went wrong, if anything,
// and the lots that didn't go up.
export const extendPiece = async <T extends { size: number; file?: File; name: string }>(
  id: string,
  lots: T[][],
  onProgress: (lotBytes: number, percent: number) => void,
  onSent: (lotBytes: number) => void,
): Promise<{ problem: string; left: T[][] } | null> => {
  for (const [at, lot] of lots.entries()) {
    const form = new FormData();
    form.set("extend", "true");
    for (const upload of lot) if (upload.file) form.append("files", upload.file, upload.name);
    const bytes = lot.reduce((sum, upload) => sum + upload.size, 0);
    try {
      const { status, body } = await patchPiece(id, form, (percent) => onProgress(bytes, percent));
      if (status < 200 || status >= 300) return { problem: [body.message, ...(body.errors ?? [])].filter(Boolean).join(" — "), left: lots.slice(at) };
    } catch {
      return { problem: "Couldn't reach the server. Check your connection and try again.", left: lots.slice(at) };
    }
    onSent(bytes);
  }
  return null;
};
