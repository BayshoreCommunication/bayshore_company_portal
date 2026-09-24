"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Save,
  Layers,
  Link2,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  changeContentStatusAction,
  deleteContentAction,
  listContentAction,
  type ContentBatchResponse,
  type ContentComment,
  type ContentItem,
  type ContentStatus,
} from "@/app/actions/content";
import { avatarColorFor, initialsOf } from "@/component/clients/clientUi";
import Picker, { type PickerOption } from "@/component/shared/Picker";
import {
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDraft,
  fieldHintPlain,
  fieldLabel,
  inputText,
  pageDesc,
  pageTitle,
  requiredStar,
  sectionCard,
  textareaBase,
} from "@/component/shared/ui";
import { STATUS_BADGES, filesOf, formatDateTime, personNameOf } from "./contentUi";
import {
  BATCH_OPTIONS,
  type Batch,
  type Draft,
  KIND_OPTIONS,
  type Upload,
  UploadBox,
  blankDraft,
  monthOptions,
  weekLabel,
  weekOptions,
} from "./contentForm";
import {
  CONTENT_KINDS,
  CTA_OPTIONS,
  MAX_FILES_PER_SAVE,
  mediaOf,
  uploadNoun,
  uploadProblem,
  type ContentKind,
} from "./contentKinds";

// ── Choices ──────────────────────────────────────────────────────────────────

const STATUS_ORDER: ContentStatus[] = ["draft", "pending_approval", "revision_requested", "approved"];

// One color per status, for the progress bar and the filter tabs.
const STATUS_COLOR: Record<ContentStatus, string> = {
  draft: "#94a3b8",
  pending_approval: "#d97706",
  revision_requested: "#dc2626",
  approved: "#16a34a",
};

// ── Pieces of content ────────────────────────────────────────────────────────

// One row in the batch — either already on file or just added on this page.
type BatchItem = {
  id: string;
  type: ContentKind;
  title: string;
  caption?: string;
  files: Upload[];
  link?: string;
  by: string;
  updatedAt: string;
  status: ContentStatus;
  comments: ContentComment[];
  weekStart?: string;
};

// ── Small pieces ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: ContentStatus }) => {
  const badge = STATUS_BADGES[status];
  return (
    <span className={`${badge.badge} shrink-0`}>
      <span className={badge.dot} /> {badge.label}
    </span>
  );
};

// "just now", "5m ago", "3h ago", "6d ago" — older than a month shows the date.
const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 30 ? `${days}d ago` : formatDateTime(iso);
};

