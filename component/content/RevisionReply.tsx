"use client";

import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { Loader2, MessageSquareText, Play, Plus, RotateCcw, SendHorizontal, Tag, X } from "lucide-react";
import { changeContentStatusAction, type ContentFile, type ContentItem, type ContentRevision } from "@/app/actions/content";
import { btnDraft, btnPrimary } from "@/component/shared/ui";
import { postComment } from "./CommentThread";
import { MEDIA_ICON, ThumbnailField, toThumbnail, type Upload } from "./contentForm";
import { extendPiece, sliceFiles } from "./upload";
import { CONTENT_KINDS, filesOf, mediaOf, uploadHint, uploadProblem } from "./contentUi";

// The backend's limits (models/content.model.ts, validators/content.validator.ts).
const CAPTION_MAX = 2000;
const FEEDBACK_MAX = 1000;
const TAGS_MAX = 20;
const TAG_MAX = 50;

// What each kind of file is called on its "add" button, and what its picker offers.
const MEDIA_ADD = {
  image: { label: "Add image", accept: "image/*" },
  video: { label: "Add video / reel", accept: "video/*" },
  doc: { label: "Add article / document", accept: ".doc,.docx,.pdf,.txt,.rtf,.odt" },
} as const;

type Picked = { id: string; file: File; url: string };
type SaveResponse = { success: boolean; message: string; errors?: string[] };

const iconText = "inline-flex items-center gap-1.5";
const fieldClass =
  "block w-full rounded-md border border-[#cbd6d0] bg-white px-3 py-2.5 text-[12.5px] leading-normal text-[#17242f] outline-none wrap-anywhere placeholder:text-[#9aacb8] focus:border-[#2563eb]";
const labelClass = "mb-1.5 flex items-baseline justify-between gap-2 text-[12px] font-bold text-[#17242f]";

// Sends the piece's changes to the upload route, reporting progress (0–100) as new files go up.
const savePiece = (id: string, form: FormData, onProgress: (percent: number) => void) =>
  new Promise<{ status: number; body: SaveResponse }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PATCH", `/api/content/${id}`);
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve({
        status: request.status,
        body: (request.response as SaveResponse | null) ?? { success: false, message: "The server sent an unexpected response." },
      });
    request.onerror = () => reject(new Error("Network error"));
    request.send(form);
  });

