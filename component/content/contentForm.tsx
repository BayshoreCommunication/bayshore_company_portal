"use client";

import { useEffect, useState, type CSSProperties, type DragEvent } from "react";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  PartyPopper,
  Play,
  Plus,
  RefreshCw,
  Repeat,
  Sparkles,
  X,
} from "lucide-react";
import { type PickerOption } from "@/component/shared/Picker";
import { btnDraft } from "@/component/shared/ui";
import { CONTENT_KINDS, KIND_ORDER, acceptFor, uploadHint, uploadNoun, type ContentKind, type Media } from "./contentKinds";

// The pieces of a content form shared by Add Content and Edit Content: the batch
// choices, a piece's fields, and the upload box with its previews.

export type Batch = "monthly" | "weekly" | "event" | "individual";

export const BATCH_OPTIONS: PickerOption[] = [
  { value: "monthly", label: "Monthly Content", sub: "The regular batch for the whole month", icon: Repeat, color: "#2563eb" },
  { value: "weekly", label: "Weekly Content", sub: "A batch for one week of the month", icon: CalendarRange, color: "#7c3aed" },
  { value: "event", label: "Event Content", sub: "A campaign, holiday or local event", icon: PartyPopper, color: "#d97706" },
  { value: "individual", label: "Individual Content", sub: "A one-off piece outside the batch", icon: Sparkles, color: "#dc2626" },
];

export const KIND_OPTIONS: PickerOption[] = KIND_ORDER.map((kind) => ({
  value: kind,
  label: CONTENT_KINDS[kind].label,
  sub: CONTENT_KINDS[kind].sub,
  icon: CONTENT_KINDS[kind].icon,
  color: CONTENT_KINDS[kind].color,
}));


export const DAY_MS = 24 * 60 * 60 * 1000;
export const RELATIVE_MONTH: Record<number, string> = { [-1]: "Last month", 0: "This month", 1: "Next month", 2: "In two months" };

// The last month and the next two, around this one. The value is the batch label — "September 2026".
export const monthOptions = (): PickerOption[] => {
  const now = new Date();
  return [-1, 0, 1, 2].map((offset) => {
    const label = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return { value: label, label, sub: RELATIVE_MONTH[offset], icon: CalendarDays, color: offset === 0 ? "#16a34a" : "#556977" };
  });
};

