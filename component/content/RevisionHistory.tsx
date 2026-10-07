import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, FileText, MessageSquareText, Play } from "lucide-react";
import type { ContentComment, ContentFile, ContentPiece, ContentRevision } from "@/app/actions/content";
import { CONTENT_KINDS, STATUS_BADGES, formatDateTime, revisionsOf } from "./contentUi";

// Where a piece's page opens when it is reached from here: at its preview — the image, video
// or document itself — rather than at the very top of the page. ContentDetails puts this id
// on the preview card.
export const PREVIEW_ANCHOR = "preview";

// The revisions to list on a piece's page: its own, with where it sits among the pieces saved
// with it. The others keep theirs on their own pages.
export const ownRevisionsOf = (pieces: ContentPiece[], currentId: string, comments: ContentComment[]) => {
  const index = Math.max(0, pieces.findIndex((piece) => piece._id === currentId));
  return { piece: pieces[index], index, revisions: revisionsOf(pieces[index], comments) };
};

// Where one revision stands, from the team's side. Only a piece's latest can still be open:
// waiting on the team, or sent back and waiting on the client.
const stateOf = (revision: ContentRevision, latest: boolean, piece: ContentPiece) => {
  if (latest && piece.status === "revision_requested") return { label: "To do — the client is waiting", color: "#b91c1c", background: "#fde8e8", dot: "#dc2626" };
  if (latest && piece.status === "pending_approval") return { label: "Sent back — waiting for the client", color: "#a35a12", background: "#fbecd3", dot: "#d97706" };
  if (latest && piece.status === "approved" && !revision.submittedAt && revision.requests.length > 0) {
    return { label: "Closed — approved as it was", color: "#556977", background: "#eef3ef", dot: "#94a3b8" };
  }
  return { label: "Completed", color: "#15803d", background: "#dcf3e2", dot: "#16a34a" };
};

// What the client attached to a request: pictures and videos as small tiles, documents as chips.
const Files = ({ files }: { files: ContentFile[] }) => (
  <div className="mt-2 flex flex-wrap gap-1.5">
    {files.map((file) =>
      file.media === "doc" ? (
        <a
          key={file.url}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#dbe3de] bg-white py-1.5 pr-2.5 pl-1.5 text-[11.5px] font-semibold text-[#17242f] no-underline hover:border-[#2563eb]"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#dbeafe] text-[#2563eb]">
            <FileText size={13} strokeWidth={2} />
          </span>
          <span className="truncate">{file.name}</span>
        </a>
      ) : (
        <a
          key={file.url}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${file.name}`}
          className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#dbe3de] bg-[#eef3ef]"
        >
          {file.media === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
          ) : (
            <>
              <video src={file.url} muted preload="metadata" className="h-full w-full bg-black object-cover" />
              <span className="absolute inset-0 flex items-center justify-center text-white">
                <Play size={14} strokeWidth={2} fill="currentColor" />
              </span>
            </>
          )}
        </a>
      ),
    )}
  </div>
);

// One revision on a piece's timeline: its number on the line, what the client asked for, then
// what the team sent back. `reply` is where the team answers it — says what they changed and
// sends the piece back — shown while it is still to do.
const Revision = ({
  revision,
  latest,
  last,
  piece,
  reply,
}: {
  revision: ContentRevision;
  latest: boolean;
  last: boolean;
  piece: ContentPiece;
  reply?: ReactNode;
}) => {
  const state = stateOf(revision, latest, piece);
  const todo = latest && piece.status === "revision_requested";

  return (
    <li className="relative pb-5 pl-9 last:pb-0">
      {/* The line down to the next (earlier) revision, and this one's number on it. */}
      {last ? null : <span aria-hidden="true" className="absolute top-7 bottom-0 left-[11px] w-px bg-[#dbe3de]" />}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 flex h-6 w-6 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
        style={{ background: state.dot }}
      >
        {revision.number}
      </span>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-[#0d1e2c]">Revision {revision.number}</span>
        <span className="rounded-md px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: state.background, color: state.color }}>
          {state.label}
        </span>
      </div>

      {/* What the client asked for */}
      <div className="mt-2.5 rounded-lg border border-[#e1eae5] bg-white p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold tracking-[0.3px] text-[#7a8e9b] uppercase">
          <MessageSquareText size={12} strokeWidth={2} />
          {revision.requestedByName ? `${revision.requestedByName} asked for changes` : "Changes requested"}
          {revision.requestedAt ? <span className="font-medium tracking-normal normal-case">· {formatDateTime(revision.requestedAt)}</span> : null}
        </div>
        {revision.requests.length > 0 ? (
          revision.requests.map((request, index) => (
            <div key={`${request.createdAt}-${index}`} className={index > 0 ? "mt-2.5 border-t border-[#f2f5f3] pt-2.5" : "mt-2"}>
              {index > 0 ? <div className="mb-1 text-[10.5px] text-[#9aacb8]">Added {formatDateTime(request.createdAt)}</div> : null}
              {request.text ? <p className="text-[12.5px] leading-normal whitespace-pre-line text-[#24333f] wrap-anywhere">{request.text}</p> : null}
              {request.attachments?.length ? <Files files={request.attachments} /> : null}
            </div>
          ))
        ) : (
          <p className="mt-2 text-[12px] text-[#7a8e9b]">No note was left with this request.</p>
        )}
      </div>

      {/* The team's feedback so far, with anything attached */}
      {revision.responses?.map((response, index) => (
        <div key={`${response.createdAt}-${index}`} className="mt-2 rounded-lg border border-[#cfe0fb] bg-[#f3f7fe] p-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold tracking-[0.3px] text-[#2563eb] uppercase">
            <MessageSquareText size={12} strokeWidth={2} />
            {response.name ? `${response.name}'s update` : "Team update"}
            <span className="font-medium tracking-normal normal-case">· {formatDateTime(response.createdAt)}</span>
          </div>
          {response.text ? <p className="mt-2 text-[12.5px] leading-normal whitespace-pre-line text-[#24333f] wrap-anywhere">{response.text}</p> : null}
          {response.attachments?.length ? <Files files={response.attachments} /> : null}
        </div>
      ))}

      {/* What the team sent back — or that it is still to do */}
      {revision.submittedAt ? (
        <div className="mt-2 rounded-lg border border-[#cfe0fb] bg-[#f3f7fe] p-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold tracking-[0.3px] text-[#2563eb] uppercase">
            <CheckCircle2 size={12} strokeWidth={2.25} />
            Revised piece sent back
            <span className="font-medium tracking-normal normal-case">
              · {formatDateTime(revision.submittedAt)}
              {revision.submittedByName ? ` · ${revision.submittedByName}` : ""}
            </span>
          </div>
          {revision.note ? (
            <p className="mt-2 text-[12.5px] leading-normal whitespace-pre-line text-[#24333f] wrap-anywhere">{revision.note}</p>
          ) : revision.responses?.length ? null : (
            <p className="mt-1.5 text-[12px] text-[#7a8e9b]">No note was left for the client.</p>
          )}
        </div>
      ) : todo ? (
        (reply ?? (
          <div className="mt-2 flex items-center gap-1.5 px-1 text-[11.5px] text-[#7a8e9b]">
            <Clock size={12} strokeWidth={2} /> Open this piece to make the changes and send it back.
          </div>
        ))
      ) : null}
    </li>
  );
};