// A file on the piece — one it already has, or one just picked — as a small tile.
const FileTile = ({ media, url, name, children }: { media: ContentFile["media"]; url: string; name: string; children: ReactNode }) => {
  const Icon = MEDIA_ICON[media];
  return (
    <div className="relative w-24">
      <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-[#dbe3de] bg-[#eef3ef]">
        {media === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={name} className="h-full w-full object-cover" />
        ) : media === "video" ? (
          <>
            <video src={url} muted preload="metadata" className="h-full w-full bg-black object-cover" />
            <span className="absolute inset-0 flex items-center justify-center text-white">
              <Play size={18} strokeWidth={2} fill="currentColor" />
            </span>
          </>
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-white text-[#2563eb]">
            <Icon size={22} strokeWidth={1.75} />
            <span className="text-[9px] font-bold">{name.split(".").pop()?.toUpperCase()}</span>
          </span>
        )}
      </div>
      <div className="mt-1 truncate text-[10.5px] font-semibold text-[#556977]">{name}</div>
      {children}
    </div>
  );
};

// The team's answer to the revision under way. Under the revision there is one button,
// "Revision feedback"; it opens a dialog with the whole job in it: what the client asked for,
// the piece's own files to replace — only the kind this piece takes: images for an image
// post, a video for a reel, a document for an article; what they replace stays with the
// piece as its previous version, shown in yellow — its caption and tags to edit, and
// room to say what changed. It is sent as feedback, leaving the piece in revision, or the
// piece goes back for the client's approval as well. Either way the piece is updated first,
// and what was said is kept with the revision for both portals to show.
const RevisionReply = ({
  item,
  clientName,
  revision,
  onDone,
}: {
  item: ContentItem;
  clientName: string;
  // The revision being answered, for what the client asked.
  revision?: ContentRevision;
  onDone: () => void;
}) => {
  const spec = CONTENT_KINDS[item.type] ?? CONTENT_KINDS.image;
  const allowLink = Boolean(spec.linkPlaceholder);
  const current = filesOf(item);

  const [open, setOpen] = useState(false);
  // What was decided, file by file, about the ones the piece has now: keep it in the post, or
  // replace it. Left undecided, a file is replaced as soon as new ones are added — the new
  // files are the revised version — and kept otherwise.
  const [choice, setChoice] = useState<Record<string, "keep" | "replace">>({});
  const [added, setAdded] = useState<Picked[]>([]);
  // The video's cover: the stored one, a new one picked here, or none.
  const stored = item.videoThumbnail;
  const storedThumbnail: Upload | null = stored ? { name: stored.name, size: stored.size, url: stored.url, media: "image", mime: stored.mimeType } : null;
  const [thumbnail, setThumbnail] = useState<Upload | null>(storedThumbnail);
  const [link, setLink] = useState(item.link ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [tags, setTags] = useState<string[]>(item.tags);
  const [entry, setEntry] = useState("");
  const [feedback, setFeedback] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // Which button was pressed, so only that one shows the spinner.
  const [action, setAction] = useState<"feedback" | "resubmit" | null>(null);
  const busy = action !== null;

  // Opening it starts from the piece as it stands now.
  const start = () => {
    added.forEach((file) => URL.revokeObjectURL(file.url));
    setChoice({});
    setAdded([]);
    setThumbnail(storedThumbnail);
    setLink(item.link ?? "");
    setCaption(item.caption ?? "");
    setTags(item.tags);
    setEntry("");
    setFeedback("");
    setOpen(true);
  };

  // Free preview URLs when files leave the dialog or the page closes.
  const addedRef = useRef(added);
  useEffect(() => {
    addedRef.current = added;
  }, [added]);
  useEffect(() => () => addedRef.current.forEach((file) => URL.revokeObjectURL(file.url)), []);

  const replacing = (file: ContentFile) => (choice[file.url] ?? (added.length > 0 ? "replace" : "keep")) === "replace";
  const kept = current.filter((file) => !replacing(file));
  // Replaced files leave the post, and stay with the piece as its previous version.
  const removed = current.filter(replacing).map((file) => file.url);
  const count = kept.length + added.length;

  const addFiles = (files: File[]) => {
    const wrong = files.filter((file) => !spec.media.includes(mediaOf(file)));
    const usable = files.filter((file) => spec.media.includes(mediaOf(file)));
    const problems = usable.map(uploadProblem).filter(Boolean);
    const allowed = usable.filter((file) => !uploadProblem(file));
    if (wrong.length) toast.error(`${spec.label} takes ${spec.media.join(" or ")} files only — ${wrong.length} skipped.`);
    if (problems.length) toast.error(`${problems.join("; ")} — skipped.`);
    const picked = allowed.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, url: URL.createObjectURL(file) }));
    if (picked.length) setAdded((list) => [...list, ...picked]);
  };

  // A new cover for the video. Its preview URL is freed with the page.
  const thumbnailUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = thumbnailUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const pickThumbnail = (file: File) => {
    const picked = toThumbnail(file);
    if ("problem" in picked) return void toast.error(picked.problem);
    thumbnailUrls.current.push(picked.upload.url);
    setThumbnail(picked.upload);
  };

  const unpick = (id: string) =>
    setAdded((list) => {
      const gone = list.find((file) => file.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return list.filter((file) => file.id !== id);
    });

  // Adds what is typed in the tag box; returns the list as it then stands, or null if it can't be added.
  const withEntry = (list: string[]) => {
    const tag = entry.trim();
    if (!tag || list.includes(tag)) return list;
    if (tag.length > TAG_MAX) {
      toast.error(`A tag can be at most ${TAG_MAX} characters.`);
      return null;
    }
    if (list.length >= TAGS_MAX) {
      toast.error(`Up to ${TAGS_MAX} tags.`);
      return null;
    }
    return [...list, tag];
  };
  const addTag = () => {
    const next = withEntry(tags);
    if (!next) return;
    setTags(next);
    setEntry("");
  };
  const onTagKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    } else if (event.key === "Backspace" && !entry && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  // What has been changed on the piece itself, in words — for the save, and for the note
  // that goes to the client when nothing was typed.
  const pendingTags = entry.trim() && !tags.includes(entry.trim()) ? [...tags, entry.trim()] : tags;
  const thumbnailChanged = (thumbnail?.url ?? "") !== (storedThumbnail?.url ?? "");
  const changes = [
    removed.length || added.length ? "files" : null,
    thumbnailChanged ? "thumbnail" : null,
    allowLink && link.trim() !== (item.link ?? "") ? "link" : null,
    caption.trim() !== (item.caption ?? "") ? spec.captionLabel.toLowerCase() : null,
    pendingTags.join("\n") !== item.tags.join("\n") ? "tags" : null,
  ].filter((change): change is string => change !== null);
  const nothing = changes.length === 0 && !feedback.trim();

  // Not while something is on its way.
  const close = () => {
    if (!busy) setOpen(false);
  };

  const send = async (resubmit: boolean) => {
    if (busy || (nothing && !resubmit)) return;
    const finalTags = withEntry(tags);
    if (!finalTags) return;
    if (count < spec.minFiles && !(allowLink && link.trim())) {
      toast.error(`${spec.label} needs at least ${spec.minFiles} file${spec.minFiles === 1 ? "" : "s"}${allowLink ? " or a link" : ""}.`);
      return;
    }

    setAction(resubmit ? "resubmit" : "feedback");
    try {
      // 1. The piece itself: new files, dropped files, link, caption, tags.
      if (changes.length) {
        const form = new FormData();
        form.set("caption", caption.trim());
        form.set("tags", JSON.stringify(finalTags));
        if (allowLink) form.set("link", link.trim());
        if (removed.length) form.set("removeFiles", JSON.stringify(removed));
        // New files replace whatever the piece has, unless it is named here.
        form.set("keepFiles", JSON.stringify(kept.map((file) => file.url)));
        // A long list of new files goes up in turns: the first lot with the changes, the rest after.
        const [head = [], ...rest] = sliceFiles(added.map(({ file }) => ({ file, name: file.name, size: file.size })));
        for (const upload of head) form.append("files", upload.file, upload.name);
        if (thumbnail?.file) form.append("thumbnail", thumbnail.file, thumbnail.name);
        else if (thumbnailChanged) form.set("removeThumbnail", "true");
        const headBytes = head.reduce((sum, upload) => sum + upload.size, 0) + (thumbnail?.file?.size ?? 0);
        const totalBytes = Math.max(1, headBytes + rest.flat().reduce((sum, upload) => sum + upload.size, 0));
        let sentBytes = 0;
        const showProgress = (bytes: number, percent: number) => setProgress(Math.round(((sentBytes + (bytes * percent) / 100) / totalBytes) * 100));
        if (added.length || thumbnail?.file) setProgress(0);
        const { status, body } = await savePiece(item._id, form, (percent) => showProgress(headBytes, percent));
        if (status < 200 || status >= 300) {
          setProgress(null);
          toast.error([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — ") || "Couldn't save the changes.");
          return;
        }
        sentBytes = headBytes;
        const failed = await extendPiece(item._id, rest, showProgress, (bytes) => {
          sentBytes += bytes;
        });
        setProgress(null);
        if (failed) {
          toast.error(`The piece was saved, but ${failed.left.flat().length} of the new files didn't upload: ${failed.problem} Add them again.`);
          onDone();
          return;
        }
      }

      // 2. What to tell the client: what was typed, or — with nothing typed — what was changed.
      const words = feedback.trim() || (changes.length ? `Updated the ${changes.join(", ")}.` : "");
      if (words) {
        const form = new FormData();
        form.set("kind", "revision");
        if (resubmit) form.set("resubmit", "true");
        form.set("text", words);
        const { status, body } = await postComment(item._id, form, () => undefined);
        if (status < 200 || status >= 300) {
          toast.error([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — ") || "The piece was saved, but the feedback couldn't be sent.");
          onDone();
          return;
        }
      } else if (resubmit) {
        const result = await changeContentStatusAction(item._id, "pending_approval");
        if (!result.ok) {
          toast.error(result.error ?? "Couldn't send it back.");
          return;
        }
      }

      setOpen(false);
      toast.success(resubmit ? `Sent back to ${clientName} for approval` : `Revision feedback sent to ${clientName}`);
      onDone();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setProgress(null);
      setAction(null);
    }
  };

  const spinner = (
    <>
      <Loader2 size={13} strokeWidth={2.5} className="animate-spin" />
      {progress !== null && progress < 100 ? `Uploading ${progress}%` : "Sending…"}
    </>
  );

  return (
    <>
      <div className="mt-2.5">
        <button
          type="button"
          onClick={start}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-[#16a34a] px-4 text-[12.5px] font-semibold text-white hover:bg-[#15803d]"
        >
          <MessageSquareText size={15} strokeWidth={2} /> Revision feedback
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-[#0b1522]/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revision-feedback-title"
            onDragOver={(event: DragEvent) => {
              if (busy) return;
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event: DragEvent) => {
              if (busy) return;
              event.preventDefault();
              setDragging(false);
              addFiles(Array.from(event.dataTransfer.files));
            }}
            className={`max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[10px] border bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.25)] ${
              dragging ? "border-dashed border-[#2563eb]" : "border-[#dbe3de]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: spec.background, color: spec.color }}>
                <spec.icon size={19} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="revision-feedback-title" className="text-[15px] font-bold text-[#0d1e2c]">
                  Revision feedback{revision ? ` — revision ${revision.number}` : ""}
                </h2>
                <p className="mt-0.5 truncate text-[12.5px] text-[#556977]">
                  <span className="font-semibold text-[#273847]">{item.title}</span> · {spec.label}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                disabled={busy}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#7a8e9b] hover:bg-[#eef3ef] hover:text-[#17242f] disabled:cursor-default disabled:opacity-50"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* What is being answered */}
            {revision?.requests.length ? (
              <div className="mt-4 rounded-lg border border-[#e1eae5] bg-[#fafcfb] p-3">
                <div className="text-[10.5px] font-bold tracking-[0.3px] text-[#7a8e9b] uppercase">{clientName} asked for</div>
                <div className="mt-1.5 flex max-h-28 flex-col gap-1.5 overflow-y-auto">
                  {revision.requests.map((request, index) => (
                    <p key={`${request.createdAt}-${index}`} className="text-[12.5px] leading-normal whitespace-pre-line text-[#24333f] wrap-anywhere">
                      {request.text || `${request.attachments?.length ?? 0} file${request.attachments?.length === 1 ? "" : "s"} attached`}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {/* The piece's own files — only what this kind of piece takes */}
            <div className="mt-4">
              <div className={labelClass}>
                <span>
                  {spec.label} files{" "}
                  <span className="font-medium text-[#7a8e9b]">
                    ({count})
                  </span>
                </span>
                <span className="text-[10.5px] font-medium text-[#7a8e9b]">{uploadHint(item.type)}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {current.map((file) => {
                  const previous = replacing(file);
                  return (
                    <FileTile key={file.url} media={file.media} url={file.url} name={file.name || item.title}>
                      {previous ? (
                        <>
                          {/* On its way out: washed in yellow, as the client will see it — the previous version. */}
                          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-lg bg-[#facc15]/30 ring-2 ring-[#eab308] ring-inset" />
                          <span className="absolute top-1 left-1 rounded bg-[#facc15] px-1 text-[9px] font-bold text-[#422006]">PREVIOUS</span>
                        </>
                      ) : (
                        <span className="absolute top-1 left-1 rounded bg-[#0b1522]/75 px-1 text-[9px] font-bold text-white">IN POST</span>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setChoice((made) => ({ ...made, [file.url]: previous ? "keep" : "replace" }))}
                        aria-label={previous ? `Keep ${file.name} in the post` : `Replace ${file.name}`}
                        title={previous ? "Keep this file in the post" : "Take this file out of the post (it stays as the previous version)"}
                        className="absolute -top-1.5 -right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[#dbe3de] bg-white text-[#556977] shadow-sm hover:text-[#b42318]"
                      >
                        {previous ? <RotateCcw size={12} strokeWidth={2.25} /> : <X size={13} strokeWidth={2.25} />}
                      </button>
                    </FileTile>
                  );
                })}
                {added.map((file) => (
                  <FileTile key={file.id} media={mediaOf(file.file)} url={file.url} name={file.file.name}>
                    <span className="absolute top-1 left-1 rounded bg-[#16a34a] px-1 text-[9px] font-bold text-white">NEW</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => unpick(file.id)}
                      aria-label={`Remove ${file.file.name}`}
                      className="absolute -top-1.5 -right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[#dbe3de] bg-white text-[#556977] shadow-sm hover:text-[#b42318]"
                    >
                      <X size={13} strokeWidth={2.25} />
                    </button>
                  </FileTile>
                ))}
                {current.length === 0 && added.length === 0 ? (
                  <div className="flex h-24 items-center rounded-lg border border-dashed border-[#cbd6d0] px-4 text-[12px] text-[#7a8e9b]">No files on this piece yet.</div>
                ) : null}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {spec.media.map((media) => {
                  const Icon = MEDIA_ICON[media];
                  const off = busy;
                  return (
                    <label
                      key={media}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-md border border-[#cfdcd6] bg-white px-3 text-[12px] font-semibold ${
                        off ? "cursor-not-allowed text-[#c4cfd6]" : "cursor-pointer text-[#273847] hover:border-[#2563eb] hover:text-[#2563eb]"
                      }`}
                    >
                      <Plus size={13} strokeWidth={2.25} />
                      <Icon size={14} strokeWidth={2} /> {MEDIA_ADD[media].label}
                      <input
                        type="file"
                        multiple
                        accept={MEDIA_ADD[media].accept}
                        disabled={off}
                        className="hidden"
                        onChange={(event) => {
                          addFiles(Array.from(event.target.files ?? []));
                          // Let the same file be picked again after removing it.
                          event.target.value = "";
                        }}
                      />
                    </label>
                  );
                })}
                <span className="text-[11px] text-[#9aacb8]">or drop them here</span>
              </div>
              {current.length > 0 ? (
                <p className="mt-2 text-[11.5px] leading-normal text-[#7a8e9b]">
                  New files are the revised version: they replace what the post has now, which {clientName} keeps seeing — after the new ones, in yellow — as the{" "}
                  <b className="font-semibold text-[#854d0e]">previous version</b>. To leave a file in the post, press <RotateCcw size={10} strokeWidth={2.5} className="inline align-[-1px]" /> on it — it still shows after the new ones, in yellow.
                </p>
              ) : null}
            </div>

            {spec.media.includes("video") ? (
              <div className="mt-4">
                <ThumbnailField thumbnail={thumbnail} onPick={pickThumbnail} onRemove={() => setThumbnail(null)} disabled={busy} />
              </div>
            ) : null}

            {allowLink ? (
              <div className="mt-4">
                <label htmlFor="revision-link" className={labelClass}>
                  <span>
                    Link <span className="font-medium text-[#7a8e9b]">(instead of, or with, the files)</span>
                  </span>
                </label>
                <input
                  id="revision-link"
                  type="url"
                  value={link}
                  readOnly={busy}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder={spec.linkPlaceholder}
                  className={fieldClass}
                />
              </div>
            ) : null}

            {/* Caption & tags */}
            <div className="mt-4">
              <label htmlFor="revision-caption" className={labelClass}>
                <span>{spec.captionLabel}</span>
                <span className="text-[10.5px] font-medium text-[#7a8e9b]">
                  {caption.length} / {CAPTION_MAX}
                </span>
              </label>
              <textarea
                id="revision-caption"
                rows={4}
                maxLength={CAPTION_MAX}
                value={caption}
                readOnly={busy}
                onChange={(event) => setCaption(event.target.value)}
                placeholder={spec.captionPlaceholder}
                className={`${fieldClass} resize-y`}
              />
            </div>
            <div className="mt-3">
              <label htmlFor="revision-tags" className={labelClass}>
                <span className={iconText}>
                  <Tag size={12} strokeWidth={2.25} /> Tags
                </span>
                <span className="text-[10.5px] font-medium text-[#7a8e9b]">Press Enter or comma to add</span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-[#cbd6d0] bg-white px-2 py-2 focus-within:border-[#2563eb]">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-xl bg-[#eef1ef] py-1 pr-1 pl-2.5 text-[11px] font-semibold text-[#4a5c68]">
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      disabled={busy}
                      onClick={() => setTags(tags.filter((other) => other !== tag))}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-[#7a8e9b] hover:bg-[#dbe3de] hover:text-[#17242f]"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
                <input
                  id="revision-tags"
                  type="text"
                  value={entry}
                  readOnly={busy}
                  onChange={(event) => setEntry(event.target.value)}
                  onKeyDown={onTagKey}
                  onBlur={addTag}
                  placeholder={tags.length ? "Add another…" : "Add a tag…"}
                  className="min-w-30 flex-1 border-none bg-transparent px-1 py-1 text-[12.5px] text-[#17242f] outline-none placeholder:text-[#9aacb8]"
                />
              </div>
            </div>

            {/* What to tell the client */}
            <div className="mt-4">
              <label htmlFor="revision-feedback-text" className={labelClass}>
                <span>
                  What did you change? <span className="font-medium text-[#7a8e9b]">(for {clientName})</span>
                </span>
                <span className="text-[10.5px] font-medium text-[#7a8e9b]">
                  {feedback.length} / {FEEDBACK_MAX}
                </span>
              </label>
              <textarea
                id="revision-feedback-text"
                rows={3}
                maxLength={FEEDBACK_MAX}
                value={feedback}
                readOnly={busy}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder={changes.length ? `Leave it empty to send “Updated the ${changes.join(", ")}.”` : "e.g. Lowered the music and fixed the caption typo…"}
                className={`${fieldClass} resize-y`}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#eef3ef] pt-4">
              <button type="button" className={`${btnDraft} mr-auto disabled:opacity-50`} onClick={close} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => send(false)}
                disabled={busy || nothing}
                aria-busy={action === "feedback"}
                className={`${btnDraft} ${iconText} ${action === "feedback" ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-50"}`}
              >
                {action === "feedback" ? (
                  spinner
                ) : (
                  <>
                    <MessageSquareText size={13} strokeWidth={2} /> {changes.length ? "Save & send feedback" : "Send feedback"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => send(true)}
                disabled={busy}
                aria-busy={action === "resubmit"}
                className={`${btnPrimary} ${iconText} ${action === "resubmit" ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-50"}`}
              >
                {action === "resubmit" ? (
                  spinner
                ) : (
                  <>
                    <SendHorizontal size={13} strokeWidth={2} /> {changes.length ? "Save & send back to client" : "Send back to client"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default RevisionReply;
