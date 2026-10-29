"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, MessageSquareWarning, Paperclip, Send, X } from "lucide-react";
import type { OnboardingComment } from "@/app/actions/onboarding";
import { sendWithProgress } from "@/lib/sendWithProgress";
import { Files } from "./OnboardingThread";

// Inside one item of a client's onboarding (OnboardingReview): what the team asked the client to
// fix on just this item, and what the client said back. The client sees it on that item of their
// own form (client-portal: ItemNotes). Each is an onboarding comment on the item's step, with the
// item named — so it shows in the step's comments too.

// At most this many files on one comment (backend: ONBOARDING_COMMENT_MAX_FILES).
const MAX_FILES = 5;
const MAX_LENGTH = 1000;

// A start for the usual asks, filled into the box to finish or send as it is.
const QUICK_ASKS = ["Please update this.", "We couldn't verify the access. Please check it again.", "Some details are missing. Please add them."];

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

// The same on the server and in the browser, whatever its timezone.
const whenOf = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC";

type Props = {
  clientId: string;
  // The step it is on, as the client's form names it ("social").
  step: string;
  item: { id: string; label: string };
  comments: OnboardingComment[];
  onPosted: (comment: OnboardingComment) => void;
};

const ItemComments = ({ clientId, step, item, comments, onPosted }: Props) => {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const ready = (draft.trim() !== "" || files.length > 0) && !sending;

  const post = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    setDone(false);
    const form = new FormData();
    form.append("step", step);
    form.append("item", item.id);
    form.append("itemLabel", item.label);
    form.append("text", draft.trim());
    files.forEach((file) => form.append("files", file));
    try {
      const { ok, body } = await sendWithProgress(`/api/onboarding/comments/${clientId}`, form, () => undefined);
      if (!ok || !body?.data) {
        setError(body?.message || "Couldn't send it. Please try again.");
        return;
      }
      onPosted(body.data as OnboardingComment);
      setDraft("");
      setFiles([]);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#fde2b3] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[#fdecc8] bg-[#fffaf0] px-3.5 py-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#fef3c7] text-[#b45309]">
          <MessageSquareWarning size={15} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#111827]">Ask the client to update this</div>
          <div className="text-[11.5px] text-[#92400e]">They see it on {item.label} in their form.</div>
        </div>
        {comments.length ? <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]">{comments.length}</span> : null}
      </div>

      {comments.length ? (
        <ul className="flex list-none flex-col gap-3 px-3.5 pt-3">
          {comments.map((comment) => {
            const team = comment.side === "team";
            return (
              <li key={comment._id} className="flex gap-2.5">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold text-white ${team ? "bg-[#b45309]" : "bg-[#111827]"}`}>{initialsOf(comment.authorName)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 text-[12px]">
                    <span className="font-semibold text-[#111827]">{comment.authorName}</span>
                    <span className={`rounded px-1.5 py-px text-[9.5px] font-semibold tracking-wide uppercase ${team ? "bg-[#fef3c7] text-[#92400e]" : "bg-[#f3f4f6] text-[#4b5563]"}`}>{team ? "Team" : "Client"}</span>
                    <span className="text-[11px] text-[#9ca3af]">{whenOf(comment.createdAt)}</span>
                  </div>
                  {comment.text ? (
                    <p className={`mt-1 rounded-lg rounded-tl-sm px-3 py-2 text-[12.5px] leading-normal break-words whitespace-pre-wrap text-[#1f2530] ${team ? "bg-[#fffbeb]" : "bg-[#f5f6f8]"}`}>{comment.text}</p>
                  ) : null}
                  <Files files={comment.files} />
                  {comment.replies.map((reply) => (
                    <div key={reply._id} className="mt-2 border-l-2 border-[#fde2b3] pl-2.5">
                      <div className="flex flex-wrap items-baseline gap-x-1.5 text-[11.5px]">
                        <span className="font-semibold text-[#111827]">{reply.authorName}</span>
                        <span className="text-[10.5px] text-[#9ca3af]">{whenOf(reply.createdAt)}</span>
                      </div>
                      {reply.text ? <p className="mt-0.5 text-[12px] leading-normal break-words whitespace-pre-wrap text-[#1f2530]">{reply.text}</p> : null}
                      <Files files={reply.files} />
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="p-3.5">
        {!draft && !comments.length ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_ASKS.map((ask) => (
              <button
                key={ask}
                type="button"
                onClick={() => {
                  setDraft(ask);
                  box.current?.focus();
                }}
                className="cursor-pointer rounded-full border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#4b5563] transition-colors hover:border-[#f59e0b] hover:bg-[#fffbeb] hover:text-[#92400e]"
              >
                {ask}
              </button>
            ))}
          </div>
        ) : null}
        <div className="rounded-lg border border-[#e2e5e9] bg-white focus-within:border-[#f59e0b] focus-within:ring-3 focus-within:ring-[#f59e0b]/15">
          <textarea
            ref={box}
            rows={2}
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void post();
              }
            }}
            placeholder={`What should the client fix on ${item.label}?`}
            aria-label={`Comment on ${item.label}`}
            className="block w-full resize-none rounded-lg bg-transparent px-3 pt-2.5 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af]"
          />
          {files.length ? (
            <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5">
              {files.map((file, index) => (
                <span key={index} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#fef3c7] py-1 pr-1 pl-2 text-[11px] font-medium text-[#1f2530]">
                  <FileText size={12} strokeWidth={2} className="shrink-0 text-[#b45309]" />
                  <span className="max-w-28 truncate" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((now) => now.filter((_, at) => at !== index))}
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
                  if (picked?.length) setFiles((now) => [...now, ...Array.from(picked)].slice(0, MAX_FILES));
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                aria-label="Attach files"
                title={files.length >= MAX_FILES ? `Up to ${MAX_FILES} files` : "Attach files"}
                disabled={files.length >= MAX_FILES || sending}
                onClick={() => picker.current?.click()}
                className="grid size-7 cursor-pointer place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#b45309] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Paperclip size={15} strokeWidth={2} />
              </button>
              <span className="text-[10.5px] text-[#9ca3af]">The client is notified</span>
            </div>
            <button
              type="button"
              onClick={() => void post()}
              disabled={!ready}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#111827] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} strokeWidth={2.25} />} {sending ? "Sending…" : "Send to client"}
            </button>
          </div>
        </div>
        {done ? (
          <p role="status" className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#e7f6ec] px-2.5 py-1.5 text-[12px] font-semibold text-[#15803d]">
            <CheckCircle2 size={13} strokeWidth={2.5} /> Sent. The client sees it on {item.label}.
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-2 text-[12px] font-medium text-[#b42318]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default ItemComments;
