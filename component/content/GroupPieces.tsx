"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import type { ContentPiece } from "@/app/actions/content";
import { CONTENT_KINDS, STATUS_BADGES } from "./contentUi";

// When several pieces were saved together, this sits at the top of each one's page and says
// so plainly: how many there are, which one is on screen, how many are approved — and a tile
// per piece to move to it. The details page shows it for reading the pieces one by one, the
// edit page for editing them one by one. Not meant for a piece saved alone.

const MODES = {
  view: {
    doing: "viewing",
    here: "Viewing",
    hint: "They were added together, and the client approves each one on its own.",
    hrefOf: (piece: ContentPiece) => `/content/${piece._id}`,
  },
  edit: {
    doing: "editing",
    here: "Editing",
    hint: "Save this one, then move on to the next — each piece is saved on its own.",
    hrefOf: (piece: ContentPiece) => `/content/edit?id=${piece._id}`,
  },
};

const stepClass = "inline-flex h-8.5 items-center gap-1 rounded-md border px-3 text-[12px] font-semibold no-underline";

const GroupPieces = ({
  pieces,
  currentId,
  mode = "view",
  confirmLeave,
}: {
  pieces: ContentPiece[];
  currentId: string;
  mode?: keyof typeof MODES;
  // Asked before moving to another piece — return false to stay (unsaved changes).
  confirmLeave?: () => boolean;
}) => {
  const { doing, here, hint, hrefOf } = MODES[mode];
  const position = pieces.findIndex((piece) => piece._id === currentId);
  const approved = pieces.filter((piece) => piece.status === "approved").length;

  const guard = (event: { preventDefault: () => void }) => {
    if (confirmLeave && !confirmLeave()) event.preventDefault();
  };

  // A step button: a link when there is a piece that way, greyed out when not.
  const step = (piece: ContentPiece | undefined, children: ReactNode) =>
    piece ? (
      <Link
        href={hrefOf(piece)}
        onClick={guard}
        className={`${stepClass} border-[#c5d3ee] bg-white text-[#17242f] hover:border-[#2563eb] hover:text-[#2563eb]`}
      >
        {children}
      </Link>
    ) : (
      <span aria-disabled="true" className={`${stepClass} cursor-default border-[#e3eae6] bg-white/60 text-[#b3bfc8]`}>
        {children}
      </span>
    );

  return (
    <section
      aria-label="Pieces in this content"
      className="overflow-hidden rounded-[10px] border border-[#c5d3ee] bg-[linear-gradient(135deg,#e8f0fe_0%,#f5f9ff_45%,#ffffff_100%)] shadow-[0_2px_8px_rgba(37,99,235,0.08)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-[0_4px_10px_rgba(37,99,235,0.3)]">
            <Layers size={21} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="text-[16px] leading-tight font-bold text-[#0d1e2c]">This content has {pieces.length} pieces</div>
            <div className="mt-1 text-[12.5px] text-[#556977]">
              You&apos;re {doing}{" "}
              <b className="text-[#17242f]">
                piece {position + 1} of {pieces.length}
              </b>
              . {hint}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="w-36">
            <div className="mb-1.5 flex items-baseline justify-between text-[11px] text-[#556977]">
              <span>Approved</span>
              <span className="font-bold text-[#17242f]">
                {approved} of {pieces.length}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#cfe9d7]">
              <div className="h-1.5 rounded-full bg-[#16a34a]" style={{ width: `${(approved / pieces.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step(
              pieces[position - 1],
              <>
                <ChevronLeft size={14} strokeWidth={2.25} /> Previous
              </>,
            )}
            {step(
              pieces[position + 1],
              <>
                Next <ChevronRight size={14} strokeWidth={2.25} />
              </>,
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {pieces.map((piece, index) => {
          const kind = CONTENT_KINDS[piece.type] ?? CONTENT_KINDS.image;
          const state = STATUS_BADGES[piece.status];
          const current = piece._id === currentId;
          const tile = (
            <>
              {/* The piece's first image when it has one, otherwise its kind's icon — numbered either way. */}
              <span className="relative shrink-0">
                {piece.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={piece.thumbnail} alt="" className="h-14 w-14 rounded-lg bg-[#f1f5f3] object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-lg" style={{ background: kind.background, color: kind.color }}>
                    <kind.icon size={22} strokeWidth={1.9} />
                  </span>
                )}
                <span
                  className={`absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-bold text-white ${
                    current ? "bg-[#2563eb]" : "bg-[#0b1522]"
                  }`}
                >
                  {index + 1}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10.5px] font-bold tracking-[0.4px] text-[#7a8e9b] uppercase">
                  Piece {index + 1} · {kind.label}
                </span>
                <span className="mt-0.5 block truncate text-[13px] font-bold text-[#17242f]">{piece.title}</span>
                <span className={`${state.badge} mt-1.5`}>
                  <span className={state.dot} /> {state.label}
                </span>
              </span>

              {current ? (
                <span className="shrink-0 rounded-md bg-[#2563eb] px-2 py-1 text-[10px] font-bold text-white">{here}</span>
              ) : (
                <ChevronRight size={17} strokeWidth={2.25} className="shrink-0 text-[#9fb0bc] group-hover:text-[#2563eb]" />
              )}
            </>
          );
          const tileClass = "group relative flex items-center gap-3 rounded-lg border bg-white p-3 text-inherit no-underline transition-shadow";

          // The piece on screen isn't a link to itself.
          return current ? (
            <div key={piece._id} aria-current="page" className={`${tileClass} border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.14)]`}>
              {tile}
            </div>
          ) : (
            <Link
              key={piece._id}
              href={hrefOf(piece)}
              onClick={guard}
              className={`${tileClass} border-[#dbe3de] hover:border-[#9db8ee] hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]`}
            >
              {tile}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default GroupPieces;
