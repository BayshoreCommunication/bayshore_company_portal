"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  History,
  Info,
  Layers,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Play,
  SendHorizontal,
  Tag,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  changeContentStatusAction,
  type ContentFile,
  type ContentItem,
  type ContentStatus,
} from "@/app/actions/content";
import { avatarColorFor, initialsOf } from "@/component/clients/clientUi";
import {
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDraft,
  btnPrimary,
  dashPendingSub,
  pageTitle,
} from "@/component/shared/ui";
import CommentThread from "./CommentThread";
import { CONTENT_KINDS } from "./contentKinds";
import {
  BATCH_TYPE_LABELS,
  STATUS_BADGES,
  batchLabelOf,
  clientIdOf,
  clientNameOf,
  filesOf,
  formatDate,
  formatDateTime,
  personNameOf,
} from "./contentUi";

type Badge = { icon: LucideIcon; color: string; background: string };

const GRAY: Omit<Badge, "icon"> = { color: "#556977", background: "#eef3ef" };
const BLUE: Omit<Badge, "icon"> = { color: "#2563eb", background: "#dbeafe" };

const iconText = "inline-flex items-center gap-1.5";

// A section: icon + title header, then the body.
const Card = ({ badge, title, aside, children }: { badge: Badge; title: string; aside?: ReactNode; children: ReactNode }) => (
  <section className="rounded-[10px] border border-[#dbe3de] bg-white">
    <div className="flex items-center justify-between gap-3 px-5 pt-4">
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

// One stored file, as large as it reads well.
const FileView = ({ file, title }: { file: ContentFile; title: string }) => {
  if (file.media === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={file.url} alt={file.name || title} className="block max-h-115 w-full rounded-lg bg-[#f3f6f4] object-contain" />
    );
  }
  if (file.media === "video") {
    return <video src={file.url} controls className="block aspect-video w-full rounded-lg bg-black" />;
  }
  if (isPdf(file)) {
    return (
      <iframe
        src={`${file.url}#view=FitH`}
        title={file.name || title}
        className="block h-120 w-full rounded-lg border border-[#e1eae5] bg-white"
      />
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#e1eae5] bg-[#fafcfb] p-4.5">
      <span className="inline-flex h-13 w-13 shrink-0 items-center justify-center rounded-lg bg-[#c0392b] text-white">
        <FileText size={24} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold text-[#0d1e2c]">{file.name || title}</div>
        <div className="mt-0.5 text-[11.5px] text-[#7a8e9b]">
          {extensionOf(file.name || file.url)} document — download to read it
        </div>
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-[#cfdcd6] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#273847] no-underline hover:border-[#2563eb] hover:text-[#2563eb]"
      >
        <ExternalLink size={14} strokeWidth={2} /> Open
      </a>
    </div>
  );
};

// The piece itself: one file large, or the chosen one of several with the rest as
// thumbnails — plus its pasted link, if it has one.
const Preview = ({ item }: { item: ContentItem }) => {
  const files = filesOf(item);
  const [selected, setSelected] = useState(0);
  const current = files[Math.min(selected, files.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      {current ? <FileView file={current} title={item.title} /> : null}

      {files.length > 1 ? (
        <div className="grid grid-cols-6 gap-2">
          {files.map((file, index) => (
            <button
              key={file.url}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show ${file.name || `file ${index + 1}`}`}
              aria-pressed={file === current}
              className={`relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 bg-[#eef3ef] ${
                file === current ? "border-[#2563eb]" : "border-transparent hover:border-[#cbd6d0]"
              }`}
            >
              {file.media === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.url} alt="" className="h-full w-full object-cover" />
              ) : file.media === "video" ? (
                <span className="flex h-full w-full items-center justify-center bg-[#0b1522] text-white">
                  <Play size={16} strokeWidth={2} fill="currentColor" />
                </span>
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-white text-[#2563eb]">
                  <FileText size={16} strokeWidth={1.75} />
                  <span className="text-[9px] font-bold">{extensionOf(file.name || file.url)}</span>
                </span>
              )}
              <span className="absolute top-1 left-1 rounded bg-black/60 px-1 text-[9.5px] font-bold text-white">
                {index + 1}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-[#e1eae5] bg-[#fafcfb] px-4 py-3 no-underline hover:border-[#2563eb]"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe] text-[#2563eb]">
            <Link2 size={16} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12.5px] font-bold text-[#0d1e2c]">
              Linked {item.type === "video" ? "video" : "document"}
            </span>
            <span className="block truncate text-[11.5px] text-[#2563eb]">{item.link}</span>
          </span>
          <ExternalLink size={14} strokeWidth={2} className="shrink-0 text-[#7a8e9b]" />
        </a>
      ) : null}

      {!current && !item.link ? (
        <div className="rounded-lg border border-dashed border-[#cbd6d0] py-10 text-center text-[12.5px] text-[#7a8e9b]">
          No files on this piece.
        </div>
      ) : null}
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 border-b border-[#f2f5f3] py-2.5 text-[12px] first:pt-0 last:border-b-0 last:pb-0">
    <span className="inline-flex items-center gap-1.75 text-[#7a8e9b]">
      <Icon size={14} strokeWidth={2} /> {label}
    </span>
    <span className="text-right font-semibold text-[#17242f]">{children}</span>
  </div>
);

type Activity = { title: string; sub: string; color: string };

// What has happened to this piece so far, oldest first.
const activityOf = (item: ContentItem, status: ContentStatus = item.status, submittedAt = item.submittedAt): Activity[] => {
  const events: Activity[] = [
    {
      title: "Created",
      sub: `${formatDateTime(item.createdAt)} · ${personNameOf(item.createdBy) ?? "—"}`,
      color: "#94a3b8",
    },
  ];
  if (submittedAt)
    events.push({
      title: "Sent for approval",
      sub: formatDateTime(submittedAt),
      color: "#d97706",
    });
  const clientNote = [...item.comments].reverse().find((comment) => comment.author === "client");
  if (status === "revision_requested" && clientNote) {
    events.push({
      title: "Revision requested",
      sub: `${formatDateTime(clientNote.createdAt)} · ${clientNote.name ?? "Client"}`,
      color: "#dc2626",
    });
  }
  if (status === "approved") {
    events.push({
      title: "Approved by client",
      sub: `${formatDateTime(item.approvedAt)} · ${personNameOf(item.approvedBy) ?? "Client"}`,
      color: "#16a34a",
    });
  }
  return events;
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
  const batchType = item.batchType ?? (item.isIndividual ? "individual" : "monthly");
  const activity = activityOf(item);

  const sendForApproval = () =>
    startTransition(async () => {
      const result = await changeContentStatusAction(item._id, "pending_approval");
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't send it for approval.");
        return;
      }
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
              onClick={sendForApproval}
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
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/content" className={breadcrumbLink}>
            Content
          </Link>{" "}
          / <b>{item.title}</b>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className={pageTitle}>{item.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-[#657787]">
            <StatusBadge status={status} />
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

      <div className="grid items-start gap-4.5 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4.5">
          <Card badge={type} title="Preview">
            <Preview item={item} />
          </Card>

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

          <Card badge={{ icon: MessageSquare, ...BLUE }} title="Comments" aside={<Count>{comments.length}</Count>}>
            <CommentThread
              contentId={item._id}
              comments={comments}
              clientName={client}
              canComment={canWrite}
              maxHeight="max-h-[560px]"
              onPosted={() => router.refresh()}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-4.5">
          <Card badge={{ icon: Info, ...GRAY }} title="Details">
            <DetailRow icon={User} label="Client">
              {client}
            </DetailRow>
            <DetailRow icon={type.icon} label="Type">
              {type.label}
            </DetailRow>
            <DetailRow icon={CalendarDays} label="Batch">
              {BATCH_TYPE_LABELS[batchType]} · {item.batchMonth}
            </DetailRow>
            {batchType === "weekly" && item.weekStart ? (
              <DetailRow icon={CalendarDays} label="Week">
                {batchLabelOf(item).replace("Week of ", "")}
              </DetailRow>
            ) : null}
            {batchType === "event" ? (
              <DetailRow icon={CalendarDays} label="Event">
                {item.eventName ?? "—"}
                {item.eventDate ? ` · ${formatDate(item.eventDate)}` : ""}
              </DetailRow>
            ) : null}
            {item.pageName ? (
              <DetailRow icon={FileText} label="Page">
                {item.pageUrl ? (
                  <a
                    href={item.pageUrl.startsWith("http") ? item.pageUrl : `https://${item.pageUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563eb]"
                  >
                    {item.pageName}
                  </a>
                ) : (
                  item.pageName
                )}
              </DetailRow>
            ) : null}
            {item.subject ? (
              <DetailRow icon={Mail} label="Subject">
                {item.subject}
              </DetailRow>
            ) : null}
            {item.headline ? (
              <DetailRow icon={Tag} label="Headline">
                {item.headline}
              </DetailRow>
            ) : null}
            {item.cta ? (
              <DetailRow icon={SendHorizontal} label="Button">
                {item.cta}
              </DetailRow>
            ) : null}
            <DetailRow icon={CheckCircle2} label="Status">
              <StatusBadge status={status} />
            </DetailRow>
            <DetailRow icon={Pencil} label="Created by">
              {personNameOf(item.createdBy) ?? "—"}
            </DetailRow>
            <DetailRow icon={Clock} label="Last updated">
              {formatDate(item.updatedAt)}
            </DetailRow>
          </Card>

          <Card badge={{ icon: History, ...GRAY }} title="Activity">
            <div className="relative flex flex-col gap-4 before:absolute before:top-1.5 before:bottom-1.5 before:left-1.25 before:w-0.5 before:bg-[#eef3ef]">
              {activity.map((event) => (
                <div className="relative flex gap-3" key={event.title}>
                  <span
                    className="relative mt-0.75 h-3 w-3 shrink-0 rounded-full shadow-[0_0_0_3px_white]"
                    style={{ background: event.color }}
                  />
                  <div>
                    <div className="text-[12.5px] font-semibold text-[#17242f]">{event.title}</div>
                    <div className={dashPendingSub}>{event.sub}</div>
                  </div>
                </div>
              ))}
            </div>
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
    </>
  );
};

export default ContentDetails;