// The revisions of the piece on screen: which piece it is (its picture, number, kind, title
// and status), then a timeline of its revisions, newest first — what the client asked for and
// what the team sent back. The heading goes up to its preview. The client's portal shows the
// same history from their side. `reply` is the box under the open revision, where the team
// answers it.
const RevisionHistory = ({ pieces, own, reply }: { pieces: ContentPiece[]; own: ReturnType<typeof ownRevisionsOf>; reply?: ReactNode }) => {
  const { piece, index, revisions } = own;
  const kind = CONTENT_KINDS[piece.type] ?? CONTENT_KINDS.image;
  const badge = STATUS_BADGES[piece.status];

  return (
    <section className="overflow-hidden rounded-lg border border-[#dbe3de] bg-[#fafcfb]">
      <Link
        href={`#${PREVIEW_ANCHOR}`}
        className="group flex items-center gap-3 border-b border-[#e9efec] bg-white px-3.5 py-3 text-inherit no-underline hover:bg-[#f7faff]"
      >
        {piece.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-[#f1f5f3] object-cover" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: kind.background, color: kind.color }}>
            <kind.icon size={19} strokeWidth={1.9} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10.5px] font-bold tracking-[0.4px] text-[#7a8e9b] uppercase">
            {pieces.length > 1 ? `Piece ${index + 1} · ` : ""}
            {kind.label}
          </span>
          <span className="mt-0.5 block truncate text-[13.5px] font-bold text-[#17242f] group-hover:text-[#2563eb]">{piece.title}</span>
        </span>
        <span className={badge.badge}>
          <span className={badge.dot} /> {badge.label}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-[#7a8e9b] group-hover:text-[#2563eb]">
          View <ArrowUpRight size={13} strokeWidth={2.25} />
        </span>
      </Link>

      <div className="p-4">
        {revisions.length > 0 ? (
          <ol className="list-none">
            {revisions.map((revision, position) => (
              <Revision
                key={revision.number}
                revision={revision}
                latest={position === 0}
                last={position === revisions.length - 1}
                piece={piece}
                reply={reply}
              />
            ))}
          </ol>
        ) : (
          <p className="text-[12.5px] text-[#7a8e9b]">The client hasn&apos;t asked for any revisions.</p>
        )}
      </div>
    </section>
  );
};

export default RevisionHistory;
