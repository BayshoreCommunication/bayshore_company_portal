"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ChevronDown, FileText, Loader2, MessageSquare, Paperclip, Send, X } from "lucide-react";
import type { OnboardingComment, OnboardingCommentFile } from "@/app/actions/onboarding";
import { formatFileSize } from "@/component/projects/projectUi";
import { sendWithProgress } from "@/lib/sendWithProgress";
import { useRealtime } from "@/lib/realtime";

// Beside a client's record (ClientDetails): the comments on their onboarding form — the client's
// and the team's — and a box to write one on a step of it, which the client sees on that step of
// their form (client-portal: StepComments). Replies are written on the onboarding page.
//
// On that page (OnboardingReview) the list is the page's own (`comments`, `onPosted`), so what is
// posted here shows in its step there too; and there is no link to it.

// The steps of the client's onboarding form, by their id there.
const STEPS: [id: string, title: string][] = [
  ["contact", "About you"],
  ["web", "Website"],
  ["domain", "Domain and hosting"],
  ["email", "Business email"],
  ["logo", "Logo"],
  ["google", "Google accounts"],
  ["social", "Social media"],
  ["media", "Photos and videos"],
];
const titleOf = (step: string) => STEPS.find(([id]) => id === step)?.[1] ?? step;

// At most this many files on one comment (backend: ONBOARDING_COMMENT_MAX_FILES).
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
const whenOf = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const isImage = (file: OnboardingCommentFile) => (file.mimeType ?? "").startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(file.name);

// What a comment came with: each picture as a thumbnail that opens it, anything else a link.
const Files = ({ files }: { files: OnboardingCommentFile[] }) =>
  files.length ? (
    <div className="mt-1.5 flex flex-col gap-1">
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
        <a key={file.url} href={file.url} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-md border border-[#e6e8eb] bg-white px-2 py-1 text-[11px] no-underline hover:border-[#2563eb]">
          <FileText size={12} strokeWidth={2} className="shrink-0 text-[#2563eb]" />
          <span className="min-w-0 flex-1 truncate font-medium text-[#1f2530]" title={file.name}>
            {file.name}
          </span>
          <span className="shrink-0 text-[#9ca3af]">{formatFileSize(file.size)}</span>
        </a>
      ))}
    </div>
  ) : null;

