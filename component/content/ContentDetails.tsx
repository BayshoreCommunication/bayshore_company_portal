"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Link2,
  Loader2,
  Mail,
  MessagesSquare,
  Pencil,
  Play,
  RotateCcw,
  SendHorizontal,
  X,
  Tag,
  type LucideIcon,
} from "lucide-react";
import {
  changeContentStatusAction,
  type ContentFile,
  type ContentItem,
  type ContentRevision,
  type ContentStatus,
} from "@/app/actions/content";
import { avatarColorFor, initialsOf } from "@/component/clients/clientUi";
import {
  btnDraft,
  btnPrimary,
  pageTitle,
} from "@/component/shared/ui";
import CommentThread from "./CommentThread";
import { fileSize } from "./contentForm";
import GroupPieces from "./GroupPieces";
import RevisionHistory, { PREVIEW_ANCHOR, ownRevisionsOf } from "./RevisionHistory";
import RevisionReply from "./RevisionReply";
import {
  CONTENT_KINDS,
  STATUS_BADGES,
  batchLabelOf,
  clientIdOf,
  clientNameOf,
  formatDate,
  personNameOf,
  piecesOf,
  revisionNoteOf,
  threadOf,
  versionsOf,
} from "./contentUi";

type Badge = { icon: LucideIcon; color: string; background: string };

const GRAY: Omit<Badge, "icon"> = { color: "#556977", background: "#eef3ef" };
const BLUE: Omit<Badge, "icon"> = { color: "#2563eb", background: "#dbeafe" };

const iconText = "inline-flex items-center gap-1.5";

// A section: icon + title header, then the body. `divided` draws a line under the header.
const Card = ({
  badge,
  title,
  aside,
  divided = false,
  children,
}: {
  badge: Badge;
  title: string;
  aside?: ReactNode;
  divided?: boolean;
  children: ReactNode;
}) => (
  <section className="rounded-[10px] border border-[#dbe3de] bg-white">
    <div className={`flex items-center justify-between gap-3 px-5 pt-4 ${divided ? "border-b border-[#eef3ef] pb-3.5" : ""}`}>
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-[7px]"
          style={{ background: badge.background, color: badge.color }}
        >
          <badge.icon size={15} strokeWidth={2} />
        </span>
        <h2 className="text-[14px] font-bold text-[#0d1e2c]">{title}</h2>
      </div>
      {aside}
    </div>
    <div className="px-5 pt-4 pb-5">{children}</div>
  </section>
);

const Count = ({ children }: { children: ReactNode }) => (
  <span className="rounded-xl bg-[#eef3ef] px-2.25 py-0.5 text-[11px] font-semibold text-[#7a8e9b]">{children}</span>
);

const StatusBadge = ({ status }: { status: ContentStatus }) => {
  const badge = STATUS_BADGES[status];
  return (
    <span className={badge.badge}>
      <span className={badge.dot} /> {badge.label}
    </span>
  );
};

const isPdf = (file: ContentFile) => file.mimeType === "application/pdf" || /\.pdf($|\?)/i.test(file.url);
const extensionOf = (name: string) => name.split(".").pop()?.toUpperCase() ?? "FILE";

// The tinted surface a preview sits on, so the piece itself stands apart from the white card around it.
const stageClass = "rounded-xl border border-[#d6e0f1] bg-[#eaf0fa]";

// One stored file, as large as it reads well: the image, a playable video, the PDF — or a
// download panel for documents the browser can't show.
const FileView = ({ file, title, poster }: { file: ContentFile; title: string; poster?: string }) => {
  if (file.media === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={file.url} alt={file.name || title} className="block max-h-[60vh] w-full rounded-lg object-contain" />;
  }
  if (file.media === "video") {
    return <video src={file.url} controls poster={poster} className="block max-h-[60vh] w-full rounded-lg bg-black" />;
  }
  if (isPdf(file)) {
    return (
      <iframe
        src={`${file.url}#view=FitH`}
        title={file.name || title}
        className="block h-[60vh] min-h-105 w-full rounded-lg border border-[#d6e0f1] bg-white"
      />
    );
  }
  // A document the browser can't show in place (Word, text…): a panel the size of a preview,
  // with the file front and centre.
  return (
    <div className="flex min-h-70 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        <FileText size={30} strokeWidth={1.6} />
      </span>
      <div className="max-w-full">
        <div className="text-[16px] font-bold wrap-anywhere text-[#0d1e2c]">{file.name || title}</div>
        <div className="mt-1 text-[12px] text-[#7a8e9b]">
          {extensionOf(file.name || file.url)}
          {file.size ? ` · ${fileSize(file.size)}` : ""} — download it to read
        </div>
      </div>
      <a
        href={file.url}
        download={file.name}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0d1e2c] px-5 text-[12.5px] font-semibold text-white no-underline hover:bg-[#1c3345]"
      >
        <Download size={15} strokeWidth={2} /> Download
      </a>
    </div>
  );
};

