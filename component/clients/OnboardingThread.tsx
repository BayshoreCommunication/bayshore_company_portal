"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, MessageSquare, Paperclip, Reply, Send, X } from "lucide-react";
import type { OnboardingComment, OnboardingCommentFile } from "@/app/actions/onboarding";
import { formatFileSize } from "@/component/projects/projectUi";
import { sendWithProgress } from "@/lib/sendWithProgress";

// Under a step of a client's onboarding (OnboardingControls → "Credentials & onboarding"): what
// the client asked or noted on that step of their own form (client-portal: StepComments), and
// the team's replies — which the client sees under their comment. Only the client starts a
// thread; the team answers it.

// At most this many files on one reply (backend: ONBOARDING_COMMENT_MAX_FILES).
const MAX_FILES = 5;
const MAX_LENGTH = 1000;

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

// The same on the server and in the browser, whatever its timezone.
const whenOf = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC";

const isImage = (file: OnboardingCommentFile) => (file.mimeType ?? "").startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(file.name);

// What a comment came with: each picture as a thumbnail that opens it, anything else a link.
const Files = ({ files }: { files: OnboardingCommentFile[] }) =>
  files.length ? (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {files.some(isImage) ? (
        <div className="flex w-full flex-wrap gap-1.5">
          {files.filter(isImage).map((file) => (
            <a key={file.url} href={file.url} target="_blank" rel="noopener" title={file.name} className="block size-20 overflow-hidden rounded-lg border border-[#e3e8e5] bg-[#f5f6f8] hover:border-[#2563eb]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.url} alt={file.name} loading="lazy" className="size-full object-cover" />
            </a>
          ))}
        </div>
      ) : null}
      {files
        .filter((file) => !isImage(file))
        .map((file) => (
        <a
          key={file.url}
          href={file.url}
          target="_blank"
          rel="noopener"
          className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#e3e8e5] bg-white px-2.5 py-1.5 text-[12px] no-underline hover:border-[#2563eb]"
        >
          <FileText size={14} strokeWidth={2} className="shrink-0 text-[#2563eb]" />
          <span className="max-w-56 truncate font-semibold text-[#111827]" title={file.name}>
            {file.name}
          </span>
          <span className="shrink-0 text-[#9ca3af]">{formatFileSize(file.size)}</span>
        </a>
      ))}
    </div>
  ) : null;