// One piece in the batch: what it is, where it stands, and the conversation about it.
const BatchItemCard = ({
  item,
  clientName,
  busy = false,
  onSend,
  onRemove,
}: {
  item: BatchItem;
  clientName: string;
  // A request for this piece is in flight — which one, so its button can spin.
  busy?: "send" | "remove" | false;
  onSend: () => void;
  onRemove?: () => void;
}) => {
  const [showAll, setShowAll] = useState(false);
  const meta = CONTENT_KINDS[item.type];
  const cover = item.files.find((file) => file.media === "image");
  const canSend = item.status === "draft" || item.status === "revision_requested";
  const comments = showAll ? item.comments : item.comments.slice(-1);

  return (
    <li className="relative overflow-hidden rounded-xl border border-[#e6ebe8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
      {/* A stripe in the status color, so the list reads at a glance. */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: STATUS_COLOR[item.status] }} />

      <div className="flex gap-3 py-3 pr-3 pl-4">
        <div className="relative shrink-0">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ background: meta.background, color: meta.color }}
            >
              <meta.icon size={20} strokeWidth={1.75} />
            </span>
          )}
          {item.files.length > 1 ? (
            <span className="absolute -right-1.5 -bottom-1.5 rounded-full border-2 border-white bg-[#0b1522] px-1.5 text-[9.5px] leading-4 font-bold text-white">
              +{item.files.length - 1}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="line-clamp-2 text-[13px] leading-snug font-bold text-[#0d1e2c]">{item.title}</div>
            <StatusBadge status={item.status} />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10.5px] text-[#7a8e9b]">
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.75 py-px font-semibold"
              style={{ background: meta.background, color: meta.color }}
            >
              <meta.icon size={10} strokeWidth={2.5} /> {meta.label}
            </span>
            <span>by {item.by}</span>
            <span className="text-[#c3cdc8]">•</span>
            <span title={formatDateTime(item.updatedAt)}>{timeAgo(item.updatedAt)}</span>
          </div>

          {canSend || onRemove ? (
            <div className="mt-2.5 flex items-center gap-1.5">
              {canSend ? (
                <button
                  type="button"
                  onClick={onSend}
                  disabled={Boolean(busy)}
                  aria-busy={busy === "send"}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold text-white disabled:cursor-wait ${
                    item.status === "draft" ? "bg-[#2563eb] hover:bg-[#1d4ed8]" : "bg-[#d97706] hover:bg-[#b45309]"
                  }`}
                >
                  {busy === "send" ? (
                    <Loader2 size={11} strokeWidth={2.5} className="animate-spin" />
                  ) : (
                    <Send size={11} strokeWidth={2.25} />
                  )}{" "}
                  {busy === "send" ? "Sending…" : item.status === "draft" ? "Send to client" : "Re-submit"}
                </button>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  aria-label={`Remove ${item.title}`}
                  onClick={onRemove}
                  disabled={Boolean(busy)}
                  aria-busy={busy === "remove"}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#8496a3] hover:bg-[#fdecec] hover:text-[#b42318] disabled:cursor-wait"
                >
                  {busy === "remove" ? (
                    <>
                      <Loader2 size={11} strokeWidth={2.5} className="animate-spin" /> Removing…
                    </>
                  ) : (
                    <>
                      <Trash2 size={11} strokeWidth={2} /> Remove
                    </>
                  )}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[#eef3ef] bg-[#f8faf9] py-2.5 pr-3 pl-4">
        {item.comments.length > 0 ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.4px] text-[#7a8d9b] uppercase">
                <MessageSquare size={11} strokeWidth={2.25} /> Comments · {item.comments.length}
              </span>
              {item.comments.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  className="cursor-pointer text-[11px] font-semibold text-[#2563eb] hover:underline"
                >
                  {showAll ? "Latest only" : "View all"}
                </button>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              {comments.map((entry, index) => {
                const fromClient = entry.author === "client";
                const author = entry.name ?? personNameOf(entry.user) ?? (fromClient ? clientName : "BayShore");
                return (
                  <div key={`${entry.createdAt}-${index}`} className="flex gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold text-white ${
                        fromClient ? "bg-[#2563eb]" : "bg-[#0f1c2a]"
                      }`}
                    >
                      {initialsOf(author)}
                    </span>
                    <div
                      className={`min-w-0 flex-1 rounded-lg rounded-tl-sm border px-2.5 py-1.75 ${
                        fromClient ? "border-[#dbeafe] bg-[#f5f9ff]" : "border-[#eef3ef] bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-x-1.5 text-[10.5px]">
                        <span className="font-bold text-[#172632]">{author}</span>
                        <span
                          className={`rounded-full px-1.5 text-[9px] font-bold ${
                            fromClient ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#eef3ef] text-[#556977]"
                          }`}
                        >
                          {fromClient ? "Client" : "Team"}
                        </span>
                        <span className="text-[#8496a3]" title={formatDateTime(entry.createdAt)}>
                          {timeAgo(entry.createdAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] leading-normal whitespace-pre-line text-[#33434f]">{entry.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[#9aacb8]">
            <MessageSquare size={12} strokeWidth={2} /> No comments yet
          </div>
        )}
      </div>
    </li>
  );
};

// ── One piece in the form ────────────────────────────────────────────────────

// A piece being written. Several can be filled in at once and added together.
type Block = { id: string; type: ContentKind; draft: Draft; error: string | null };

const newBlock = (type: ContentKind = "image"): Block => ({
  id: `block-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
  type,
  draft: blankDraft(),
  error: null,
});

// What's still missing before this piece can be added — or null when it's ready.
const problemWith = ({ type, draft }: Block) => {
  const spec = CONTENT_KINDS[type];
  if (!draft.title.trim()) return "Give this piece a title.";
  const hasLink = Boolean(spec.linkPlaceholder && draft.link.trim());
  if (draft.files.length < spec.minFiles && !hasLink) {
    return spec.minFiles > 1
      ? `A ${spec.label.toLowerCase()} needs at least ${spec.minFiles} images.`
      : `Upload the ${uploadNoun(type)}${spec.linkPlaceholder ? " or paste a link" : ""}.`;
  }
  if (spec.fields.includes("pageName") && !draft.pageName.trim()) return "Say which page this copy is for.";
  if (spec.fields.includes("subject") && !draft.subject.trim()) return "Add the email subject line.";
  if (spec.fields.includes("headline") && !draft.headline.trim()) return "Add the ad headline.";
  return null;
};

const ContentBlock = ({
  block,
  index,
  count,
  onChange,
  onRemove,
  onAddAnother,
  onPreviewUrl,
}: {
  block: Block;
  index: number;
  count: number;
  onChange: (update: (block: Block) => Block) => void;
  onRemove: () => void;
  // Only the last block offers to add another.
  onAddAnother?: () => void;
  // Every preview URL is handed up so the page can free them all when it closes.
  onPreviewUrl: (url: string) => void;
}) => {
  const { type, draft } = block;
  const spec = CONTENT_KINDS[type];

  const setError = (error: string | null) => onChange((current) => ({ ...current, error }));
  const setDraft = (update: (draft: Draft) => Draft) => onChange((current) => ({ ...current, draft: update(current.draft) }));
  const patch = (next: Partial<Draft>) => onChange((current) => ({ ...current, error: null, draft: { ...current.draft, ...next } }));

  // Turn picked files into previewable uploads, keeping only what this kind accepts.
  const toUploads = (picked: File[]) => {
    const fitsKind = picked.filter((file) => spec.media.includes(mediaOf(file)));
    const problems = fitsKind.map(uploadProblem).filter(Boolean);
    const allowed = fitsKind.filter((file) => !uploadProblem(file));
    if (fitsKind.length < picked.length) setError(`${spec.label} takes ${uploadNoun(type)} only — some files were skipped.`);
    else if (problems.length) setError(`${problems.join("; ")} — skipped.`);

    const uploads: Upload[] = allowed.map((file) => {
      const url = URL.createObjectURL(file);
      onPreviewUrl(url);
      return { name: file.name, size: file.size, url, media: mediaOf(file), mime: file.type, file };
    });
    // Plain-text files are shown as text, so read the start of each one.
    allowed.forEach((file, index) => {
      if (!file.type.startsWith("text/")) return;
      const url = uploads[index].url;
      file.text().then((text) =>
        setDraft((current) => ({
          ...current,
          files: current.files.map((upload) => (upload.url === url ? { ...upload, text: text.slice(0, 4000) } : upload)),
        })),
      );
    });
    return uploads;
  };

  const pickFiles = (picked: File[]) => {
    const uploads = toUploads(picked);
    if (!uploads.length) return;
    const room = spec.maxFiles - draft.files.length;
    if (uploads.length > room) setError(`Up to ${spec.maxFiles} files per piece — only the first ${Math.max(0, room)} were added.`);
    setDraft((current) => ({
      ...current,
      files: [...current.files, ...uploads].slice(0, spec.maxFiles),
      title: current.title || uploads[0].name.replace(/\.[^.]+$/, ""),
    }));
  };

  const replaceFile = (index: number, file: File) => {
    const [upload] = toUploads([file]);
    if (upload) setDraft((current) => ({ ...current, files: current.files.map((old, i) => (i === index ? upload : old)) }));
  };

  const changeType = (next: ContentKind) => onChange((current) => ({ ...current, type: next, draft: blankDraft(), error: null }));

  const body = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={fieldLabel} htmlFor={`${block.id}-type`}>
            Content type <span className={requiredStar}>*</span>
          </label>
          <Picker id={`${block.id}-type`} value={type} options={KIND_OPTIONS} onChange={(next) => changeType(next as ContentKind)} />
        </div>
        <div>
          <label className={fieldLabel} htmlFor={`${block.id}-title`}>
            Title <span className={requiredStar}>*</span>
          </label>
          <input
            id={`${block.id}-title`}
            type="text"
            className={`${inputText} h-13.5`}
            placeholder="Filled in from the file name — edit if you like"
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
          />
        </div>
      </div>

      <UploadBox
        kind={type}
        files={draft.files}
        onPick={pickFiles}
        onReplace={replaceFile}
        onRemove={(index) => patch({ files: draft.files.filter((_, i) => i !== index) })}
      />

      {spec.linkPlaceholder && !draft.files.length ? (
        <div className="relative">
          <Link2 size={14} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8496a3]" />
          <input
            aria-label={`${spec.label} link`}
            type="url"
            className="w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] py-2.25 pr-3 pl-8.5 text-[12.5px] text-[#17242f] outline-none focus:border-[#2563eb] focus:bg-white"
            placeholder={spec.linkPlaceholder}
            value={draft.link}
            onChange={(event) => patch({ link: event.target.value })}
          />
        </div>
      ) : null}

      {spec.fields.includes("pageName") ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel} htmlFor={`${block.id}-pageName`}>
              Page <span className={requiredStar}>*</span>
            </label>
            <input
              id={`${block.id}-pageName`}
              type="text"
              className={inputText}
              placeholder="e.g. Home, Services, About Us"
              value={draft.pageName}
              onChange={(event) => patch({ pageName: event.target.value })}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor={`${block.id}-pageUrl`}>
              Page URL
            </label>
            <input
              id={`${block.id}-pageUrl`}
              type="url"
              className={inputText}
              placeholder="e.g. carterinjurylaw.com/services"
              value={draft.pageUrl}
              onChange={(event) => patch({ pageUrl: event.target.value })}
            />
          </div>
        </div>
      ) : null}

      {spec.fields.includes("subject") ? (
        <div>
          <label className={fieldLabel} htmlFor={`${block.id}-subject`}>
            Subject line <span className={requiredStar}>*</span>
          </label>
          <input
            id={`${block.id}-subject`}
            type="text"
            className={inputText}
            placeholder="e.g. 3 things to do after a car accident"
            value={draft.subject}
            onChange={(event) => patch({ subject: event.target.value })}
          />
        </div>
      ) : null}

      {spec.fields.includes("headline") || spec.fields.includes("cta") ? (
        <div className="grid grid-cols-2 gap-4">
          {spec.fields.includes("headline") ? (
            <div>
              <label className={fieldLabel} htmlFor={`${block.id}-headline`}>
                Headline <span className={requiredStar}>*</span>
              </label>
              <input
                id={`${block.id}-headline`}
                type="text"
                className={inputText}
                placeholder="e.g. Hurt in a crash? Free case review"
                value={draft.headline}
                onChange={(event) => patch({ headline: event.target.value })}
              />
            </div>
          ) : null}
          {spec.fields.includes("cta") ? (
            <div>
              <label className={fieldLabel} htmlFor={`${block.id}-cta`}>
                Button
              </label>
              <select
                id={`${block.id}-cta`}
                className={`${inputText} cursor-pointer`}
                value={draft.cta}
                onChange={(event) => patch({ cta: event.target.value })}
              >
                <option value="">No button</option>
                {CTA_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className={fieldLabel} htmlFor={`${block.id}-caption`}>
          {spec.captionLabel}
        </label>
        <textarea
          id={`${block.id}-caption`}
          className={`${textareaBase} h-20`}
          placeholder={spec.captionPlaceholder}
          value={draft.caption}
          onChange={(event) => patch({ caption: event.target.value })}
        />
      </div>

      {onAddAnother ? (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={onAddAnother}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[#93c5fd] bg-[#eff6ff] px-3 py-1.5 text-[12px] font-semibold text-[#2563eb] hover:border-[#2563eb] hover:bg-[#dbeafe]"
          >
            <Plus size={13} strokeWidth={2.5} /> Add another content
          </button>
        </div>
      ) : null}

      {block.error ? (
        <div
          className="rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b42318]"
          role="alert"
        >
          {block.error}
        </div>
      ) : null}
    </div>
  );

  // A lone piece needs no frame; several get numbered cards so they're easy to tell apart.
  if (count === 1) return body;

  const Icon = spec.icon;
  return (
    <div className={`rounded-xl border bg-white p-4 ${block.error ? "border-[#f5c2c2]" : "border-[#dbe3de]"}`}>
      <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-[#eef3ef] pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: spec.background, color: spec.color }}
          >
            <Icon size={14} strokeWidth={2} />
          </span>
          <span className="text-[13px] font-bold text-[#0d1e2c]">Content {index + 1}</span>
          <span className="truncate text-[12px] text-[#7a8e9b]">
            {spec.label}
            {draft.title ? ` · ${draft.title}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold text-[#8496a3] hover:bg-[#fdecec] hover:text-[#b42318]"
        >
          <Trash2 size={12} strokeWidth={2} /> Remove
        </button>
      </div>
      {body}
    </div>
  );
};

// ── The page ─────────────────────────────────────────────────────────────────

export type ClientOption = { _id: string; companyName: string; contactName?: string };

// A stored piece, as the status list shows it.
const toBatchItem = (item: ContentItem): BatchItem => ({
  id: item._id,
  type: item.type,
  title: item.title,
  caption: item.caption,
  files: filesOf(item).map((file) => ({ name: file.name, size: file.size, url: file.url, media: file.media, mime: file.mimeType })),
  link: item.link,
  by: personNameOf(item.createdBy) ?? "—",
  updatedAt: item.updatedAt,
  status: item.status,
  comments: item.comments,
  weekStart: item.weekStart,
});

// Sends the form to the upload route, reporting progress (0–100) as the files go up.
// XMLHttpRequest rather than fetch, because fetch can't report upload progress.
const uploadBatch = (form: FormData, onProgress: (percent: number) => void) =>
  new Promise<{ status: number; body: ContentBatchResponse }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/content/batch");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve({
        status: request.status,
        body: (request.response as ContentBatchResponse | null) ?? { success: false, message: "The server sent an unexpected response." },
      });
    request.onerror = () => reject(new Error("Network error"));
    request.send(form);
  });

// "Piece 2: Headline is required…" → piece index 1, and the message.
const pieceProblem = (message: string) => {
  const match = /^Piece (\d+): (.*)$/.exec(message);
  return match ? { index: Number(match[1]) - 1, message: match[2] } : null;
};

const AddContent = ({
  clients,
  initialClientId = "",
  canDelete = false,
}: {
  clients: ClientOption[];
  initialClientId?: string;
  // Superadmins only — everyone else gets no Remove button in the batch list.
  canDelete?: boolean;
}) => {
  const [clientId, setClientId] = useState(() => (clients.some((option) => option._id === initialClientId) ? initialClientId : ""));
  const [batch, setBatch] = useState<Batch>("monthly");
  const [month, setMonth] = useState(() => monthOptions()[1].value);
  const [weekStart, setWeekStart] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [reason, setReason] = useState("");

  const [blocks, setBlocks] = useState<Block[]>(() => [newBlock()]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContentStatus | "all">("all");
  // Upload progress while saving (0–100), or null when nothing is being saved.
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const saving = uploadProgress !== null;
  // Which save button was pressed, so that one shows the spinner.
  const [savingAs, setSavingAs] = useState<"draft" | "pending_approval">("draft");
  // Pieces in the status list with a request in flight.
  const [busyIds, setBusyIds] = useState<Record<string, "send" | "remove">>({});

  // Every preview URL made on this page, freed when leaving it.
  const previewUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const client = clients.find((option) => option._id === clientId) ?? null;

  // The chosen batch as it's stored. Bumping `reloads` fetches it again after a change.
  const [reloads, setReloads] = useState(0);
  const reload = () => setReloads((count) => count + 1);
  const batchKey = client ? `${client._id}|${month}|${batch}|${reloads}` : "";
  const [loaded, setLoaded] = useState<{ key: string; items: BatchItem[]; error?: string } | null>(null);
  const loading = Boolean(batchKey) && loaded?.key !== batchKey;

  useEffect(() => {
    if (!client) return;
    let current = true;
    listContentAction({ client: client._id, batchMonth: month, batchType: batch, limit: 100 }).then((result) => {
      if (!current) return;
      setLoaded(
        result.ok && result.data
          ? { key: batchKey, items: result.data.items.map(toBatchItem) }
          : { key: batchKey, items: [], error: result.error ?? "Couldn't load this batch." },
      );
    });
    return () => {
      current = false;
    };
    // batchKey covers client, month, batch and reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchKey]);

  const stored = loaded?.key === batchKey ? loaded.items : [];
  // Weekly batches share a month — show the chosen week's pieces (or all of the month's until one is picked).
  const items = batch === "weekly" && weekStart ? stored.filter((item) => !item.weekStart || item.weekStart.startsWith(weekStart)) : stored;
  const statusCounts = STATUS_ORDER.map((status) => ({ status, count: items.filter((item) => item.status === status).length }));
  const drafts = items.filter((item) => item.status === "draft");
  const shown = filter === "all" ? items : items.filter((item) => item.status === filter);
  // Under "All", group by what happens next: what needs the team, what waits on the client, what's done.
  const groups =
    filter === "all"
      ? [
          {
            title: "Needs changes",
            color: STATUS_COLOR.revision_requested,
            items: items.filter((item) => item.status === "revision_requested"),
          },
          { title: "Drafts — not sent yet", color: STATUS_COLOR.draft, items: items.filter((item) => item.status === "draft") },
          {
            title: "Waiting on client",
            color: STATUS_COLOR.pending_approval,
            items: items.filter((item) => item.status === "pending_approval"),
          },
          { title: "Approved", color: STATUS_COLOR.approved, items: items.filter((item) => item.status === "approved") },
        ].filter((group) => group.items.length)
      : [{ title: "", color: "", items: shown }];

  const batchReady =
    batch === "monthly" ||
    (batch === "weekly" && weekStart !== "") ||
    (batch === "event" && eventName.trim() !== "" && eventDate !== "") ||
    (batch === "individual" && reason.trim() !== "");
  const contentLocked = !client || !batchReady;

  const batchLabel =
    batch === "monthly"
      ? month
      : batch === "weekly"
        ? weekStart
          ? weekLabel(weekStart)
          : `Weekly · ${month}`
        : batch === "event"
          ? `${eventName || "Event"} · ${month}`
          : `Individual · ${month}`;

  const clientOptions: PickerOption[] = clients.map((option) => ({
    value: option._id,
    label: option.companyName,
    sub: option.contactName ? `Contact: ${option.contactName}` : undefined,
    initials: initialsOf(option.companyName),
    color: avatarColorFor(option._id),
  }));

  const updateBlock = (id: string, update: (block: Block) => Block) =>
    setBlocks((current) => current.map((block) => (block.id === id ? update(block) : block)));

  const addAnother = () => setBlocks((current) => [...current, newBlock(current[current.length - 1]?.type)]);

  const clearAll = () => {
    setBlocks([newBlock()]);
    setError(null);
  };

  // Save every piece in the form at once — as drafts, or sent straight to the client —
  // or point at what's missing. Files go up through the upload route with progress.
  const addToBatch = async (status: "draft" | "pending_approval") => {
    setError(null);
    if (!client) return setError("Select a client first.");
    if (!batchReady) return setError("Fill in the batch details first.");

    const checked = blocks.map((block) => ({ ...block, error: problemWith(block) }));
    if (checked.some((block) => block.error)) {
      setBlocks(checked);
      const missing = checked.filter((block) => block.error).length;
      if (blocks.length > 1) setError(`${missing} of ${blocks.length} pieces need a bit more — see the notes in red.`);
      return;
    }

    const fileCount = blocks.reduce((sum, block) => sum + block.draft.files.length, 0);
    if (fileCount > MAX_FILES_PER_SAVE) {
      return setError(
        `That's ${fileCount} files — save at most ${MAX_FILES_PER_SAVE} at a time. Save some pieces first, then add the rest.`,
      );
    }

    const form = new FormData();
    form.set("client", client._id);
    form.set("batchMonth", month);
    form.set("batchType", batch);
    form.set("status", status);
    if (batch === "weekly") form.set("weekStart", weekStart);
    if (batch === "event") {
      form.set("eventName", eventName.trim());
      form.set("eventDate", eventDate);
    }
    if (batch === "individual") form.set("sentReason", reason.trim());
    form.set(
      "pieces",
      JSON.stringify(
        blocks.map(({ type, draft }) => ({
          type,
          title: draft.title.trim(),
          caption: draft.caption.trim() || undefined,
          link: draft.link.trim() || undefined,
          pageName: draft.pageName.trim() || undefined,
          pageUrl: draft.pageUrl.trim() || undefined,
          subject: draft.subject.trim() || undefined,
          headline: draft.headline.trim() || undefined,
          cta: draft.cta || undefined,
        })),
      ),
    );
    blocks.forEach((block, index) => {
      for (const upload of block.draft.files) if (upload.file) form.append(`files[${index}]`, upload.file, upload.name);
    });

    setSavingAs(status);
    setUploadProgress(0);
    try {
      const { status: code, body } = await uploadBatch(form, setUploadProgress);
      if (code >= 200 && code < 300) {
        toast.success(body.message);
        setBlocks([newBlock(blocks[blocks.length - 1].type)]);
        reload();
        return;
      }
      // "Piece 2: …" problems go on that piece's card; anything else goes under the form.
      const perPiece = new Map<number, string[]>();
      const general: string[] = [];
      for (const message of body.errors ?? []) {
        const problem = pieceProblem(message);
        if (problem && problem.index < blocks.length)
          perPiece.set(problem.index, [...(perPiece.get(problem.index) ?? []), problem.message]);
        else general.push(message);
      }
      if (perPiece.size)
        setBlocks((current) => current.map((block, index) => ({ ...block, error: perPiece.get(index)?.join(" ") ?? null })));
      setError([body.message, ...general].filter(Boolean).join(" — "));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again — nothing was saved.");
    } finally {
      setUploadProgress(null);
    }
  };

  // Run a request for one piece in the status list, marking it busy meanwhile.
  const markBusy = (ids: string[], kind: "send" | "remove" | null) =>
    setBusyIds((current) => {
      const next = { ...current };
      for (const id of ids) {
        if (kind) next[id] = kind;
        else delete next[id];
      }
      return next;
    });

  const withBusy = async (id: string, kind: "send" | "remove", run: () => Promise<boolean>) => {
    markBusy([id], kind);
    const ok = await run();
    markBusy([id], null);
    if (ok) reload();
  };

  const send = (id: string) =>
    withBusy(id, "send", async () => {
      const result = await changeContentStatusAction(id, "pending_approval");
      if (!result.ok) toast.error(result.error ?? "Couldn't send it for approval.");
      else toast.success(`Sent to ${client?.companyName} for approval`);
      return result.ok;
    });

  const remove = (item: BatchItem) => {
    if (!window.confirm(`Delete "${item.title}"? Its files are deleted too. This can't be undone.`)) return;
    withBusy(item.id, "remove", async () => {
      const result = await deleteContentAction(item.id);
      if (!result.ok) toast.error(result.error ?? "Couldn't delete this content.");
      else toast.success("Content deleted");
      return result.ok;
    });
  };

  const sendAllDrafts = async () => {
    const ids = drafts.map((item) => item.id);
    markBusy(ids, "send");
    const results = await Promise.all(ids.map((id) => changeContentStatusAction(id, "pending_approval")));
    markBusy(ids, null);
    const failed = results.filter((result) => !result.ok).length;
    const sent = ids.length - failed;
    if (sent) toast.success(`${sent} item${sent === 1 ? "" : "s"} sent to ${client?.companyName} for approval`);
    if (failed) toast.error(`${failed} item${failed === 1 ? "" : "s"} couldn't be sent`);
    reload();
  };

  // What the pressed save button says while it works.
  const hasFiles = blocks.some((block) => block.draft.files.some((file) => file.file));
  const savingLabel = hasFiles && (uploadProgress ?? 0) < 100 ? `Uploading ${uploadProgress ?? 0}%` : "Saving…";

  const stepLabel = "mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.5px] text-[#7a8d9b] uppercase";
  const stepDot = "flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0b1522] text-[10px] text-white";

  const TABS: { value: ContentStatus | "all"; label: string; count: number; color: string }[] = [
    { value: "all", label: "All", count: items.length, color: "#0b1522" },
    ...statusCounts.map(({ status, count }) => ({
      value: status,
      label: status === "pending_approval" ? "Pending" : status === "revision_requested" ? "Revision" : STATUS_BADGES[status].label,
      count,
      color: STATUS_COLOR[status],
    })),
  ];
  const approvedCount = statusCounts.find(({ status }) => status === "approved")?.count ?? 0;
  // Approved first, so the bar fills from the left as work gets signed off.
  const progress = (["approved", "pending_approval", "revision_requested", "draft"] as const).map((status) => ({
    status,
    count: statusCounts.find((entry) => entry.status === status)?.count ?? 0,
  }));

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/content" className={breadcrumbLink}>
            Content
          </Link>{" "}
          / <b>Add Content</b>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className={pageTitle}>Add Content</div>
          <div className={pageDesc}>Pick the client and batch, upload a piece, then send it to the client for approval.</div>
        </div>
        <Link href="/content" className={`${btnDraft} inline-flex items-center gap-1.5 no-underline`}>
          <ArrowLeft size={14} strokeWidth={2} /> Content List
        </Link>
      </div>

      <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        {/* New piece */}
        <div className={sectionCard}>
          {/* ① Where it goes */}
          <div className="rounded-xl border border-[#dbeafe] bg-[linear-gradient(180deg,#f5f9ff,#ffffff)] p-4">
            <div className={stepLabel}>
              <span className={stepDot}>1</span> Client &amp; batch
            </div>
            <div className="grid grid-cols-3 gap-3.5">
              <div>
                <label className={fieldLabel} htmlFor="client">
                  Client <span className={requiredStar}>*</span>
                </label>
                <Picker
                  id="client"
                  value={clientId}
                  options={clientOptions}
                  onChange={setClientId}
                  placeholder="Select a client"
                  placeholderIcon={Building2}
                  searchable
                  searchPlaceholder="Search clients…"
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="month">
                  Month <span className={requiredStar}>*</span>
                </label>
                <Picker
                  id="month"
                  value={month}
                  options={monthOptions()}
                  onChange={(next) => {
                    setMonth(next);
                    setWeekStart("");
                  }}
                  placeholderIcon={CalendarDays}
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="batch">
                  Content batch <span className={requiredStar}>*</span>
                </label>
                <Picker
                  id="batch"
                  value={batch}
                  options={BATCH_OPTIONS}
                  onChange={(next) => setBatch(next as Batch)}
                  placeholderIcon={Layers}
                />
              </div>
            </div>

            {batch === "weekly" ? (
              <div className="mt-3.5 grid grid-cols-3 gap-3.5">
                <div className="col-span-2">
                  <label className={fieldLabel} htmlFor="week">
                    Week <span className={requiredStar}>*</span>
                  </label>
                  <Picker
                    id="week"
                    value={weekStart}
                    options={weekOptions(month)}
                    onChange={setWeekStart}
                    placeholder={`Pick a week in ${month}`}
                    placeholderIcon={CalendarRange}
                  />
                </div>
              </div>
            ) : null}

            {batch === "event" ? (
              <div className="mt-3.5 grid grid-cols-3 gap-3.5">
                <div className="col-span-2">
                  <label className={fieldLabel} htmlFor="eventName">
                    Event name <span className={requiredStar}>*</span>
                  </label>
                  <input
                    id="eventName"
                    type="text"
                    className={inputText}
                    placeholder="e.g. Hurricane Preparedness Week"
                    value={eventName}
                    onChange={(event) => setEventName(event.target.value)}
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="eventDate">
                    Event date <span className={requiredStar}>*</span>
                  </label>
                  <input
                    id="eventDate"
                    type="date"
                    className={inputText}
                    value={eventDate}
                    onChange={(event) => setEventDate(event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {batch === "individual" ? (
              <div className="mt-3.5">
                <label className={fieldLabel} htmlFor="reason">
                  Why is it sent on its own? <span className={requiredStar}>*</span>
                </label>
                <input
                  id="reason"
                  type="text"
                  className={inputText}
                  placeholder="e.g. Storm forecast this weekend — needs to go out before Friday"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className={fieldHintPlain}>The client sees this note next to the piece.</div>
              </div>
            ) : null}
          </div>

          {/* ② The piece */}
          <fieldset
            disabled={contentLocked || saving}
            className={`mt-5 border-t border-[#eef3ef] pt-5 transition-opacity ${contentLocked ? "pointer-events-none opacity-50" : ""}`}
          >
            <div className={`${stepLabel} justify-between`}>
              <span className="flex items-center gap-2">
                <span className={stepDot}>2</span> Content
              </span>
              {contentLocked ? (
                <span className="text-[11px] font-semibold tracking-normal text-[#a35a12] normal-case">
                  {client ? "Finish the batch details first" : "Pick a client first"}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              {blocks.map((block, index) => (
                <ContentBlock
                  key={block.id}
                  block={block}
                  index={index}
                  count={blocks.length}
                  onChange={(update) => updateBlock(block.id, update)}
                  onRemove={() => setBlocks((current) => current.filter((other) => other.id !== block.id))}
                  onAddAnother={index === blocks.length - 1 ? addAnother : undefined}
                  onPreviewUrl={(url) => previewUrls.current.push(url)}
                />
              ))}

              {error ? (
                <div
                  className="rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b42318]"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2.5 border-t border-[#eef3ef] pt-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="mr-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2.25 text-[12.5px] font-semibold text-[#7a8e9b] hover:bg-[#f1f5f3] hover:text-[#17242f]"
                >
                  <X size={13} strokeWidth={2.5} /> Clear all
                </button>
                <button
                  type="button"
                  onClick={() => addToBatch("draft")}
                  disabled={saving}
                  aria-busy={saving && savingAs === "draft"}
                  className={`${btnDraft} inline-flex items-center gap-1.5 disabled:cursor-wait`}
                >
                  {saving && savingAs === "draft" ? (
                    <>
                      <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> {savingLabel}
                    </>
                  ) : (
                    <>
                      <Save size={14} strokeWidth={2} /> Save as Draft{blocks.length > 1 ? ` (${blocks.length})` : ""}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => addToBatch("pending_approval")}
                  disabled={saving}
                  aria-busy={saving && savingAs === "pending_approval"}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#2563eb] px-4.5 py-2.5 text-[12.5px] font-bold text-white hover:bg-[#1d4ed8] disabled:cursor-wait"
                >
                  {saving && savingAs === "pending_approval" ? (
                    <>
                      <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> {savingLabel}
                    </>
                  ) : (
                    <>
                      <Send size={14} strokeWidth={2} /> Send to Client for Approval{blocks.length > 1 ? ` (${blocks.length})` : ""}
                    </>
                  )}
                </button>
              </div>

            </div>
          </fieldset>
        </div>

        {/* The batch, with each piece's status and comments */}
        <aside className="rounded-[10px] border border-[#dbe3de] bg-white min-[1100px]:sticky min-[1100px]:top-4">
          <div className="border-b border-[#eef3ef] px-4.5 pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-bold text-[#0d1e2c]">Content Status</div>
              {client ? (
                <span className="text-[11px] font-semibold text-[#7a8e9b]">
                  {items.length} {items.length === 1 ? "piece" : "pieces"}
                </span>
              ) : null}
            </div>

            {client ? (
              <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-[#eef3ef] bg-[#f7f9f8] p-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                  style={{ background: avatarColorFor(client._id) }}
                >
                  {initialsOf(client.companyName)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-[#0d1e2c]">{client.companyName}</div>
                  <span className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full border border-[#dbe3de] bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#556977]">
                    <CalendarDays size={11} strokeWidth={2.25} className="shrink-0" />
                    <span className="truncate">{batchLabel}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-dashed border-[#cbd6d0] p-2.5 text-[12px] text-[#7a8e9b]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-[#9aacb8]">
                  <Building2 size={16} strokeWidth={2} />
                </span>
                Select a client to see its batch
              </div>
            )}

            {client && items.length ? (
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#384955]">Approval progress</span>
                  <span className="text-[#7a8e9b]">
                    <b className="text-[#16a34a]">{approvedCount}</b> of {items.length} approved
                  </span>
                </div>
                <div className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-[#eef3ef]">
                  {progress
                    .filter(({ count }) => count > 0)
                    .map(({ status, count }) => (
                      <span
                        key={status}
                        title={`${STATUS_BADGES[status].label}: ${count}`}
                        className="h-full transition-[width] duration-300"
                        style={{ width: `${(count / items.length) * 100}%`, background: STATUS_COLOR[status] }}
                      />
                    ))}
                </div>
              </div>
            ) : null}

            <div className="mt-3.5 grid grid-cols-5 gap-1 rounded-lg bg-[#f3f6f4] p-1">
              {TABS.map((tab) => {
                const active = filter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    aria-pressed={active}
                    className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-md px-1 py-1.5 transition-colors ${
                      active ? "bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12)]" : "hover:bg-white/60"
                    }`}
                  >
                    <span
                      className="flex items-center gap-1 text-[14px] leading-none font-bold"
                      style={{ color: tab.count ? tab.color : "#b7c2cb" }}
                    >
                      {tab.value !== "all" ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: tab.color }} /> : null}
                      {tab.count}
                    </span>
                    <span className={`text-[10px] font-semibold ${active ? "text-[#0d1e2c]" : "text-[#7a8e9b]"}`}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[calc(100vh-320px)] overflow-y-auto bg-[#fbfcfb] px-4 py-4">
            {!client ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#2563eb]">
                  <Building2 size={22} strokeWidth={1.75} />
                </span>
                <div className="text-[13px] font-bold text-[#0d1e2c]">Pick a client to begin</div>
                <div className="mt-1 max-w-55 text-[11.5px] leading-normal text-[#7a8e9b]">
                  Their content for the chosen month shows up here, with its status and comments.
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Loading the batch">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-18 animate-pulse rounded-xl bg-[#eef3ef]" />
                ))}
              </div>
            ) : loaded?.error ? (
              <div className="py-8 text-center text-[12.5px] font-semibold text-[#b42318]">
                {loaded.error}{" "}
                <button type="button" onClick={reload} className="cursor-pointer text-[#2563eb] underline">
                  Try again
                </button>
              </div>
            ) : shown.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3ef] text-[#8496a3]">
                  <UploadCloud size={22} strokeWidth={1.75} />
                </span>
                <div className="text-[13px] font-bold text-[#0d1e2c]">
                  {items.length === 0 ? "Nothing in this batch yet" : "Nothing with this status"}
                </div>
                <div className="mt-1 max-w-55 text-[11.5px] leading-normal text-[#7a8e9b]">
                  {items.length === 0 ? "Add a piece on the left — it will show up here." : "Try another tab above."}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {groups.map((group) => (
                  <section key={group.title || "list"}>
                    {group.title ? (
                      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.4px] text-[#556977] uppercase">
                        <span className="h-2 w-2 rounded-full" style={{ background: group.color }} />
                        {group.title}
                        <span className="rounded-full bg-[#eef3ef] px-1.5 text-[10px] text-[#7a8e9b]">{group.items.length}</span>
                      </div>
                    ) : null}
                    <ul className="flex list-none flex-col gap-2.5">
                      {group.items.map((item) => (
                        <BatchItemCard
                          key={item.id}
                          item={item}
                          clientName={client.companyName}
                          busy={busyIds[item.id] ?? false}
                          onSend={() => send(item.id)}
                          onRemove={canDelete ? () => remove(item) : undefined}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-b-[10px] border-t border-[#eef3ef] bg-white px-4.5 py-3.5">
            {drafts.length ? (
              <>
                <div className="mb-2 text-[11.5px] text-[#556977]">
                  <b className="text-[#0d1e2c]">{drafts.length}</b> {drafts.length === 1 ? "draft is" : "drafts are"} ready to go to{" "}
                  {client?.companyName ?? "the client"}.
                </div>
                <button
                  type="button"
                  onClick={sendAllDrafts}
                  disabled={drafts.some((item) => busyIds[item.id])}
                  aria-busy={drafts.some((item) => busyIds[item.id] === "send")}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#e3a04a,#d0822a)] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_4px_12px_rgba(217,145,54,0.3)] hover:brightness-105 disabled:cursor-wait"
                >
                  {drafts.some((item) => busyIds[item.id] === "send") ? (
                    <>
                      <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send size={14} strokeWidth={2.25} /> Send {drafts.length} draft{drafts.length === 1 ? "" : "s"} for approval
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#f0fdf4] px-3 py-2.5 text-[12px] font-semibold text-[#15803d]">
                <CheckCircle2 size={15} strokeWidth={2.25} />
                {client && items.length ? "All caught up — no drafts waiting to send" : "No drafts yet"}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default AddContent;
