"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import toast from "react-hot-toast";
import { Download, FileText, Loader2, MessageSquare, Paperclip, Play, Send, X } from "lucide-react";
import type { ContentComment, ContentFile } from "@/app/actions/content";
import { initialsOf } from "@/component/clients/clientUi";
import { formatDateTime, personNameOf } from "./contentUi";
import { Lightbox, MEDIA_ICON, extensionOf, fileSize, type Upload } from "./contentForm";
import { mediaOf, uploadProblem } from "./contentKinds";

// The backend's CONTENT_COMMENT_MAX_ATTACHMENTS.
const MAX_ATTACHMENTS = 5;
const ACCEPT = "image/*,video/*,.doc,.docx,.pdf,.txt,.rtf,.odt";

type Picked = { id: string; file: File; url: string };
type CommentResponse = { success: boolean; message: string; data?: { comments: ContentComment[] }; errors?: string[] };

const toUpload = (file: ContentFile): Upload => ({ name: file.name, size: file.size, url: file.url, media: file.media, mime: file.mimeType });

// Sends the comment to the upload route, reporting progress (0–100) as files go up.
const postComment = (contentId: string, form: FormData, onProgress: (percent: number) => void) =>
  new Promise<{ status: number; body: CommentResponse }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `/api/content/${contentId}/comments`);
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve({
        status: request.status,
        body: (request.response as CommentResponse | null) ?? { success: false, message: "The server sent an unexpected response." },
      });
    request.onerror = () => reject(new Error("Network error"));
    request.send(form);
  });

