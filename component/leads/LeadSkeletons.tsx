// Placeholders shaped like the Leads pages, shown by their loading.tsx files while
// the server renders — same grids and sizes as LeadsList and LeadForm, so nothing
// jumps when the real page arrives.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0, width }: { className: string; delay?: number; width?: string }) => (
  <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined, width }} />
);

const Header = ({ actions }: { actions: React.ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <Bone className="h-8 w-32" />
      <Bone className="mt-2 h-3.5 w-80 max-w-full" />
    </div>
    <div className="flex items-center gap-2.5">{actions}</div>
  </div>
);

const SideCard = ({ bars, delay }: { bars: number; delay: number }) => (
  <div className={`${cardClass} p-4.5`}>
    <div className="mb-4 flex items-center gap-3">
      <Bone className="h-9 w-9 shrink-0 rounded-lg" delay={delay} />
      <div className="flex-1">
        <Bone className="h-3 w-36" delay={delay} />
        <Bone className="mt-1.5 h-2.5 w-20" delay={delay} />
      </div>
    </div>
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: bars }, (_, bar) => (
        <div key={bar}>
          <div className="mb-1.5 flex justify-between">
            <Bone className="h-3 w-24" delay={delay + bar * 60} />
            <Bone className="h-3 w-12" delay={delay + bar * 60} />
          </div>
          {/* Shorter and shorter, like a real breakdown sorted by size. */}
          <div className="h-2 rounded-full bg-[#f3f4f6]">
            <Bone className="h-2 rounded-full bg-[#e2e5e9]" delay={delay + bar * 60} width={`${90 - bar * 17}%`} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── /leads ───────────────────────────────────────────────────────────────────

const TABLE_ROWS = 8;

export const LeadsListSkeleton = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading leads">
    <Header
      actions={
        <>
          <Bone className="h-9.5 w-30 rounded-lg" />
          <Bone className="h-9.5 w-28 rounded-lg bg-[#d9dce1]" />
        </>
      }
    />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={`${cardClass} px-4 pt-3.5 pb-4`}>
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 shrink-0 rounded-lg" delay={index * 80} />
            <div className="flex-1">
              <Bone className="h-3 w-24" delay={index * 80} />
              <Bone className="mt-1.5 h-2.5 w-32" delay={index * 80} />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <Bone className="h-7.5 w-14" delay={index * 80} />
            <Bone className="h-3 w-24" delay={index * 80} />
          </div>
        </div>
      ))}
    </div>

    <div className={`${cardClass} flex flex-wrap items-center gap-3 p-3.5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Bone key={index} className="h-9.5 w-full rounded-lg sm:w-42" delay={index * 50} />
      ))}
      <Bone className="h-9.5 w-full rounded-lg xl:ml-auto xl:max-w-72" delay={250} />
    </div>

    <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className={`${cardClass} p-3.5`}>
        <div className="h-9.5 rounded-lg bg-[#f3f4f6]" />
        {Array.from({ length: TABLE_ROWS }, (_, index) => {
          const delay = 120 + index * 70;
          return (
            <div key={index} className="flex items-center gap-3 border-b border-[#eef0f2] px-3 py-3">
              <Bone className="h-9 w-9 shrink-0 rounded-full" delay={delay} />
              <div className="w-[24%] min-w-28">
                {/* Names aren't all the same length. */}
                <Bone className={`h-3 ${["w-3/4", "w-2/3", "w-4/5", "w-1/2"][index % 4]}`} delay={delay} />
                <Bone className="mt-1.5 h-2.5 w-1/2" delay={delay} />
              </div>
              <Bone className="hidden h-3 w-[14%] sm:block" delay={delay} />
              <Bone className="hidden h-3 w-[12%] sm:block" delay={delay} />
              <Bone className="hidden h-3 w-[11%] md:block" delay={delay} />
              <Bone className="hidden h-3 w-[10%] md:block" delay={delay} />
              <Bone className="ml-auto h-6 w-24 rounded-md" delay={delay} />
              <div className="hidden gap-1 sm:flex">
                <Bone className="h-7.5 w-7.5 rounded-md" delay={delay} />
                <Bone className="h-7.5 w-7.5 rounded-md" delay={delay} />
              </div>
            </div>
          );
        })}
        <div className="mt-4 flex items-center justify-between px-1">
          <Bone className="h-3 w-36" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }, (_, index) => (
              <Bone key={index} className="h-8 w-8 rounded-md" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4.5">
        <SideCard bars={4} delay={150} />
        <SideCard bars={5} delay={300} />
      </div>
    </div>
    <span className="sr-only">Loading leads…</span>
  </div>
);

// ── /leads/add and /leads/[id]/edit ──────────────────────────────────────────

const Field = ({ delay, label = "w-20" }: { delay: number; label?: string }) => (
  <div>
    <Bone className={`mb-2 h-3 ${label}`} delay={delay} />
    <Bone className="h-10 w-full rounded-lg" delay={delay} />
  </div>
);

export const LeadFormSkeleton = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading lead form">
    <Header actions={<Bone className="h-9.5 w-34 rounded-lg" />} />

    <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className={`${cardClass} p-5`}>
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((row) => (
            <div key={row} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field delay={row * 90} label={["w-14", "w-16", "w-20"][row]} />
              <Field delay={row * 90 + 40} label={["w-20", "w-12", "w-16"][row]} />
            </div>
          ))}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field delay={270} label="w-24" />
          </div>
          <div>
            <Bone className="mb-2 h-3 w-12" delay={320} />
            <Bone className="h-20 w-full rounded-lg" delay={320} />
            <Bone className="mt-1.5 h-2.5 w-44" delay={320} />
          </div>
          <Bone className="h-3 w-48" delay={360} />
        </div>
        <div className="mt-5 flex justify-end gap-2.5 border-t border-[#eef0f2] pt-4">
          <Bone className="h-9.5 w-20 rounded-lg" delay={400} />
          <Bone className="h-9.5 w-28 rounded-lg bg-[#d9dce1]" delay={400} />
        </div>
      </div>

      <div className={`${cardClass} p-4.5`}>
        <Bone className="mb-3.5 h-3.5 w-20" />
        <div className="rounded-xl border border-[#eef0f2] bg-[#f9fafb] p-3.5">
          <div className="flex items-center gap-3">
            <Bone className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1">
              <Bone className="h-3 w-3/4" />
              <Bone className="mt-1.5 h-2.5 w-1/2" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2.5 border-t border-[#eef0f2] pt-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex justify-between">
                <Bone className="h-2.5 w-14" delay={index * 60} />
                <Bone className="h-2.5 w-20" delay={index * 60} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    <span className="sr-only">Loading…</span>
  </div>
);
