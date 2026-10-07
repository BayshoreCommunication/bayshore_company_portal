"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Download, FileText, Loader2, Paperclip, Play, Send, X } from "lucide-react";
import type { ContentComment, ContentFile, ContentPiece } from "@/app/actions/content";
import { formatDateTime, mediaOf, personNameOf, threadOf, uploadProblem } from "./contentUi";
import { Lightbox, MEDIA_ICON, extensionOf, fileSize, type Upload } from "./contentForm";

// The backend's CONTENT_COMMENT_MAX_ATTACHMENTS.
const MAX_ATTACHMENTS = 5;
const ACCEPT = "image/*,video/*,.doc,.docx,.pdf,.txt,.rtf,.odt";

type Picked = { id: string; file: File; url: string };
type CommentResponse = { success: boolean; message: string; data?: { comments: ContentComment[] }; errors?: string[] };

const toUpload = (file: ContentFile): Upload => ({ name: file.name, size: file.size, url: file.url, media: file.media, mime: file.mimeType });

// Sends the comment to the upload route, reporting progress (0–100) as files go up.
export const postComment = (contentId: string, form: FormData, onProgress: (percent: number) => void) =>
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
// them opens full size. `end` lines them up on the right, under the team's own messages.
const Attachments = ({ files, end = false, onOpen }: { files: ContentFile[]; end?: boolean; onOpen: (index: number) => void }) => {
  const visual = files.map((file, index) => ({ file, index })).filter(({ file }) => file.media !== "doc");
  const docs = files.map((file, index) => ({ file, index })).filter(({ file }) => file.media === "doc");

  return (
    <div className={`mt-1.5 flex max-w-[88%] flex-col gap-1.5 ${end ? "items-end" : "items-start"}`}>
      {visual.length ? (
        <div className={`flex flex-wrap gap-1.5 ${end ? "justify-end" : ""}`}>
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

// The conversation on a piece, laid out like a chat — the same way the client sees it in
// their portal, from the other side: the client on the left, the team on the right. Every
// message with its attachments, and a box to write, reply, and attach images, videos or
// documents: one field with the attach button inside it, and a send button beside it.
// A client's request for changes carries the revision it belongs to. Pieces saved together
// share one conversation: the messages written on the others (`pieces`) are shown in with
// this one's, each saying which piece it is about. What is written here goes on this piece.
const CommentThread = ({
  contentId,
  pieces,
  comments: initialComments,
  clientName,
  canComment,
  height = "max-h-96",
  onPosted,
}: {
  contentId: string;
  // The piece's group, this piece included — a group of one when it was saved alone.
  pieces: ContentPiece[];
  // This piece's own messages.
  comments: ContentComment[];
  clientName: string;
  canComment: boolean;
  // How tall the list is, or grows before it scrolls.
  height?: string;
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

  const thread = threadOf(pieces, contentId, comments);
  const grouped = pieces.length > 1;

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
  }, [thread.length]);

  // Once what was typed has been sent (and cleared), the field shrinks back to one line.
  useEffect(() => {
    if (!text && boxRef.current) boxRef.current.style.height = "";
  }, [text]);

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
      {thread.length ? (
        <div ref={threadRef} className={`-mr-1.5 flex ${height} flex-col gap-3.5 overflow-y-auto pr-1.5`}>
          {thread.map((entry, index) => {
            // The team's side sits on the right, the client's on the left.
            const fromTeam = entry.author !== "client";
            const author = authorOf(entry);
            const files = entry.attachments ?? [];
            return (
              <div key={`${entry.createdAt}-${index}`} className={`flex flex-col ${fromTeam ? "items-end" : "items-start"}`}>
                <div className={`mb-1 flex max-w-full flex-wrap items-center gap-1.5 text-[10.5px] ${fromTeam ? "justify-end" : ""}`}>
                  <span className="font-bold text-[#172632]">{author}</span>
                  {fromTeam ? null : <span className="rounded bg-[#dbeafe] px-1.5 py-px text-[9.5px] font-bold text-[#1d4ed8]">Client</span>}
                  {entry.revision ? (
                    <span className="rounded bg-[#fde8e8] px-1.5 py-px text-[9.5px] font-bold text-[#b91c1c]">
                      {entry.asks ? "Revision request" : "Revision"} {entry.revision}
                    </span>
                  ) : null}
                  {/* Which piece of the group the message is about; another piece's opens it. */}
                  {!grouped ? null : entry.piece._id === contentId ? (
                    <span className="rounded bg-[#eef3ef] px-1.5 py-px text-[9.5px] font-bold text-[#556977]">Piece {entry.at + 1} · this piece</span>
                  ) : (
                    <Link
                      href={`/content/${entry.piece._id}`}
                      title={entry.piece.title}
                      className="max-w-44 truncate rounded bg-[#eef3ef] px-1.5 py-px text-[9.5px] font-bold text-[#556977] no-underline hover:bg-[#dbeafe] hover:text-[#1d4ed8]"
                    >
                      Piece {entry.at + 1} · {entry.piece.title}
                    </Link>
                  )}
                  <span className="text-[#8496a3]">{formatDateTime(entry.createdAt)}</span>
                  {canComment ? (
                    <button type="button" onClick={() => startReply(author)} className="cursor-pointer font-semibold text-[#2563eb] hover:underline">
                      Reply
                    </button>
                  ) : null}
                </div>
                {entry.text ? (
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-normal whitespace-pre-line wrap-anywhere ${
                      fromTeam ? "rounded-tr-sm bg-[#2563eb] text-white" : "rounded-tl-sm bg-[#f1f4f2] text-[#33434f]"
                    }`}
                  >
                    {entry.text}
                  </div>
                ) : null}
                {files.length ? <Attachments files={files} end={fromTeam} onOpen={(at) => setViewing({ files: files.map(toUpload), index: at })} /> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-60 flex-col items-center justify-center text-center">
          {/* A chat bubble with its three dots rising in turn, as if a message is on its way. */}
          <span aria-hidden="true" className="mb-3 flex h-9 w-14 items-center justify-center gap-1.5 rounded-2xl rounded-bl-sm border-[1.5px] border-[#cbd6d0]">
            {[0, 180, 360].map((delay) => (
              <span
                key={delay}
                className="h-1.5 w-1.5 animate-[typing-dot_1.3s_ease-in-out_infinite] rounded-full bg-[#9aacb8] motion-reduce:animate-none"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
          <div className="text-[13px] font-bold text-[#0d1e2c]">No messages yet</div>
          {canComment ? <div className="mt-1 text-[12px] text-[#7a8e9b]">Start the conversation with {clientName} below.</div> : null}
        </div>
      )}

      {canComment ? (
        <div {...dragProps} className="mt-3.5 border-t border-[#eef3ef] pt-3.5">
          {replyTo ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[#f4f7f5] px-2.5 py-1.5 text-[11px] text-[#556977]">
              <span className="truncate">
                Replying to <b className="text-[#17242f]">{replyTo}</b>
              </span>
              <button
                type="button"
                aria-label="Cancel reply"
                onClick={() => setReplyTo(null)}
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#8496a3] hover:bg-[#e3eae6] hover:text-[#17242f]"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          ) : null}

          {picked.length ? (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
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

          <div className="flex items-end gap-2">
            {/* One field: the words, with the attach button inside it. */}
            <div
              className={`flex min-w-0 flex-1 items-end rounded-xl border ${
                dragging ? "border-dashed border-[#2563eb] bg-[#eff6ff]" : "border-[#dbe3de] bg-[#f4f7f5] focus-within:border-[#9aacb8] focus-within:bg-white"
              }`}
            >
              <label
                title={`Attach images, videos or documents — up to ${MAX_ATTACHMENTS}`}
                className={`mb-1.5 ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                  picked.length >= MAX_ATTACHMENTS || posting
                    ? "cursor-not-allowed text-[#b4c2bb]"
                    : "cursor-pointer text-[#556977] hover:bg-[#e3eae6] hover:text-[#17242f]"
                }`}
              >
                <Paperclip size={14} strokeWidth={2} />
                <input
                  type="file"
                  accept={ACCEPT}
                  multiple
                  disabled={picked.length >= MAX_ATTACHMENTS || posting}
                  className="hidden"
                  onChange={(event) => {
                    addFiles(Array.from(event.target.files ?? []));
                    // Let the same file be picked again after removing it.
                    event.target.value = "";
                  }}
                />
              </label>
              <textarea
                ref={boxRef}
                rows={1}
                maxLength={1000}
                value={text}
                readOnly={posting}
                aria-label={replyTo ? `Reply to ${replyTo}` : "Message"}
                onChange={(event) => {
                  setText(event.target.value);
                  // Grows with what is typed, up to a few lines.
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 112)}px`;
                }}
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
                placeholder={dragging ? "Drop files to attach them" : replyTo ? `Reply to ${replyTo}…` : "Type a message"}
                className="block min-h-10 min-w-0 flex-1 resize-none border-none bg-transparent py-2.5 pr-3.5 pl-2 text-[12.5px] leading-normal whitespace-pre-wrap text-[#17242f] outline-none wrap-anywhere placeholder:text-[#9aacb8]"
              />
            </div>
            <button
              type="button"
              onClick={send}
              disabled={(!text.trim() && !picked.length) || posting}
              aria-label={replyTo ? "Send reply" : "Send message"}
              aria-busy={posting}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#16a34a] text-white ${
                posting ? "cursor-wait" : "cursor-pointer hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              {posting ? <Loader2 size={16} strokeWidth={2.25} className="animate-spin" /> : <Send size={16} strokeWidth={2} />}
            </button>
          </div>

          {posting && picked.length && (progress ?? 0) < 100 ? <div className="mt-2 px-1 text-[11px] text-[#7a8e9b]">Uploading {progress}%…</div> : null}
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