// A comment's files: images and videos as small tiles, documents as chips. Any of
// them opens full size.
const Attachments = ({ files, onOpen }: { files: ContentFile[]; onOpen: (index: number) => void }) => {
  const visual = files.map((file, index) => ({ file, index })).filter(({ file }) => file.media !== "doc");
  const docs = files.map((file, index) => ({ file, index })).filter(({ file }) => file.media === "doc");

  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {visual.length ? (
        <div className="flex flex-wrap gap-1.5">
          {visual.map(({ file, index }) => (
            <button
              key={file.url}
              type="button"
              onClick={() => onOpen(index)}
              aria-label={`Open ${file.name}`}
              className="group relative h-18 w-18 cursor-zoom-in overflow-hidden rounded-lg border border-[#dbe3de] bg-[#eef3ef]"
            >
              {file.media === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.url} alt={file.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <>
                  <video src={file.url} muted preload="metadata" className="h-full w-full bg-black object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white">
                      <Play size={12} strokeWidth={2} fill="currentColor" className="ml-0.5" />
                    </span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      ) : null}
      {docs.map(({ file, index }) => (
        <div
          key={file.url}
          className="flex max-w-full items-center gap-2 rounded-lg border border-[#dbe3de] bg-white py-1.5 pr-1.5 pl-2"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#dbeafe] text-[#2563eb]">
            <FileText size={14} strokeWidth={2} />
          </span>
          <button type="button" onClick={() => onOpen(index)} className="min-w-0 flex-1 cursor-pointer text-left">
            <span className="block truncate text-[11.5px] font-semibold text-[#17242f] hover:underline">{file.name}</span>
            <span className="block text-[10px] text-[#8496a3]">
              {extensionOf(file.name)}
              {file.size ? ` · ${fileSize(file.size)}` : ""}
            </span>
          </button>
          <a
            href={file.url}
            download={file.name}
            target="_blank"
            rel="noreferrer"
            aria-label={`Download ${file.name}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#556977] hover:bg-[#f1f5f3] hover:text-[#17242f]"
          >
            <Download size={13} strokeWidth={2} />
          </a>
        </div>
      ))}
    </div>
  );
};

// The conversation on a piece: every comment with its attachments, and a box to
// comment, reply, and attach images, videos or documents.
const CommentThread = ({
  contentId,
  comments: initialComments,
  clientName,
  canComment,
  maxHeight = "max-h-96",
  onPosted,
}: {
  contentId: string;
  comments: ContentComment[];
  clientName: string;
  canComment: boolean;
  // How tall the list grows before it scrolls.
  maxHeight?: string;
  // After a comment is saved — e.g. to refresh counts elsewhere on the page.
  onPosted?: () => void;
}) => {
  // Kept here so a new comment shows at once; follows the page when it reloads.
  const [comments, setComments] = useState(initialComments);
  const [seen, setSeen] = useState(initialComments);
  if (initialComments !== seen) {
    setSeen(initialComments);
    setComments(initialComments);
  }

  const [text, setText] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState<{ files: Upload[]; index: number } | null>(null);
  const posting = progress !== null;

  const threadRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  // Keep the newest comment in view.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [comments.length]);

  // Free preview URLs when files leave the box or the page closes.
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(() => () => pickedRef.current.forEach((entry) => URL.revokeObjectURL(entry.url)), []);

  const authorOf = (entry: ContentComment) =>
    entry.name ?? personNameOf(entry.user) ?? (entry.author === "client" ? clientName : "BayShore");

  const addFiles = (files: File[]) => {
    const problems = files.map(uploadProblem).filter(Boolean);
    const allowed = files.filter((file) => !uploadProblem(file));
    const room = MAX_ATTACHMENTS - picked.length;
    if (problems.length) toast.error(`${problems.join("; ")} — skipped.`);
    if (allowed.length > room) toast.error(`Up to ${MAX_ATTACHMENTS} files per comment — only the first ${Math.max(0, room)} were added.`);
    const added = allowed.slice(0, Math.max(0, room)).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
    }));
    if (added.length) setPicked((current) => [...current, ...added]);
  };

  const unpick = (id: string) =>
    setPicked((current) => {
      const gone = current.find((entry) => entry.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return current.filter((entry) => entry.id !== id);
    });

  const startReply = (author: string) => {
    setReplyTo(author);
    boxRef.current?.focus();
  };

  const send = async () => {
    const words = text.trim();
    if ((!words && !picked.length) || posting) return;

    const form = new FormData();
    // Comments are one thread, so a reply names who it answers.
    form.set("text", replyTo ? `@${replyTo} ${words}`.trim() : words);
    for (const entry of picked) form.append("files", entry.file, entry.file.name);

    setProgress(0);
    try {
      const { status, body } = await postComment(contentId, form, setProgress);
      if (status < 200 || status >= 300) {
        toast.error([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — ") || "Couldn't post the comment.");
        return;
      }
      if (body.data?.comments) setComments(body.data.comments);
      picked.forEach((entry) => URL.revokeObjectURL(entry.url));
      setPicked([]);
      setText("");
      setReplyTo(null);
      onPosted?.();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setProgress(null);
    }
  };

  const dragProps = canComment
    ? {
        onDragOver: (event: DragEvent) => {
          event.preventDefault();
          setDragging(true);
        },
        onDragLeave: () => setDragging(false),
        onDrop: (event: DragEvent) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        },
      }
    : {};

  return (
    <div>
      {comments.length ? (
        <div ref={threadRef} className={`flex ${maxHeight} flex-col gap-3 overflow-y-auto pr-1`}>
          {comments.map((entry, index) => {
            const fromClient = entry.author === "client";
            const author = authorOf(entry);
            const files = entry.attachments ?? [];
            return (
              <div key={`${entry.createdAt}-${index}`} className="flex gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    fromClient ? "bg-[#2563eb]" : "bg-[#0f1c2a]"
                  }`}
                >
                  {initialsOf(author)}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`rounded-lg rounded-tl-sm border px-2.75 py-2 ${
                      fromClient ? "border-[#dbeafe] bg-[#f5f9ff]" : "border-[#eef3ef] bg-[#fafcfb]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
                      <span className="font-bold text-[#172632]">{author}</span>
                      <span
                        className={`rounded-full px-1.5 text-[9.5px] font-bold ${
                          fromClient ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#eef3ef] text-[#556977]"
                        }`}
                      >
                        {fromClient ? "Client" : "Team"}
                      </span>
                    </div>
                    {entry.text ? (
                      <div className="mt-0.5 text-[12px] leading-normal break-words whitespace-pre-line text-[#33434f]">{entry.text}</div>
                    ) : null}
                    {files.length ? <Attachments files={files} onOpen={(at) => setViewing({ files: files.map(toUpload), index: at })} /> : null}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 pl-1 text-[10.5px] text-[#8496a3]">
                    <span>{formatDateTime(entry.createdAt)}</span>
                    {files.length ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Paperclip size={10} strokeWidth={2} /> {files.length}
                      </span>
                    ) : null}
                    {canComment ? (
                      <button type="button" onClick={() => startReply(author)} className="cursor-pointer font-semibold text-[#2563eb] hover:underline">
                        Reply
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-[#dbe3de] py-5 text-center">
          <MessageSquare size={18} strokeWidth={1.75} className="text-[#b4c2bb]" />
          <div className="text-[12px] font-semibold text-[#7a8e9b]">No comments yet</div>
          {canComment ? <div className="text-[11px] text-[#9aacb8]">Start the conversation below.</div> : null}
        </div>
      )}

      {canComment ? (
        <div
          {...dragProps}
          className={`mt-3.5 rounded-lg border transition-colors ${
            dragging ? "border-dashed border-[#2563eb] bg-[#eff6ff]" : "border-[#cbd6d0] bg-[#fafcfb] focus-within:border-[#2563eb] focus-within:bg-white"
          }`}
        >
          {replyTo ? (
            <div className="flex items-center justify-between gap-2 border-b border-[#eef3ef] px-2.5 py-1.5 text-[11px] text-[#556977]">
              <span className="truncate">
                Replying to <b className="text-[#17242f]">{replyTo}</b>
              </span>
              <button
                type="button"
                aria-label="Cancel reply"
                onClick={() => setReplyTo(null)}
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#8496a3] hover:bg-[#eef3ef] hover:text-[#17242f]"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          ) : null}

          <textarea
            ref={boxRef}
            rows={3}
            value={text}
            readOnly={posting}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData.files);
              if (files.length) {
                event.preventDefault();
                addFiles(files);
              }
            }}
            placeholder={dragging ? "Drop files to attach them" : replyTo ? `Reply to ${replyTo}…` : `Write a comment for ${clientName} or your team…`}
            className="block w-full resize-none border-none bg-transparent px-2.75 pt-2.25 text-[12.5px] text-[#17242f] outline-none"
          />

          {picked.length ? (
            <div className="flex flex-wrap gap-1.5 px-2.5 pb-2">
              {picked.map((entry) => {
                const media = mediaOf(entry.file);
                const Icon = MEDIA_ICON[media];
                return (
                  <div
                    key={entry.id}
                    className="flex max-w-50 items-center gap-1.5 rounded-md border border-[#dbe3de] bg-white py-1 pr-1 pl-1"
                    title={entry.file.name}
                  >
                    {media === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.url} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                    ) : (
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                          media === "video" ? "bg-[#fbdada] text-[#dc2626]" : "bg-[#dbeafe] text-[#2563eb]"
                        }`}
                      >
                        <Icon size={13} strokeWidth={2} />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-[#17242f]">{entry.file.name}</span>
                      <span className="block text-[9.5px] text-[#8496a3]">{fileSize(entry.file.size)}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${entry.file.name}`}
                      onClick={() => unpick(entry.id)}
                      disabled={posting}
                      className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#8496a3] hover:bg-[#fdecec] hover:text-[#b42318]"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}


          <div className="flex items-center justify-between gap-2 border-t border-[#eef3ef] px-2 py-1.5">
            <label
              title={`Attach images, videos or documents — up to ${MAX_ATTACHMENTS}`}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1.25 text-[11.5px] font-semibold ${
                picked.length >= MAX_ATTACHMENTS
                  ? "cursor-not-allowed text-[#b4c2bb]"
                  : "cursor-pointer text-[#556977] hover:bg-[#eef3ef] hover:text-[#17242f]"
              }`}
            >
              <Paperclip size={13} strokeWidth={2} /> Attach
              <span className="font-normal text-[#9aacb8]">
                {picked.length ? `${picked.length}/${MAX_ATTACHMENTS}` : "image, video, doc"}
              </span>
              <input
                type="file"
                accept={ACCEPT}
                multiple
                disabled={picked.length >= MAX_ATTACHMENTS || posting}
                className="hidden"
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={send}
              disabled={(!text.trim() && !picked.length) || posting}
              aria-busy={posting}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#0b1522] px-3 py-1.5 text-[12px] font-semibold text-white ${
                posting ? "cursor-wait" : "cursor-pointer hover:bg-[#17263a] disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              {posting ? (
                <>
                  <Loader2 size={12} strokeWidth={2.5} className="animate-spin" />
                  {picked.length && (progress ?? 0) < 100 ? `Uploading ${progress ?? 0}%` : "Sending…"}
                </>
              ) : (
                <>
                  <Send size={12} strokeWidth={2.25} /> {replyTo ? "Reply" : "Comment"}
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {viewing ? (
        <Lightbox
          files={viewing.files}
          index={viewing.index}
          onMove={(index) => setViewing((current) => (current ? { ...current, index } : current))}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </div>
  );
};

export default CommentThread;