// The box to reply with, under one comment.
const ReplyBox = ({ clientId, comment, onSent, onCancel }: { clientId: string; comment: OnboardingComment; onSent: (comment: OnboardingComment) => void; onCancel: () => void }) => {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const ready = (draft.trim() !== "" || files.length > 0) && !sending;

  const send = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    const form = new FormData();
    form.append("text", draft.trim());
    files.forEach((file) => form.append("files", file));
    try {
      const { ok, body } = await sendWithProgress(`/api/onboarding/comments/${clientId}/${comment._id}`, form, () => undefined);
      if (!ok || !body?.data) {
        setError(body?.message || "Couldn't send the reply. Please try again.");
        return;
      }
      onSent(body.data as OnboardingComment);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-2.5">
      <div className="rounded-[10px] border border-[#d1d5db] bg-white focus-within:border-[#2563eb] focus-within:ring-3 focus-within:ring-[#2563eb]/12">
        <textarea
          autoFocus
          rows={2}
          value={draft}
          maxLength={MAX_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder="Write a reply to the client…"
          aria-label="Reply to the client"
          className="block w-full resize-y rounded-[10px] bg-transparent px-3 pt-2.5 text-[13px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
        />
        {files.length ? (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5">
            {files.map((file, index) => (
              <span key={index} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#eef2fb] py-1 pr-1 pl-2 text-[11.5px] font-semibold text-[#111827]">
                <FileText size={12} strokeWidth={2} className="shrink-0 text-[#2563eb]" />
                <span className="max-w-40 truncate" title={file.name}>
                  {file.name}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((previous) => previous.filter((_, at) => at !== index))}
                  className="grid size-4 cursor-pointer place-items-center rounded text-[#6b7280] hover:bg-white hover:text-[#b42318]"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2 px-2.5 pt-1 pb-2">
          <div className="flex items-center gap-1.5">
            <input
              ref={picker}
              type="file"
              multiple
              hidden
              accept="image/*,video/mp4,video/quicktime,video/webm,.pdf,.doc,.docx,.txt"
              onChange={(event) => {
                const picked = event.target.files;
                if (picked?.length) setFiles((previous) => [...previous, ...Array.from(picked)].slice(0, MAX_FILES));
                event.target.value = "";
              }}
            />
            <button
              type="button"
              aria-label="Attach files"
              title={files.length >= MAX_FILES ? `Up to ${MAX_FILES} files` : "Attach files"}
              disabled={files.length >= MAX_FILES || sending}
              onClick={() => picker.current?.click()}
              className="grid size-7 cursor-pointer place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Paperclip size={15} strokeWidth={2} />
            </button>
            {files.length ? (
              <span className="rounded-full bg-[#2563eb] px-1.5 py-px text-[10.5px] font-bold text-white">
                {files.length} file{files.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-[11px] text-[#9ca3af]">The client sees this on their form</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-[#4b5563] hover:text-[#111827]">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void send()}
              disabled={!ready}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-[12.5px] font-bold text-white transition-colors hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2.25} />} {sending ? "Sending…" : "Reply"}
            </button>
          </div>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-[12px] font-semibold text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const OnboardingThread = ({ clientId, comments, onChange }: { clientId: string; comments: OnboardingComment[]; onChange: (comment: OnboardingComment) => void }) => {
  const [replying, setReplying] = useState<string | null>(null);
  if (!comments.length) return null;

  return (
    <div className="border-t border-[#EEF0F3] bg-[#FAFBFC] px-4.5 py-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[#111827]">
        <MessageSquare size={15} strokeWidth={2} className="text-[#2563eb]" />
        Comments
        <span className="rounded-full bg-[#E8EEFF] px-2 py-0.5 text-[11px] font-bold text-[#1E3A8A]">{comments.length}</span>
      </div>
      <ul className="flex list-none flex-col gap-4">
        {comments.map((comment) => (
          <li key={comment._id}>
            <div className="flex gap-2.5">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${comment.side === "team" ? "bg-[#2563eb]" : "bg-[#111827]"}`}>
                {initialsOf(comment.authorName)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5 text-[12.5px]">
                  <span className="font-bold text-[#111827]">{comment.authorName}</span>
                  {comment.side === "team" ? (
                    <span className="rounded bg-[#E8EEFF] px-1.5 py-px text-[10px] font-bold tracking-wide text-[#2563eb] uppercase">BayShore team</span>
                  ) : (
                    <span className="rounded bg-[#F3F4F6] px-1.5 py-px text-[10px] font-bold tracking-wide text-[#4B5563] uppercase">Client</span>
                  )}
                  <span className="text-[11.5px] text-[#9ca3af]">{whenOf(comment.createdAt)}</span>
                </div>
                {comment.text ? (
                  <p className="mt-1 rounded-[10px] rounded-tl-sm border border-[#e3e8e5] bg-white px-3 py-2 text-[13px] leading-normal break-words whitespace-pre-wrap text-[#111827]">{comment.text}</p>
                ) : null}
                <Files files={comment.files} />

                {comment.replies.length ? (
                  <ul className="mt-2.5 flex list-none flex-col gap-2.5 border-l-2 border-[#dbe5fb] pl-3">
                    {comment.replies.map((reply) => (
                      <li key={reply._id} className="flex gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#2563eb] text-[10.5px] font-bold text-white">{initialsOf(reply.authorName)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-1.5 text-[12.5px]">
                            <span className="font-bold text-[#111827]">{reply.authorName}</span>
                            <span className="rounded bg-[#E8EEFF] px-1.5 py-px text-[10px] font-bold tracking-wide text-[#2563eb] uppercase">BayShore team</span>
                            <span className="text-[11.5px] text-[#9ca3af]">{whenOf(reply.createdAt)}</span>
                          </div>
                          {reply.text ? (
                            <p className="mt-1 rounded-[10px] rounded-tl-sm bg-[#EEF3FD] px-3 py-2 text-[13px] leading-normal break-words whitespace-pre-wrap text-[#111827]">{reply.text}</p>
                          ) : null}
                          <Files files={reply.files} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {replying === comment._id ? (
                  <ReplyBox
                    clientId={clientId}
                    comment={comment}
                    onSent={(updated) => {
                      onChange(updated);
                      setReplying(null);
                    }}
                    onCancel={() => setReplying(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setReplying(comment._id)}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-[12.5px] font-bold text-[#2563eb] hover:bg-[#E8EEFF]"
                  >
                    <Reply size={14} strokeWidth={2.25} /> {comment.replies.length ? "Reply again" : "Reply"}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnboardingThread;