// A pasted link that can be shown in place: a YouTube or Vimeo video, or a Google Drive /
// Docs file shared for viewing. Anything else returns null — most sites refuse to be framed.
const embedOf = (link: string): { src: string; tall: boolean } | null => {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" && parts[0]) return { src: `https://www.youtube.com/embed/${parts[0]}`, tall: false };
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : null);
    return id ? { src: `https://www.youtube.com/embed/${id}`, tall: false } : null;
  }
  if (host === "vimeo.com" && /^\d+$/.test(parts[0] ?? "")) return { src: `https://player.vimeo.com/video/${parts[0]}`, tall: false };
  if (host === "drive.google.com" && parts[0] === "file" && parts[1] === "d" && parts[2]) {
    return { src: `https://drive.google.com/file/d/${parts[2]}/preview`, tall: true };
  }
  if (host === "docs.google.com" && ["document", "presentation", "spreadsheets"].includes(parts[0]) && parts[1] === "d" && parts[2]) {
    return { src: `https://docs.google.com/${parts[0]}/d/${parts[2]}/preview`, tall: true };
  }
  return null;
};

// The pasted link. Shown in place when it can be; otherwise a panel to open it — the size of
// a preview when the link is all there is (`large`), a row under the files when not.
const LinkView = ({ link, type, large }: { link: string; type: { label: string; color: string; background: string }; large: boolean }) => {
  const embed = embedOf(link);
  const open = (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-[#e1eae5] bg-[#fafcfb] p-4 text-inherit no-underline hover:bg-[#f4f7f5]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: type.background, color: type.color }}>
        <Link2 size={18} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#0d1e2c]">Open the {type.label.toLowerCase()}</span>
        <span className="block truncate text-[11.5px] text-[#7a8e9b]">{link}</span>
      </span>
      <ExternalLink size={15} strokeWidth={2} className="shrink-0 text-[#556977]" />
    </a>
  );

  if (embed) {
    return (
      <>
        <iframe
          src={embed.src}
          title={`${type.label} preview`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className={`block w-full rounded-xl border border-[#d6e0f1] ${embed.tall ? "h-[60vh] min-h-105 bg-white" : "aspect-video bg-black"}`}
        />
        {open}
      </>
    );
  }
  if (!large) return open;

  let host = link;
  try {
    host = new URL(link).hostname.replace(/^www\./, "");
  } catch {
    // Not a full URL — show it as it was pasted.
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${stageClass} group flex min-h-70 flex-col items-center justify-center gap-4 p-6 text-center text-inherit no-underline hover:border-[#b9c9e8]`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]" style={{ color: type.color }}>
        <Link2 size={28} strokeWidth={1.75} />
      </span>
      <span className="max-w-full">
        <span className="block text-[16px] font-bold text-[#0d1e2c]">{host}</span>
        <span className="mt-1 block text-[12px] wrap-anywhere text-[#7a8e9b]">{link}</span>
      </span>
      <span className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0d1e2c] px-5 text-[12.5px] font-semibold text-white group-hover:bg-[#1c3345]">
        Open the {type.label.toLowerCase()} <ExternalLink size={15} strokeWidth={2} />
      </span>
    </a>
  );
};

// A small thumbnail to switch between the files on show. One the client sent with their
// revision request carries a red "CLIENT" strip; one that is the earlier version — replaced
// during a revision, or the piece as it stood when the client asked — is washed in yellow.
const Thumb = ({
  file,
  active,
  from,
  poster,
  onClick,
}: {
  file: ContentFile;
  active: boolean;
  from?: "client" | "previous";
  // The video's cover image, when the piece has one.
  poster?: string;
  onClick: () => void;
}) => {
  const [on, off] =
    from === "client" ? ["border-[#dc2626]", "border-[#f3a4a4]"] : from === "previous" ? ["border-[#ca8a04]", "border-[#eab308]"] : ["border-[#2563eb]", "border-transparent"];
  const border = active ? on : off;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show ${from === "client" ? "the client's " : from === "previous" ? "the previous " : ""}${file.name || "file"}`}
      aria-current={active}
      className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-[#eef3ef] ${border} ${active ? "" : "opacity-75 hover:opacity-100"}`}
    >
      {file.media === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt="" className="h-full w-full object-cover" />
      ) : file.media === "video" ? (
        <>
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-full w-full object-cover" />
          ) : (
            <video src={file.url} muted preload="metadata" className="h-full w-full bg-black object-cover" />
          )}
          <span className="absolute inset-0 flex items-center justify-center text-white">
            <Play size={16} strokeWidth={2} fill="currentColor" />
          </span>
        </>
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-white text-[#2563eb]">
          <FileText size={18} strokeWidth={1.75} />
          <span className="text-[8.5px] font-bold">{extensionOf(file.name || file.url)}</span>
        </span>
      )}
      {from === "previous" ? (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#facc15]/30" />
          <span className="absolute inset-x-0 bottom-0 bg-[#facc15] py-px text-center text-[8px] font-bold tracking-[0.3px] text-[#422006]">PREVIOUS</span>
        </>
      ) : from === "client" ? (
        <span className="absolute inset-x-0 bottom-0 bg-[#dc2626] py-px text-center text-[8px] font-bold tracking-[0.3px] text-white">CLIENT</span>
      ) : null}
    </button>
  );
};