// The Monday-to-Sunday weeks that touch a month. Values are the Monday, "2026-08-31".
export const weekOptions = (month: string): PickerOption[] => {
  // "September 2026" → 1 Sep 2026 (UTC), without relying on loose date-string parsing.
  const [name, year] = month.split(" ");
  const monthIndex = new Date(`${name} 1, 2000`).getMonth();
  if (Number.isNaN(monthIndex) || !Number(year)) return [];
  const first = new Date(Date.UTC(Number(year), monthIndex, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  let start = new Date(first.getTime() - ((first.getUTCDay() + 6) % 7) * DAY_MS);
  const weeks: PickerOption[] = [];
  for (let n = 1; start <= last; n++, start = new Date(start.getTime() + 7 * DAY_MS)) {
    const value = start.toISOString().slice(0, 10);
    weeks.push({ value, label: `Week ${n}`, sub: weekLabel(value), icon: CalendarRange, color: "#7c3aed" });
  }
  return weeks;
};

// "2026-09-21" → "Sep 21 – Sep 27, 2026"
export const weekLabel = (start: string) => {
  if (!start) return "";
  const from = new Date(`${start}T00:00:00Z`);
  const to = new Date(from.getTime() + 6 * DAY_MS);
  const short = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${short(from)} – ${short(to)}, ${to.getUTCFullYear()}`;
};

export const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;


// A file on a piece: one picked on this page (with the File, to upload, and a
// browser preview URL), or one already stored (its Spaces URL). `text` holds the
// start of a plain-text file.
export type Upload = { name: string; size: number; url: string; media: Media; mime: string; text?: string; file?: File };

export type Draft = {
  title: string;
  caption: string;
  link: string;
  files: Upload[];
  // Only some kinds use these — see `fields` in contentKinds.
  pageName: string;
  pageUrl: string;
  subject: string;
  headline: string;
  cta: string;
};


export const blankDraft = (): Draft => ({
  title: "",
  caption: "",
  link: "",
  files: [],
  pageName: "",
  pageUrl: "",
  subject: "",
  headline: "",
  cta: "",
});


export const MEDIA_ICON: Record<Media, typeof ImageIcon> = { image: ImageIcon, video: Film, doc: FileText };

export const extensionOf = (name: string) => name.split(".").pop()?.toUpperCase() ?? "FILE";
export const isPdf = (file: Upload) => file.mime === "application/pdf" || /\.pdf$/i.test(file.name);

// The file itself, as big as it reads well: the image, a playable video, the PDF, the text —
// or, for Word files the browser can't render, a clear document card.
export const FilePreview = ({ file }: { file: Upload }) => {
  if (file.media === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={file.url} alt={file.name} className="block max-h-100 w-full object-contain" />;
  }
  if (file.media === "video") {
    return <video src={file.url} controls className="block max-h-100 w-full bg-black" />;
  }
  if (isPdf(file)) {
    return <iframe src={`${file.url}#toolbar=0&view=FitH`} title={file.name} className="block h-120 w-full bg-white" />;
  }
  if (file.text !== undefined) {
    return (
      <pre className="max-h-80 w-full overflow-auto bg-white px-5 py-4 text-left font-[inherit] text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#24333f]">
        {file.text || "This file is empty."}
      </pre>
    );
  }
  return (
    <div className="flex w-full flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="relative flex h-20 w-16 items-end justify-center rounded-md border border-[#dbe3de] bg-white pb-2 shadow-[0_6px_16px_rgba(11,21,34,0.08)]">
        <FileText size={26} strokeWidth={1.5} className="absolute top-3 text-[#2563eb]" />
        <span className="rounded bg-[#2563eb] px-1.5 text-[9.5px] font-bold text-white">{extensionOf(file.name)}</span>
      </span>
      <div className="text-[12.5px] font-semibold text-[#17242f]">{file.name}</div>
      <div className="max-w-80 text-[11.5px] text-[#7a8e9b]">
        Word files can&apos;t be previewed in the browser. Download it to double-check before sending.
      </div>
      <a
        href={file.url}
        download={file.name}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdcd6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#273847] no-underline hover:border-[#2563eb] hover:text-[#2563eb]"
      >
        <Download size={13} strokeWidth={2} /> Download
      </a>
    </div>
  );
};

// A hidden file input inside whatever should open the picker.
export const FileInput = ({ kind, multiple, onPick }: { kind: ContentKind; multiple: boolean; onPick: (files: File[]) => void }) => (
  <input
    type="file"
    accept={acceptFor(kind)}
    multiple={multiple}
    className="hidden"
    onChange={(event) => {
      onPick(Array.from(event.target.files ?? []));
      event.target.value = "";
    }}
  />
);

// A small square card for one of several files: thumbnail, video frame or document tile.
export const FileCard = ({ file, index, onOpen, onRemove }: { file: Upload; index: number; onOpen: () => void; onRemove: () => void }) => (
  <div className="group relative aspect-square overflow-hidden rounded-lg border border-[#dbe3de] bg-[#eef3ef]">
    <button type="button" onClick={onOpen} aria-label={`Preview ${file.name}`} className="block h-full w-full cursor-zoom-in">
      {file.media === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt={file.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      ) : file.media === "video" ? (
        <>
          <video src={file.url} muted preload="metadata" className="h-full w-full bg-black object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">
              <Play size={15} strokeWidth={2} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        </>
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-white px-2">
          <FileText size={26} strokeWidth={1.5} className="text-[#2563eb]" />
          <span className="rounded bg-[#2563eb] px-1.5 text-[9.5px] font-bold text-white">{extensionOf(file.name)}</span>
        </span>
      )}
      {file.media !== "image" ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/70 to-transparent px-2 pt-4 pb-1.5 text-left text-[10.5px] font-semibold text-white">
          {file.name}
        </span>
      ) : null}
    </button>
    <span className="pointer-events-none absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-px text-[10.5px] font-bold text-white">
      {index + 1}
    </span>
    <button
      type="button"
      aria-label={`Remove ${file.name}`}
      onClick={onRemove}
      className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/95 text-[#b42318] shadow"
    >
      <X size={12} strokeWidth={3} />
    </button>
  </div>
);

// Full-screen look at one file, with arrows to step through the rest.
export const Lightbox = ({
  files,
  index,
  onMove,
  onClose,
}: {
  files: Upload[];
  index: number;
  onMove: (index: number) => void;
  onClose: () => void;
}) => {
  const file = files[index];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onMove(Math.min(files.length - 1, index + 1));
      if (event.key === "ArrowLeft") onMove(Math.max(0, index - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [files.length, index, onClose, onMove]);

  const arrow =
    "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#17242f] shadow disabled:hidden";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1522]/80 p-8"
      onClick={onClose}
      role="dialog"
      aria-label={file.name}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-center bg-[#f3f6f4]">
          <FilePreview file={file} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#eef3ef] px-4 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-bold text-[#17242f]">{file.name}</div>
            <div className="text-[11px] text-[#7a8e9b]">
              {index + 1} of {files.length} · {extensionOf(file.name)} · {fileSize(file.size)}
            </div>
          </div>
          <button type="button" onClick={onClose} className={btnDraft}>
            Close
          </button>
        </div>
        <button
          type="button"
          aria-label="Previous file"
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
          className={`${arrow} left-3`}
        >
          <ChevronLeft size={20} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          aria-label="Next file"
          disabled={index === files.length - 1}
          onClick={() => onMove(index + 1)}
          className={`${arrow} right-3`}
        >
          <ChevronRight size={20} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
};

// Drag files in, or click to pick — up to the kind's limit. One file shows as a full
// preview; several show as small cards that open full-size when clicked.
export const UploadBox = ({
  kind,
  files,
  onPick,
  onReplace,
  onRemove,
}: {
  kind: ContentKind;
  files: Upload[];
  onPick: (files: File[]) => void;
  onReplace: (index: number, file: File) => void;
  onRemove: (index: number) => void;
}) => {
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const spec = CONTENT_KINDS[kind];
  const room = files.length < spec.maxFiles;
  // The kind's own colors, for the hover and drag states.
  const tint = { "--kind": spec.color, "--kind-bg": spec.background } as CSSProperties;

  const dragProps = {
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      onPick(Array.from(event.dataTransfer.files));
    },
  };

  const countLine = (
    <span>
      {files.length} of {spec.maxFiles} files
      {files.length < spec.minFiles ? (
        <span className="font-semibold text-[#a35a12]"> · add at least {spec.minFiles}</span>
      ) : room ? (
        " · drag in more to add them"
      ) : null}
    </span>
  );

  if (!files.length) {
    return (
      <label
        {...dragProps}
        style={tint}
        className={`flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? "border-(--kind) bg-(--kind-bg)" : "border-[#cbd6d0] bg-[#fafcfb] hover:border-(--kind) hover:bg-white"
        }`}
      >
        <span className="flex -space-x-3">
          {spec.media.map((media) => {
            const Icon = MEDIA_ICON[media];
            return (
              <span
                key={media}
                className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-[#fafcfb] shadow-[0_4px_12px_rgba(11,21,34,0.08)]"
                style={{ background: spec.background, color: spec.color }}
              >
                <Icon size={24} strokeWidth={1.75} />
              </span>
            );
          })}
        </span>
        <span>
          <span className="block text-[14px] font-bold text-[#0d1e2c]">
            {dragging ? "Drop to upload" : `Drag & drop your ${uploadNoun(kind)} here`}
          </span>
          <span className="mt-1 block text-[12px] text-[#7a8e9b]">
            or <span className="font-semibold text-(--kind) underline underline-offset-2">browse your computer</span> — pick one or several
            {spec.linkPlaceholder ? ", or paste a link below" : ""}
          </span>
        </span>
        <span className="flex flex-wrap justify-center gap-1.5">
          {uploadHint(kind)
            .split(/ or | · /)
            .map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[#dbe3de] bg-white px-2.5 py-0.5 text-[10.5px] font-semibold text-[#556977]"
              >
                {chip}
              </span>
            ))}
        </span>
        <FileInput kind={kind} multiple onPick={onPick} />
      </label>
    );
  }

  // Several files: an "add more" tile first (while there's room), then small numbered cards.
  if (files.length > 1) {
    return (
      <div className="rounded-xl border border-[#dbe3de] bg-[#fafcfb] p-3" {...dragProps}>
        <div className="grid grid-cols-5 gap-2.5">
          {room ? (
            <label
              style={tint}
              className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-[11.5px] font-semibold ${
                dragging
                  ? "border-(--kind) bg-(--kind-bg) text-(--kind)"
                  : "border-[#cbd6d0] text-[#7a8e9b] hover:border-(--kind) hover:text-(--kind)"
              }`}
            >
              <Plus size={20} strokeWidth={2} />
              Add more
              <FileInput kind={kind} multiple onPick={onPick} />
            </label>
          ) : null}
          {files.map((file, index) => (
            <FileCard key={file.url} file={file} index={index} onOpen={() => setViewing(index)} onRemove={() => onRemove(index)} />
          ))}
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-[#7a8e9b]">
          {countLine}
          <span>Click a card to see it full size</span>
        </div>
        {viewing !== null && files[viewing] ? (
          <Lightbox files={files} index={viewing} onMove={setViewing} onClose={() => setViewing(null)} />
        ) : null}
      </div>
    );
  }

  // One file: the full preview; "Add more" sits next to Replace.
  const file = files[0];
  const Icon = MEDIA_ICON[file.media];
  return (
    <div className="overflow-hidden rounded-xl border border-[#dbe3de] bg-white" {...dragProps}>
      <div className="flex items-center justify-center bg-[#f3f6f4]">
        <FilePreview file={file} />
      </div>
      <div className="flex items-center gap-3 border-t border-[#eef3ef] px-3.5 py-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: spec.background, color: spec.color }}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-bold text-[#17242f]">{file.name}</div>
          <div className="text-[11px] text-[#7a8e9b]">
            {extensionOf(file.name)} · {fileSize(file.size)}
            {files.length < spec.minFiles ? <span className="font-semibold text-[#a35a12]"> · add at least {spec.minFiles}</span> : null}
          </div>
        </div>
        {room ? (
          <label
            style={tint}
            title={`Add more ${uploadNoun(kind)} — up to ${spec.maxFiles}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-(--kind) bg-(--kind-bg) px-2.5 py-1.5 text-[11.5px] font-semibold text-(--kind) hover:brightness-95"
          >
            <Plus size={12} strokeWidth={2.5} /> Add more
            <FileInput kind={kind} multiple onPick={onPick} />
          </label>
        ) : null}
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#cfdcd6] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#273847] hover:bg-[#f1f5f3]">
          <RefreshCw size={12} strokeWidth={2.25} /> Replace
          <FileInput
            kind={kind}
            multiple={false}
            onPick={(picked) => {
              if (picked[0]) onReplace(0, picked[0]);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => onRemove(0)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#f0b8b8] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[#b42318] hover:bg-[#fdecec]"
        >
          <X size={12} strokeWidth={2.5} /> Remove
        </button>
      </div>
    </div>
  );
};

