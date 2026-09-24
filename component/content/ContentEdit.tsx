"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  Clock,
  FileStack,
  Layers,
  Link2,
  Loader2,
  Lock,
  MessageSquare,
  Save,
  Send,
  UserRound,
} from "lucide-react";
import { changeContentStatusAction, type ContentItem, type ContentStatus } from "@/app/actions/content";
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
import CommentThread from "./CommentThread";
import { STATUS_BADGES, batchLabelOf, clientIdOf, clientNameOf, filesOf, formatDateTime, personNameOf } from "./contentUi";
import { BATCH_OPTIONS, type Batch, type Draft, type Upload, UploadBox, monthOptions, weekLabel, weekOptions } from "./contentForm";
import { CONTENT_KINDS, CTA_OPTIONS, mediaOf, uploadNoun, uploadProblem } from "./contentKinds";

// What a save sends back from the upload route (PATCH /api/content/:id).
type SaveResponse = { success: boolean; message: string; data?: ContentItem; errors?: string[] };

// What the status means for whoever is editing, shown above the form.
const STATUS_NOTE: Record<ContentStatus, { tone: string; text: string }> = {
  draft: { tone: "border-[#dbe3de] bg-[#f7f9f8] text-[#556977]", text: "Only your team can see this draft until it's sent to the client." },
  pending_approval: {
    tone: "border-[#fde7c2] bg-[#fff8ec] text-[#a35a12]",
    text: "The client is reviewing this piece — your changes show up for them as soon as you save.",
  },
  revision_requested: {
    tone: "border-[#f5c2c2] bg-[#fdf3f3] text-[#b42318]",
    text: "The client asked for changes. Make them here, then re-submit it for approval.",
  },
  approved: {
    tone: "border-[#bfe5cb] bg-[#effaf2] text-[#15803d]",
    text: "This piece is already approved. Saving keeps it approved — the client isn't asked again.",
  },
};

// The piece as the form holds it.
const draftOf = (item: ContentItem): Draft => ({
  title: item.title,
  caption: item.caption ?? "",
  link: item.link ?? "",
  files: filesOf(item).map((file) => ({ name: file.name, size: file.size, url: file.url, media: file.media, mime: file.mimeType })),
  pageName: item.pageName ?? "",
  pageUrl: item.pageUrl ?? "",
  subject: item.subject ?? "",
  headline: item.headline ?? "",
  cta: item.cta ?? "",
});

const dayOf = (iso?: string) => (iso ? iso.slice(0, 10) : "");

// Sends the form to the upload route, reporting progress (0–100) as new files go up.
const uploadChanges = (id: string, form: FormData, onProgress: (percent: number) => void) =>
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

