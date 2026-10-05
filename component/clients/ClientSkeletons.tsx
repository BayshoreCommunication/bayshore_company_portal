// A placeholder shaped like the Clients list, shown by its loading.tsx while the
// server renders — same summary cards, status tabs and client cards as ClientCard,
// so nothing jumps when the real page arrives.

import { clientStatCard, clientStatsGrid, headlineRow } from "@/component/shared/ui";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <div className={`animate-pulse rounded-md bg-[#e8edea] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined }} />
);

// One page of clients is nine cards; six (two rows) fills the screen without overshooting a short list.
const CARDS = 6;

// "All Clients (n)" and one tab per status — the first is the one selected.
const TAB_WIDTHS = ["w-28", "w-22", "w-26", "w-24", "w-22"];

export const ClientListSkeleton = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading clients">
    <div className={headlineRow}>
      <div>
        <Bone className="h-8 w-28" />
        <Bone className="mt-2.5 h-3.5 w-130 max-w-full" />
      </div>
      <Bone className="h-10.5 w-32 bg-[#d5dcd8]" />
    </div>

    <div className={clientStatsGrid}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={clientStatCard}>
          <Bone className="h-9.5 w-9.5 shrink-0 rounded-lg" delay={index * 80} />
          <div className="min-w-0 flex-1">
            <Bone className="mt-0.5 h-3 w-28 max-w-full" delay={index * 80} />
            <Bone className="mt-3 h-8 w-12" delay={index * 80} />
            <Bone className="mt-4 h-3 w-32 max-w-full" delay={index * 80} />
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap items-stretch justify-between gap-3">
      <div className="flex gap-1.5 rounded-lg border border-[#dbe3de] bg-white p-1">
        {TAB_WIDTHS.map((width, index) => (
          <Bone key={index} className={`h-8.25 ${width} ${index === 0 ? "bg-[#d5dcd8]" : ""}`} delay={100 + index * 50} />
        ))}
      </div>
      <div className="flex w-70 max-w-full flex-none rounded-lg border border-[#dbe3de] bg-white p-1">
        <Bone className="h-8.25 flex-1 bg-[#f0f3f1]" delay={350} />
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: CARDS }, (_, index) => {
        const delay = 150 + index * 70;
        return (
          <div key={index} className="flex flex-col rounded-[10px] border border-[#dbe3de] bg-white p-4.5">
            <div className="mb-2.5 flex items-start justify-between">
              <Bone className="h-7 w-7 rounded-full" delay={delay} />
              <Bone className="h-5.5 w-16 rounded-xl" delay={delay} />
            </div>
            {/* Company names aren't all the same length. */}
            <Bone className={`my-1 h-3.5 ${["w-2/3", "w-1/2", "w-3/4"][index % 3]}`} delay={delay} />
            <Bone className="mt-2 h-2.5 w-2/5" delay={delay} />
            <Bone className="mt-2 h-2.5 w-3/5" delay={delay} />
            <div className="mt-3.5 flex flex-wrap gap-2">
              {Array.from({ length: 2 + (index % 2) }, (_, chip) => (
                <Bone key={chip} className={`h-6 rounded-xl ${["w-14", "w-20", "w-16"][chip]}`} delay={delay} />
              ))}
            </div>
            <div className="mt-3.5 flex items-center justify-between border-t border-[#eef3ef] pt-3.5">
              <Bone className="h-2.5 w-32" delay={delay} />
              <Bone className="h-7.5 w-26 bg-[#d5dcd8]" delay={delay} />
            </div>
          </div>
        );
      })}
    </div>
    <span className="sr-only">Loading clients…</span>
  </div>
);
