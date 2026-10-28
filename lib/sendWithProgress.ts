// Sends a form, reporting how much of it has gone up (0–100) as it does — fetch can't report an
// upload's progress, XHR can. For attachments, so it can be seen that they are going, and went.
export const sendWithProgress = (url: string, form: FormData, onProgress: (percent: number) => void) =>
  new Promise<{ ok: boolean; body: { data?: unknown; message?: string } | null }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onload = () => {
      onProgress(100);
      let body = null;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        // Not JSON: the caller says it failed.
      }
      resolve({ ok: request.status >= 200 && request.status < 300, body });
    };
    request.onerror = () => reject(new Error("network"));
    request.send(form);
  });
