import { MAX_BYTES_PER_REQUEST, MAX_FILES_PER_REQUEST } from "./contentUi";

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

// Sends a change to one piece through the upload route (PATCH /content/:id), reporting
// progress (0–100) as the files go up. XMLHttpRequest rather than fetch, because fetch
// can't report upload progress.
export const patchPiece = <Body extends UploadResponse = UploadResponse>(id: string, form: FormData, onProgress: (percent: number) => void) =>
  new Promise<{ status: number; body: Body }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PATCH", `/api/content/${id}`);
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve({
        status: request.status,
        body: (request.response as Body | null) ?? ({ success: false, message: uploadFailureMessage(request.status) } as Body),
      });
    request.onerror = () => reject(new Error("Network error"));
    request.send(form);
  });

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