const SideRow = ({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) => (
  <div className="flex items-start gap-2.5 py-2">
    <span className="mt-px flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md bg-[#f1f5f3] text-[#6a7d8a]">
      <Icon size={13} strokeWidth={2} />
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-[10.5px] font-semibold tracking-[0.3px] text-[#8496a3] uppercase">{label}</div>
      <div className="mt-0.5 text-[12.5px] font-semibold text-[#17242f]">{children}</div>
    </div>
  </div>
);

const ContentEdit = ({ item, canReview }: { item: ContentItem; canReview: boolean }) => {
  const router = useRouter();
  const spec = CONTENT_KINDS[item.type] ?? CONTENT_KINDS.image;
  const kind = CONTENT_KINDS[item.type] ? item.type : "image";
  const clientName = clientNameOf(item.client) || "Unknown client";
  const clientId = clientIdOf(item.client);
  const locked = item.status === "approved" && !canReview;
  const canResubmit = item.status === "draft" || item.status === "revision_requested";

  // ── Batch ──
  const [batch, setBatch] = useState<Batch>(item.batchType ?? (item.isIndividual ? "individual" : "monthly"));
  const [month, setMonth] = useState(item.batchMonth);
  const [weekStart, setWeekStart] = useState(dayOf(item.weekStart));
  const [eventName, setEventName] = useState(item.eventName ?? "");
  const [eventDate, setEventDate] = useState(dayOf(item.eventDate));
  const [reason, setReason] = useState(item.sentReason ?? "");

  // ── The piece ──
  const [draft, setDraft] = useState<Draft>(() => draftOf(item));
  // Stored files taken off (removed or replaced) — deleted from storage when saved.
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // Which button was pressed, and whether the page is on its way to the details page —
  // the pressed button keeps its spinner until then.
  const [savingAs, setSavingAs] = useState<"save" | "send">("save");
  const [leaving, setLeaving] = useState(false);
  const saving = uploadProgress !== null || leaving;

  // Preview URLs for newly picked files, freed when leaving the page.
  const previewUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const original = draftOf(item);
  const newFiles = draft.files.filter((file) => file.file);
  const keptFiles = draft.files.length - newFiles.length;
  const detailsChanged = (["title", "caption", "link", "pageName", "pageUrl", "subject", "headline", "cta"] as const).some(
    (field) => draft[field] !== original[field],
  );
  const batchChanged =
    batch !== (item.batchType ?? (item.isIndividual ? "individual" : "monthly")) ||
    month !== item.batchMonth ||
    weekStart !== dayOf(item.weekStart) ||
    eventName !== (item.eventName ?? "") ||
    eventDate !== dayOf(item.eventDate) ||
    reason !== (item.sentReason ?? "");
  const dirty = detailsChanged || batchChanged || removed.length > 0 || newFiles.length > 0;

  // Ask before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty || saving) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  const patch = (next: Partial<Draft>) => {
    setError(null);
    setDraft((current) => ({ ...current, ...next }));
  };

  // A stored file coming off the piece is remembered so the save deletes it.
  const dropStored = (file: Upload | undefined) => {
    if (file && !file.file) setRemoved((current) => [...current, file.url]);
  };

  // Turn picked files into previewable uploads, keeping only what this kind accepts.
  const toUploads = (picked: File[]) => {
    const fitsKind = picked.filter((file) => spec.media.includes(mediaOf(file)));
    const problems = fitsKind.map(uploadProblem).filter(Boolean);
    const allowed = fitsKind.filter((file) => !uploadProblem(file));
    if (fitsKind.length < picked.length) setError(`${spec.label} takes ${uploadNoun(kind)} only — some files were skipped.`);
    else if (problems.length) setError(`${problems.join("; ")} — skipped.`);

    const uploads: Upload[] = allowed.map((file) => {
      const url = URL.createObjectURL(file);
      previewUrls.current.push(url);
      return { name: file.name, size: file.size, url, media: mediaOf(file), mime: file.type, file };
    });
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
    setDraft((current) => ({ ...current, files: [...current.files, ...uploads].slice(0, spec.maxFiles) }));
  };

  const replaceFile = (index: number, file: File) => {
    const [upload] = toUploads([file]);
    if (!upload) return;
    dropStored(draft.files[index]);
    setDraft((current) => ({ ...current, files: current.files.map((old, i) => (i === index ? upload : old)) }));
  };

  const removeFile = (index: number) => {
    dropStored(draft.files[index]);
    patch({ files: draft.files.filter((_, i) => i !== index) });
  };

  const discard = () => {
    setDraft(draftOf(item));
    setRemoved([]);
    setBatch(item.batchType ?? (item.isIndividual ? "individual" : "monthly"));
    setMonth(item.batchMonth);
    setWeekStart(dayOf(item.weekStart));
    setEventName(item.eventName ?? "");
    setEventDate(dayOf(item.eventDate));
    setReason(item.sentReason ?? "");
    setError(null);
  };

  // What's still missing — or null when the piece can be saved.
  const problem = () => {
    if (!draft.title.trim()) return "Give this piece a title.";
    const hasLink = Boolean(spec.linkPlaceholder && draft.link.trim());
    if (draft.files.length < spec.minFiles && !hasLink) {
      return spec.minFiles > 1
        ? `A ${spec.label.toLowerCase()} needs at least ${spec.minFiles} images.`
        : `Upload the ${uploadNoun(kind)}${spec.linkPlaceholder ? " or paste a link" : ""}.`;
    }
    if (spec.fields.includes("pageName") && !draft.pageName.trim()) return "Say which page this copy is for.";
    if (spec.fields.includes("subject") && !draft.subject.trim()) return "Add the email subject line.";
    if (spec.fields.includes("headline") && !draft.headline.trim()) return "Add the ad headline.";
    if (batch === "weekly" && !weekStart) return "Pick the week this piece is for.";
    if (batch === "event" && (!eventName.trim() || !eventDate)) return "Add the event's name and date.";
    if (batch === "individual" && !reason.trim()) return "Say why this piece is sent on its own.";
    return null;
  };

  // Save the changes; `andSend` also sends the piece to the client for approval.
  const save = async (andSend: boolean) => {
    setError(null);
    const missing = problem();
    if (missing) return setError(missing);
    if (!dirty && !andSend) return;

    const form = new FormData();
    form.set("title", draft.title.trim());
    form.set("caption", draft.caption.trim());
    form.set("link", draft.link.trim());
    for (const field of spec.fields) form.set(field, draft[field].trim());
    form.set("batchMonth", month);
    form.set("batchType", batch);
    if (batch === "weekly") form.set("weekStart", weekStart);
    if (batch === "event") {
      form.set("eventName", eventName.trim());
      form.set("eventDate", eventDate);
    }
    if (batch === "individual") form.set("sentReason", reason.trim());
    if (removed.length) form.set("removeFiles", JSON.stringify(removed));
    for (const upload of newFiles) if (upload.file) form.append("files", upload.file, upload.name);

    setSavingAs(andSend ? "send" : "save");
    setUploadProgress(0);
    try {
      if (dirty) {
        const { status, body } = await uploadChanges(item._id, form, setUploadProgress);
        if (status < 200 || status >= 300) {
          setError([body.message, ...(body.errors ?? [])].filter(Boolean).join(" — "));
          return;
        }
      }
      if (andSend) {
        const result = await changeContentStatusAction(item._id, "pending_approval");
        if (!result.ok) {
          toast.error(result.error ?? "Saved, but couldn't send it for approval.");
          setLeaving(true);
          router.push(`/content/${item._id}`);
          router.refresh();
          return;
        }
        toast.success(`Saved and sent to ${clientName} for approval`);
      } else {
        toast.success("Changes saved");
      }
      setLeaving(true);
      router.push(`/content/${item._id}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again — nothing was saved.");
    } finally {
      setUploadProgress(null);
    }
  };

  // The stored month may be outside the usual four — keep it choosable.
  const months = monthOptions();
  const monthChoices: PickerOption[] = months.some((option) => option.value === item.batchMonth)
    ? months
    : [{ value: item.batchMonth, label: item.batchMonth, sub: "Current batch", icon: CalendarDays, color: "#556977" }, ...months];

  // What the pressed save button says while it works.
  const savingLabel =
    uploadProgress !== null && newFiles.length && uploadProgress < 100 ? `Uploading ${uploadProgress}%` : "Saving…";

  const badge = STATUS_BADGES[item.status];
  const note = STATUS_NOTE[item.status];
  const stepLabel = "mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.5px] text-[#7a8d9b] uppercase";
  const stepDot = "flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0b1522] text-[10px] text-white";
  const clientComments = item.comments.filter((entry) => entry.author === "client");
  const latestFeedback = item.status === "revision_requested" ? clientComments[clientComments.length - 1] : undefined;

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/content" className={breadcrumbLink}>
            Content
          </Link>{" "}
          /{" "}
          <Link href={`/content/${item._id}`} className={breadcrumbLink}>
            {item.title}
          </Link>{" "}
          / <b>Edit</b>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className={pageTitle}>Edit Content</div>
          <div className={pageDesc}>Update the files, text or batch of this piece. The client and content type stay the same.</div>
        </div>
        <Link href="/content" className={`${btnDraft} inline-flex items-center gap-1.5 no-underline`}>
          <ArrowLeft size={14} strokeWidth={2} /> Content List
        </Link>
      </div>

      <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className={sectionCard}>
          {locked ? (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#bfe5cb] bg-[#effaf2] px-4 py-3">
              <Lock size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[#15803d]" />
              <div className="text-[12.5px] leading-relaxed text-[#15803d]">
                <b>This piece is approved and locked.</b> Ask a manager to edit it or send it back to draft.
              </div>
            </div>
          ) : (
            <div className={`mb-5 rounded-lg border px-4 py-2.5 text-[12.5px] font-medium ${note.tone}`}>{note.text}</div>
          )}

          <fieldset disabled={locked || saving} className={`transition-opacity ${locked ? "pointer-events-none opacity-55" : ""}`}>
            {/* ① Where it goes */}
            <div className="rounded-xl border border-[#dbeafe] bg-[linear-gradient(180deg,#f5f9ff,#ffffff)] p-4">
              <div className={stepLabel}>
                <span className={stepDot}>1</span> Client &amp; batch
              </div>
              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <span className={fieldLabel}>Client</span>
                  <div
                    className="flex h-13.5 items-center gap-2.5 rounded-md border border-[#dbe3de] bg-[#f3f6f4] px-3"
                    title="The client can't be changed — add a new piece for another client"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: avatarColorFor(clientId) }}
                    >
                      {initialsOf(clientName)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#17242f]">{clientName}</span>
                    <Lock size={13} strokeWidth={2} className="shrink-0 text-[#9aacb8]" />
                  </div>
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="month">
                    Month <span className={requiredStar}>*</span>
                  </label>
                  <Picker
                    id="month"
                    value={month}
                    options={monthChoices}
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
                  <Picker id="batch" value={batch} options={BATCH_OPTIONS} onChange={(next) => setBatch(next as Batch)} placeholderIcon={Layers} />
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
            <div className="mt-5 border-t border-[#eef3ef] pt-5">
              <div className={stepLabel}>
                <span className={stepDot}>2</span> Content
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={fieldLabel}>Content type</span>
                    <div
                      className="flex h-13.5 items-center gap-2.5 rounded-md border border-[#dbe3de] bg-[#f3f6f4] px-3"
                      title="The type can't be changed — add a new piece for a different type"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: spec.background, color: spec.color }}
                      >
                        <spec.icon size={16} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#17242f]">{spec.label}</span>
                        <span className="block truncate text-[11px] text-[#7a8e9b]">{spec.sub}</span>
                      </span>
                      <Lock size={13} strokeWidth={2} className="shrink-0 text-[#9aacb8]" />
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel} htmlFor="title">
                      Title <span className={requiredStar}>*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      className={`${inputText} h-13.5`}
                      placeholder="What this piece is called"
                      value={draft.title}
                      onChange={(event) => patch({ title: event.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.25 flex items-center justify-between">
                    <span className="text-[11.5px] font-bold text-[#384b59]">Files</span>
                    {newFiles.length || removed.length ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                        {newFiles.length ? (
                          <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[#1d4ed8]">+{newFiles.length} new</span>
                        ) : null}
                        {removed.length ? (
                          <span className="rounded-full bg-[#fdecec] px-2 py-0.5 text-[#b42318]">{removed.length} removed</span>
                        ) : null}
                      </span>
                    ) : null}
                  </div>
                  <UploadBox kind={kind} files={draft.files} onPick={pickFiles} onReplace={replaceFile} onRemove={removeFile} />
                </div>

                {spec.linkPlaceholder && !draft.files.length ? (
                  <div className="relative">
                    <Link2
                      size={14}
                      strokeWidth={2}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#8496a3]"
                    />
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
                      <label className={fieldLabel} htmlFor="pageName">
                        Page <span className={requiredStar}>*</span>
                      </label>
                      <input
                        id="pageName"
                        type="text"
                        className={inputText}
                        placeholder="e.g. Home, Services, About Us"
                        value={draft.pageName}
                        onChange={(event) => patch({ pageName: event.target.value })}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel} htmlFor="pageUrl">
                        Page URL
                      </label>
                      <input
                        id="pageUrl"
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
                    <label className={fieldLabel} htmlFor="subject">
                      Subject line <span className={requiredStar}>*</span>
                    </label>
                    <input
                      id="subject"
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
                        <label className={fieldLabel} htmlFor="headline">
                          Headline <span className={requiredStar}>*</span>
                        </label>
                        <input
                          id="headline"
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
                        <label className={fieldLabel} htmlFor="cta">
                          Button
                        </label>
                        <select
                          id="cta"
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
                  <label className={fieldLabel} htmlFor="caption">
                    {spec.captionLabel}
                  </label>
                  <textarea
                    id="caption"
                    className={`${textareaBase} h-24`}
                    placeholder={spec.captionPlaceholder}
                    value={draft.caption}
                    onChange={(event) => patch({ caption: event.target.value })}
                  />
                </div>

                {error ? (
                  <div
                    className="rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b42318]"
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}

                <div className="flex items-center justify-end gap-2.5 border-t border-[#eef3ef] pt-4">
                  <div className="mr-auto flex items-center gap-2">
                    <Link
                      href={`/content/${item._id}`}
                      className="inline-flex items-center rounded-md px-3 py-2.25 text-[12.5px] font-semibold text-[#7a8e9b] no-underline hover:bg-[#f1f5f3] hover:text-[#17242f]"
                    >
                      Cancel
                    </Link>
                    {dirty && !saving ? (
                      <button
                        type="button"
                        onClick={discard}
                        className="cursor-pointer rounded-md px-2 py-1 text-[11.5px] font-semibold text-[#a35a12] hover:underline"
                      >
                        Undo changes
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => save(false)}
                    disabled={!dirty || saving}
                    aria-busy={saving && savingAs === "save"}
                    className={`${btnDraft} inline-flex items-center gap-1.5 ${
                      saving ? "disabled:cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-50"
                    }`}
                  >
                    {saving && savingAs === "save" ? (
                      <>
                        <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> {savingLabel}
                      </>
                    ) : (
                      <>
                        <Save size={14} strokeWidth={2} /> Save Changes
                      </>
                    )}
                  </button>
                  {canResubmit ? (
                    <button
                      type="button"
                      onClick={() => save(true)}
                      disabled={saving}
                      aria-busy={saving && savingAs === "send"}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#2563eb] px-4.5 py-2.5 text-[12.5px] font-bold text-white hover:bg-[#1d4ed8] disabled:cursor-wait"
                    >
                      {saving && savingAs === "send" ? (
                        <>
                          <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> {savingLabel}
                        </>
                      ) : (
                        <>
                          <Send size={14} strokeWidth={2} />
                          {item.status === "draft" ? "Save & Send for Approval" : "Save & Re-submit"}
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

              </div>
            </div>
          </fieldset>
        </div>

        {/* Where the piece stands */}
        <aside className="flex flex-col gap-4 min-[1100px]:sticky min-[1100px]:top-4">
          <div className="rounded-[10px] border border-[#dbe3de] bg-white">
            <div className="flex items-center justify-between border-b border-[#eef3ef] px-4.5 py-3.5">
              <div className="text-[14px] font-bold text-[#0d1e2c]">Content Status</div>
              <span className={badge.badge}>
                <span className={badge.dot} /> {badge.label}
              </span>
            </div>
            <div className="divide-y divide-[#f1f4f2] px-4.5 py-1.5">
              <SideRow icon={CalendarDays} label="Batch">
                {batchChanged ? (
                  <>
                    <span className="text-[#9aacb8] line-through">{batchLabelOf(item)}</span>{" "}
                    {batch === "weekly" && weekStart ? weekLabel(weekStart) : batch === "event" ? eventName || "Event" : batch === "individual" ? "Individual" : month}
                  </>
                ) : (
                  batchLabelOf(item)
                )}
              </SideRow>
              <SideRow icon={FileStack} label="Files">
                {keptFiles} kept
                {newFiles.length ? <span className="text-[#1d4ed8]"> · {newFiles.length} new</span> : null}
                {removed.length ? <span className="text-[#b42318]"> · {removed.length} removed</span> : null}
                {draft.link && !draft.files.length ? " · link" : null}
              </SideRow>
              <SideRow icon={UserRound} label="Created by">
                {personNameOf(item.createdBy) ?? "—"}
                <span className="block text-[11px] font-normal text-[#7a8e9b]">{formatDateTime(item.createdAt)}</span>
              </SideRow>
              <SideRow icon={Clock} label="Last updated">
                {formatDateTime(item.updatedAt)}
              </SideRow>
            </div>
            {dirty ? (
              <div className="mx-4.5 mb-4 flex items-center gap-2 rounded-md border border-[#fde7c2] bg-[#fff8ec] px-3 py-2 text-[11.5px] font-semibold text-[#a35a12]">
                <span className="h-1.75 w-1.75 rounded-full bg-[#d97706]" /> Unsaved changes
              </div>
            ) : null}
          </div>

          <div className="rounded-[10px] border border-[#dbe3de] bg-white">
            <div className="flex items-center justify-between border-b border-[#eef3ef] px-4.5 py-3.5">
              <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#0d1e2c]">
                <MessageSquare size={14} strokeWidth={2.25} /> Comments
              </div>
              <span className="rounded-full bg-[#eef3ef] px-2 py-0.5 text-[11px] font-semibold text-[#556977]">{item.comments.length}</span>
            </div>
            <div className="px-4.5 py-3.5">
              {latestFeedback ? (
                <div className="mb-3 rounded-lg border border-[#f5c2c2] bg-[#fdf3f3] px-3 py-2.5">
                  <div className="text-[10.5px] font-bold tracking-[0.3px] text-[#b42318] uppercase">Changes the client asked for</div>
                  <div className="mt-1 text-[12.5px] leading-normal whitespace-pre-line text-[#33434f]">{latestFeedback.text}</div>
                </div>
              ) : null}
              <CommentThread
                contentId={item._id}
                comments={item.comments}
                clientName={clientName}
                canComment
                onPosted={() => router.refresh()}
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default ContentEdit;