const stripDivider = <span aria-hidden="true" className="mx-1 h-10 w-px shrink-0 bg-[#dbe3de]" />;

// The piece itself, large: every file (one shown big, the rest to switch to), and the link
// if one was pasted — played or shown in place when it can be. The newest files come first,
// and it opens on them; whatever the piece had before follows, in yellow, to compare with —
// files still in it from an earlier version, then the ones replaced during a revision (the
// client sees the same).
//
// While the client is waiting on a revision (`asked`), what they sent with the request leads
// instead, and all of the piece's own files join the yellow ones: it is the version they
// want changed.
const Preview = ({ item, asked }: { item: ContentItem; asked?: ContentRevision }) => {
  const sent = (asked?.requests ?? []).flatMap((request) => (request.attachments ?? []).map((file) => ({ ...file, sentAt: request.createdAt })));
  const { latest, earlier } = versionsOf(item);
  const previous = item.previousFiles ?? [];
  const all = [...sent, ...latest, ...earlier, ...previous];
  const [selected, setSelected] = useState(0);
  const type = CONTENT_KINDS[item.type] ?? CONTENT_KINDS.image;
  // The cover for the piece's own videos (not for a video the client sent).
  const poster = item.videoThumbnail?.url;
  const index = Math.min(selected, all.length - 1);
  const current = all[index];
  // Where each run of files starts in the strip.
  const latestAt = sent.length;
  const earlierAt = latestAt + latest.length;
  const previousAt = earlierAt + earlier.length;
  const fromClient = index < latestAt ? sent[index] : undefined;
  // From an earlier version, but still in the piece.
  const kept = index >= earlierAt && index < previousAt ? earlier[index - earlierAt] : undefined;
  // Replaced during a revision.
  const old = index >= previousAt ? previous[index - previousAt] : undefined;
  // One of the piece's newest files, while the client's request for something else is open.
  const toRevise = Boolean(current) && !fromClient && !kept && !old && sent.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {current ? (
        <div className={kept || old || toRevise ? "rounded-xl border-2 border-[#eab308] bg-[#fef9c3] p-2.5" : `${stageClass} p-2.5`}>
          {/* Which version is on show — said only when there is more than one to tell apart. */}
          {all.length > latest.length ? (
            <div className="mb-2 flex flex-wrap items-center gap-2 px-0.5 text-[11px]">
              {fromClient ? (
                <>
                  <span className="rounded bg-[#dc2626] px-1.5 py-0.5 text-[10px] font-bold text-white">FROM THE CLIENT</span>
                  <span className="text-[#556977]">
                    Sent {formatDate(fromClient.sentAt)}
                    {asked ? ` · revision ${asked.number}` : ""}
                  </span>
                </>
              ) : kept || old || toRevise ? (
                <>
                  <span className="rounded bg-[#facc15] px-1.5 py-0.5 text-[10px] font-bold text-[#422006]">PREVIOUS VERSION</span>
                  <span className="text-[#713f12]">
                    {old ? (
                      <>
                        Replaced {formatDate(old.replacedAt)}
                        {old.revision ? ` · revision ${old.revision}` : ""}
                      </>
                    ) : kept ? (
                      <>
                        Still part of this piece
                        {kept.uploadedAt ? ` · added ${formatDate(kept.uploadedAt)}` : ""}
                      </>
                    ) : (
                      <>The piece as it stands{asked ? ` — revision ${asked.number} asks to change it` : ""}</>
                    )}
                  </span>
                </>
              ) : (
                <span className="rounded bg-[#16a34a] px-1.5 py-0.5 text-[10px] font-bold text-white">LATEST VERSION</span>
              )}
            </div>
          ) : null}
          {/* Keyed by file, so switching shows the new one at once instead of the last one under a new label. */}
          <FileView key={current.url} file={current} title={item.title} poster={fromClient ? undefined : poster} />
        </div>
      ) : null}

      {all.length > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sent.map((file, at) => (
            <Thumb key={`client-${file.url}`} file={file} from="client" active={at === index} onClick={() => setSelected(at)} />
          ))}
          {sent.length > 0 && latest.length > 0 ? stripDivider : null}
          {latest.map((file, at) => (
            <Thumb
              key={file.url}
              file={file}
              from={sent.length > 0 ? "previous" : undefined}
              poster={poster}
              active={latestAt + at === index}
              onClick={() => setSelected(latestAt + at)}
            />
          ))}
          {earlier.length > 0 ? stripDivider : null}
          {earlier.map((file, at) => (
            <Thumb key={file.url} file={file} from="previous" poster={poster} active={earlierAt + at === index} onClick={() => setSelected(earlierAt + at)} />
          ))}
          {previous.length > 0 && previousAt > 0 ? stripDivider : null}
          {previous.map((file, at) => (
            <Thumb key={`previous-${file.url}`} file={file} from="previous" active={previousAt + at === index} onClick={() => setSelected(previousAt + at)} />
          ))}
          <span className="ml-1 shrink-0 text-[11px] text-[#7a8e9b]">
            {index + 1} of {all.length}
          </span>
        </div>
      ) : null}

      {/* The video's cover, on its own too: once the video plays, the player no longer shows it. */}
      {item.videoThumbnail ? (
        <a
          href={item.videoThumbnail.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-[#e1eae5] bg-[#fafcfb] p-3 text-inherit no-underline hover:bg-[#f4f7f5]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.videoThumbnail.url} alt="" className="h-14 w-24 shrink-0 rounded-lg bg-[#eef3ef] object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-bold text-[#0d1e2c]">Video thumbnail</span>
            <span className="block truncate text-[11.5px] text-[#7a8e9b]">{item.videoThumbnail.name || "Cover image"}</span>
          </span>
          <ExternalLink size={15} strokeWidth={2} className="shrink-0 text-[#556977]" />
        </a>
      ) : null}

      {item.link ? <LinkView link={item.link} type={type} large={!current} /> : null}

      {!current && !item.link ? (
        <div className={`${stageClass} flex min-h-70 w-full flex-col items-center justify-center gap-3`} style={{ color: type.color }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70">
            <type.icon size={26} strokeWidth={1.75} />
          </span>
          <span className="text-[12px] font-medium text-[#556977]">No files attached</span>
        </div>
      ) : null}
    </div>
  );
};

// Sending for approval and commenting go to the API; the page then reloads
// its data from the server.
const ContentDetails = ({
  item,
  related,
  canWrite,
}: {
  item: ContentItem;
  related: ContentItem[];
  canWrite: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { status, comments } = item;
  const type = CONTENT_KINDS[item.type] ?? CONTENT_KINDS.image;
  const client = clientNameOf(item.client) || "Unknown client";
  const pieces = piecesOf(item);
  const ownRevisions = ownRevisionsOf(pieces, item._id, comments);
  const revisionNote = revisionNoteOf(item);

  // Sending a revised piece back goes through a small dialog first: room for a note telling
  // the client what changed. It is kept with the revision, and both portals show it.
  const [resubmitting, setResubmitting] = useState(false);
  const [note, setNote] = useState("");

  const sendForApproval = (withNote?: string) =>
    startTransition(async () => {
      const result = await changeContentStatusAction(item._id, "pending_approval", withNote);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't send it for approval.");
        return;
      }
      setResubmitting(false);
      setNote("");
      toast.success(`Sent to ${client} for approval`);
      router.refresh();
    });

  const actions = (
    <div className="flex flex-wrap items-center gap-2.5">
      <Link href="/content" className={`${btnDraft} ${iconText} no-underline`}>
        <ArrowLeft size={13} strokeWidth={2} /> Content List
      </Link>
      {status === "approved" ? (
        <span className="inline-flex items-center gap-1.75 rounded-md bg-[#dcf3e2] px-3.5 py-2.25 text-[12.5px] font-semibold text-[#15803d]">
          <CheckCircle2 size={15} strokeWidth={2} /> Approved
          {item.approvedAt ? ` on ${formatDate(item.approvedAt)}` : ""}
        </span>
      ) : canWrite ? (
        <>
          <Link href={`/content/edit?id=${item._id}`} className={`${btnDraft} ${iconText} no-underline`}>
            <Pencil size={13} strokeWidth={2} /> Edit
          </Link>
          {status === "draft" || status === "revision_requested" ? (
            <button
              type="button"
              className={`${btnPrimary} ${iconText} disabled:cursor-wait`}
              onClick={() => (status === "revision_requested" ? setResubmitting(true) : sendForApproval())}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 size={13} strokeWidth={2.5} className="animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <SendHorizontal size={13} strokeWidth={2} /> {status === "draft" ? "Send for Approval" : "Re-submit for Approval"}
                </>
              )}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className={pageTitle}>{item.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-[#657787]">
            <StatusBadge status={status} />
            {revisionNote ? (
              <span className="inline-flex items-center gap-1 rounded-xl bg-[#eef3ef] px-2.5 py-0.75 text-[11px] font-bold text-[#556977]">
                <RotateCcw size={11} strokeWidth={2.25} /> {revisionNote}
              </span>
            ) : null}
            <span
              className="inline-flex items-center gap-1.25 rounded-xl px-2.5 py-0.75 text-[11px] font-bold"
              style={{ background: type.background, color: type.color }}
            >
              <type.icon size={12} strokeWidth={2.25} /> {type.label}
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#18232c]">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: avatarColorFor(clientIdOf(item.client)) }}
              >
                {initialsOf(client)}
              </span>
              {client}
            </span>
            <span className="text-[#c3cdc8]">•</span>
            <span>{batchLabelOf(item)}</span>
            <span className="text-[#c3cdc8]">•</span>
            <span>by {personNameOf(item.createdBy) ?? "—"}</span>
          </div>
        </div>
        {actions}
      </div>

      {item.sentReason ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#f1dfbf] bg-[#fdf6ea] px-4 py-2.75 text-[12.5px] text-[#7a4b0f]">
          <Mail size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>
            <b>Sent outside the regular batch:</b> {item.sentReason}
          </span>
        </div>
      ) : null}

      {pieces.length > 1 ? <GroupPieces pieces={pieces} currentId={item._id} /> : null}

      <div className="grid items-start gap-4.5 min-[1100px]:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4.5">
          {/* Where the page opens when a piece is reached from the Revisions list. */}
          <div id={PREVIEW_ANCHOR} className="scroll-mt-4">
            <Card badge={type} title="Preview">
              <Preview item={item} asked={status === "revision_requested" ? ownRevisions.revisions[0] : undefined} />
            </Card>
          </div>

          {item.caption || item.tags.length > 0 ? (
            <Card badge={{ icon: Tag, ...BLUE }} title="Caption & Tags">
              {item.caption ? <p className="text-[13px] leading-[1.7] text-[#24333f]">{item.caption}</p> : null}
              {item.tags.length > 0 ? (
                <div className={`flex flex-wrap gap-2 ${item.caption ? "mt-3.5" : ""}`}>
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-xl bg-[#eef1ef] px-2.5 py-1 text-[11px] font-semibold text-[#4a5c68]">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}

          {/* This piece's revisions only: what the client asked for in each, and what was sent back.
              The other pieces saved with it list theirs on their own pages. */}
          <Card badge={{ icon: RotateCcw, color: "#b91c1c", background: "#fde8e8" }} title="Revisions" aside={<Count>{ownRevisions.revisions.length}</Count>}>
            <RevisionHistory
              pieces={pieces}
              own={ownRevisions}
              reply={
                canWrite ? (
                  <RevisionReply
                    item={item}
                    clientName={client}
                    revision={ownRevisions.revisions[0]}
                    onDone={() => router.refresh()}
                  />
                ) : undefined
              }
            />
          </Card>
        </div>

        {/* Stays in view while the piece on the left is scrolled; on a short screen it scrolls on its own. */}
        <div className="flex flex-col gap-4.5 min-[1100px]:sticky min-[1100px]:top-4 min-[1100px]:max-h-[calc(100vh-2rem)] min-[1100px]:overflow-y-auto min-[1100px]:pb-1">
          <Card badge={{ icon: MessagesSquare, ...BLUE }} title="Messages" divided aside={<Count>{threadOf(pieces, item._id, comments).length}</Count>}>
            <CommentThread
              contentId={item._id}
              pieces={pieces}
              comments={comments}
              clientName={client}
              canComment={canWrite}
              height="h-60"
              onPosted={() => router.refresh()}
            />
          </Card>

          {related.length > 0 ? (
            <Card badge={{ icon: Layers, ...GRAY }} title={`More for ${client}`}>
              <div className="flex flex-col gap-0.5">
                {related.map((other) => {
                  const otherType = CONTENT_KINDS[other.type] ?? CONTENT_KINDS.image;
                  return (
                    <Link
                      key={other._id}
                      href={`/content/${other._id}`}
                      className="group -mx-2 flex items-center gap-2.5 rounded-[7px] p-2 text-inherit no-underline hover:bg-[#f4f7f5]"
                    >
                      <span
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                        style={{
                          background: otherType.background,
                          color: otherType.color,
                        }}
                      >
                        <otherType.icon size={14} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-[#17242f] group-hover:text-[#2563eb]">
                          {other.title}
                        </span>
                        <span className="block text-[11px] text-[#7a8e9b]">{STATUS_BADGES[other.status].label}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {resubmitting ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-[#0b1522]/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPending) setResubmitting(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isPending) setResubmitting(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resubmit-title"
            className="w-full max-w-lg rounded-[10px] border border-[#dbe3de] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.25)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="resubmit-title" className="text-[15px] font-bold text-[#0d1e2c]">
                  Re-submit for approval
                </h2>
                <p className="mt-1 truncate text-[12.5px] font-semibold text-[#273847]">{item.title}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setResubmitting(false)}
                disabled={isPending}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#7a8e9b] hover:bg-[#eef3ef] hover:text-[#17242f] disabled:cursor-default disabled:opacity-50"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <p className="mt-3 text-[12.5px] leading-normal text-[#556977]">
              This sends the revised piece back to {client}
              {item.revisionCount ? ` and answers revision ${item.revisionCount}` : ""}. Tell them what changed — they will see the note with the revision.
            </p>

            <label htmlFor="resubmit-note" className="mt-4 mb-1.5 flex items-baseline justify-between text-[12px] font-bold text-[#17242f]">
              <span>
                What changed? <span className="font-medium text-[#7a8e9b]">(optional)</span>
              </span>
              <span className="text-[10.5px] font-medium text-[#7a8e9b]">{note.length} / 1000</span>
            </label>
            <textarea
              id="resubmit-note"
              rows={4}
              maxLength={1000}
              autoFocus
              value={note}
              readOnly={isPending}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Shortened the intro and swapped the cover photo…"
              className="block w-full resize-y rounded-md border border-[#cbd6d0] bg-white px-3 py-2.5 text-[12.5px] leading-normal text-[#17242f] outline-none placeholder:text-[#9aacb8] focus:border-[#2563eb]"
            />

            <div className="mt-4 flex justify-end gap-2.5">
              <button type="button" className={`${btnDraft} disabled:opacity-50`} onClick={() => setResubmitting(false)} disabled={isPending}>
                Cancel
              </button>
              <button
                type="button"
                className={`${btnPrimary} ${iconText} disabled:cursor-wait`}
                onClick={() => sendForApproval(note)}
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 size={13} strokeWidth={2.5} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <SendHorizontal size={13} strokeWidth={2} /> Re-submit for Approval
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

export default ContentDetails;