const OnboardingComments = ({
  clientId,
  initial = [],
  comments: shared,
  onPosted,
}: {
  clientId: string;
  initial?: OnboardingComment[];
  comments?: OnboardingComment[];
  onPosted?: (comment: OnboardingComment) => void;
}) => {
  const [own, setOwn] = useState(initial);
  const comments = shared ?? own;
  // Scrolled to the newest at first, and again whenever one comes in or is replied to.
  const list = useRef<HTMLUListElement>(null);
  const newest = comments.length + comments.reduce((sum, comment) => sum + comment.replies.length, 0);
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [newest]);
  // Live (backend → onboarding:comment): this client's, unless the page keeps the list itself.
  useRealtime<OnboardingComment & { client?: string }>("onboarding:comment", (comment) => {
    if (shared || (comment.client && comment.client !== clientId)) return;
    setOwn((now) => (now.some((entry) => entry._id === comment._id) ? now.map((entry) => (entry._id === comment._id ? comment : entry)) : [...now, comment]));
  });
  const [step, setStep] = useState("contact");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const ready = (draft.trim() !== "" || files.length > 0) && !sending;

  const post = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    setDone(null);
    const count = files.length;
    const form = new FormData();
    form.append("step", step);
    form.append("text", draft.trim());
    files.forEach((file) => form.append("files", file));
    try {
      const { ok, body } = await sendWithProgress(`/api/onboarding/comments/${clientId}`, form, () => undefined);
      if (!ok || !body?.data) {
        setError(body?.message || "Couldn't post the comment. Please try again.");
        return;
      }
      if (onPosted) onPosted(body.data as OnboardingComment);
      else setOwn((now) => (now.some((entry) => entry._id === (body.data as OnboardingComment)._id) ? now : [...now, body.data as OnboardingComment]));
      setDraft("");
      setFiles([]);
      setDone(count ? `Comment posted · ${count} file${count === 1 ? "" : "s"} uploaded` : "Comment posted");
      setTimeout(() => setDone(null), 4000);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#e6e8eb] bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8effd] text-[#2f5fd8]">
          <MessageSquare size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-[#0b0c24]">Comments</h3>
          <p className="text-[11.5px] leading-snug text-[#6b7280]">
            Questions about <b className="font-semibold text-[#4b5260]">{titleOf(step)}</b>? Ask here.
          </p>
        </div>
        {comments.length ? <span className="rounded-full bg-[#eef0f3] px-2 py-0.5 text-[11px] font-semibold text-[#4b5260]">{comments.length}</span> : null}
      </div>

      {comments.length ? (
        <ul ref={list} className="mt-3.5 flex max-h-96 list-none flex-col gap-3 overflow-y-auto scroll-smooth pr-1">
          {comments.map((comment) => {
            const team = comment.side === "team";
            return (
              <li key={comment._id} className="flex gap-2.5">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold text-white ${team ? "bg-[#2f5fd8]" : "bg-[#0b0c24]"}`}>
                  {initialsOf(comment.authorName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 text-[12px]">
                    <span className="font-semibold text-[#0b0c24]">{comment.authorName}</span>
                    <span className={`rounded px-1.5 py-px text-[9.5px] font-semibold tracking-wide uppercase ${team ? "bg-[#e8effd] text-[#2f5fd8]" : "bg-[#f3f4f6] text-[#4b5563]"}`}>
                      {team ? "Team" : "Client"}
                    </span>
                    <span className="text-[11px] text-[#9ca3af]">{whenOf(comment.createdAt)}</span>
                  </div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-[#6b7280]">On {titleOf(comment.step)}</div>
                  {comment.text ? (
                    <p className={`mt-1 rounded-lg rounded-tl-sm px-3 py-2 text-[12.5px] leading-normal break-words whitespace-pre-wrap text-[#1f2530] ${team ? "bg-[#eef3fd]" : "bg-[#f5f6f8]"}`}>
                      {comment.text}
                    </p>
                  ) : null}
                  <Files files={comment.files} />
                  {/* The team's answers, under the comment they answer. */}
                  {comment.replies.length ? (
                    <ul className="mt-2 flex list-none flex-col gap-2 border-l-2 border-[#dbe5fb] pl-2.5">
                      {comment.replies.map((reply) => (
                        <li key={reply._id} className="flex gap-2">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#2f5fd8] text-[9.5px] font-semibold text-white">{initialsOf(reply.authorName)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-1.5 text-[11.5px]">
                              <span className="font-semibold text-[#0b0c24]">{reply.authorName}</span>
                              <span className="text-[10.5px] text-[#9ca3af]">{whenOf(reply.createdAt)}</span>
                            </div>
                            {reply.text ? (
                              <p className="mt-0.5 rounded-lg rounded-tl-sm bg-[#eef3fd] px-2.5 py-1.5 text-[12px] leading-normal break-words whitespace-pre-wrap text-[#1f2530]">{reply.text}</p>
                            ) : null}
                            <Files files={reply.files} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-3.5 rounded-xl border border-[#e2e5e9] bg-white focus-within:border-[#2f5fd8] focus-within:ring-3 focus-within:ring-[#2f5fd8]/12">
        {/* Which step of the client's form it goes on. */}
        <div className="relative border-b border-[#f0f1f3]">
          <select
            value={step}
            onChange={(event) => setStep(event.target.value)}
            aria-label="Step of the client's form"
            className="w-full cursor-pointer appearance-none rounded-t-xl bg-transparent py-2 pr-8 pl-3 text-[12px] font-medium text-[#4b5260] outline-none"
          >
            {STEPS.map(([id, title]) => (
              <option key={id} value={id}>
                On {title}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[#6b7280]" />
        </div>
        <textarea
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
          placeholder="Write a comment…"
          aria-label="Write a comment"
          className="block w-full resize-none bg-transparent px-3 pt-2.5 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9ca3af]"
        />
        {files.length ? (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5">
            {files.map((file, index) => (
              <span key={index} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[#eef2fb] py-1 pr-1 pl-2 text-[11px] font-medium text-[#1f2530]">
                <FileText size={12} strokeWidth={2} className="shrink-0 text-[#2f5fd8]" />
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
              className="grid size-7 cursor-pointer place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#2f5fd8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Paperclip size={15} strokeWidth={2} />
            </button>
            {files.length ? (
              <span className="rounded-full bg-[#2563eb] px-1.5 py-px text-[10.5px] font-bold text-white">
                {files.length} file{files.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-[10.5px] text-[#9ca3af]">The client sees this</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void post()}
            disabled={!ready}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#0b0c24] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1e2140] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} strokeWidth={2.25} />} {sending ? "Posting…" : "Comment"}
          </button>
        </div>
      </div>
      {done ? (
        <p role="status" className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#e7f6ec] px-2.5 py-1.5 text-[12px] font-semibold text-[#15803d]">
          <CheckCircle2 size={13} strokeWidth={2.5} /> {done}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[12px] font-medium text-[#b42318]">
          {error}
        </p>
      ) : null}

      {onPosted ? null : (
        <Link href={`/clients/${clientId}/onboarding`} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563eb] no-underline hover:underline">
          Open the onboarding page <ArrowRight size={13} strokeWidth={2.25} />
        </Link>
      )}
    </div>
  );
};

export default OnboardingComments;
