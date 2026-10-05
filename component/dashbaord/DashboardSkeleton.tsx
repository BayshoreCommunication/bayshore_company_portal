// A placeholder shaped like the dashboard, shown by its loading.tsx while the server
// renders — same headline cards, charts and side cards as DashboardOverview, so
// nothing jumps when the real page arrives.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0, width, height }: { className: string; delay?: number; width?: string; height?: string }) => (
  <div className={`animate-pulse rounded-md bg-[#eceef1] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined, width, height }} />
);

// A chart card's top row: icon tile, title and subtitle, and the headline figure on the right.
const ChartHeader = ({ delay }: { delay: number }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-center gap-3">
      <Bone className="h-11 w-11 shrink-0 rounded-xl" delay={delay} />
      <div>
        <Bone className="h-3.5 w-28" delay={delay} />
        <Bone className="mt-2 h-3 w-44 max-w-full" delay={delay} />
      </div>
    </div>
    <div className="flex flex-col items-end">
      <Bone className="h-6 w-24" delay={delay} />
      <Bone className="mt-2 h-2.5 w-20" delay={delay} />
    </div>
  </div>
);

// The small figures under a chart, below their hairline.
const Metrics = ({ count, delay }: { count: number; delay: number }) => (
  <div className="mt-5 grid gap-3 border-t border-[#eef0f2] pt-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index}>
        <Bone className="mt-0.5 h-3 w-16" delay={delay + index * 50} />
        <Bone className="mt-2 h-5 w-20 max-w-full" delay={delay + index * 50} />
      </div>
    ))}
  </div>
);

// The y-axis figures and the month names that frame a chart.
const Axis = ({ height, children }: { height: string; children: React.ReactNode }) => (
  <div className="flex gap-2">
    <div className={`flex ${height} flex-col justify-between`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Bone key={index} className="-my-1 h-2 w-6" />
      ))}
    </div>
    <div className="min-w-0 flex-1">
      <div className={`relative ${height}`}>
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className="absolute inset-x-0 border-t border-[#f0f1f3]" style={{ top: `${(index / 4) * 100}%` }} />
        ))}
        {children}
      </div>
      <div className="mt-2 flex h-4 items-center">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="flex flex-1 justify-center">
            <Bone className="h-2 w-5" />
          </span>
        ))}
      </div>
    </div>
  </div>
);

// Twelve months of columns, uneven like real counts.
const COLUMN_HEIGHTS = [50, 25, 75, 50, 100, 50, 75, 50, 50, 25, 75, 75];

// A right-column card: icon tile, title and subtitle, the list, and a footer link.
const SideCard = ({ rows, delay, dateTiles = false }: { rows: number; delay: number; dateTiles?: boolean }) => (
  <div className={`${cardClass} overflow-hidden`}>
    <div className="flex items-center gap-3 px-4.5 pt-4.5 pb-3.5">
      <Bone className="h-10 w-10 shrink-0 rounded-xl" delay={delay} />
      <div className="flex-1">
        <Bone className="h-3 w-40 max-w-full" delay={delay} />
        <Bone className="mt-2 h-2.5 w-32 max-w-full" delay={delay} />
      </div>
    </div>
    <div className="flex flex-col gap-1 px-2.5 pb-2">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-3 px-2 py-2.5">
          <Bone className="h-10 w-10 shrink-0 rounded-xl" delay={delay + 60 + row * 60} />
          <div className="min-w-0 flex-1">
            {/* Titles aren't all the same length. */}
            <Bone className={`h-3 ${["w-4/5", "w-3/5", "w-2/3", "w-3/4"][row % 4]}`} delay={delay + 60 + row * 60} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <Bone className="h-2.5 w-24" delay={delay + 60 + row * 60} />
              {dateTiles ? null : <Bone className="h-3.5 w-20 rounded" delay={delay + 60 + row * 60} />}
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="flex justify-center border-t border-[#eef0f2] py-4">
      <Bone className="h-3 w-28" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading dashboard">
    <div className="mt-1.5">
      <Bone className="h-9 w-80 max-w-full" />
      <Bone className="mt-2.5 h-3.5 w-130 max-w-full" />
    </div>

    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-xl border border-[#e6e8eb] bg-white px-4 pt-3.5 pb-4.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center gap-3">
            <Bone className="h-8.5 w-8.5 shrink-0 rounded-lg" delay={index * 80} />
            <Bone className="h-3 w-28 max-w-full" delay={index * 80} />
            <Bone className="ml-auto h-7 w-7 shrink-0 rounded-full" delay={index * 80} />
          </div>
          <div className="flex items-end justify-between gap-2">
            <Bone className="h-8.5 w-24" delay={index * 80} />
            <Bone className="mb-1 h-3 w-20" delay={index * 80} />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-1 flex h-6 items-center justify-between">
      <Bone className="h-4 w-32" />
      <Bone className="h-3 w-24" />
    </div>

    <div className="grid grid-cols-[minmax(0,2.7fr)_minmax(300px,1fr)] items-start gap-5">
      <div className="flex flex-col gap-4">
        {/* Revenue: the legend, then the outline of a rising area chart. */}
        <div className={`${cardClass} px-5 pt-5 pb-5`}>
          <ChartHeader delay={120} />
          <div className="mt-5 mb-4 flex h-4.5 items-center gap-4">
            <Bone className="h-3 w-20" delay={160} />
            <Bone className="h-3 w-16" delay={160} />
          </div>
          <Axis height="h-56">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full animate-pulse" style={{ animationDelay: "200ms" }} aria-hidden>
              <path d="M4,66 C14,63 22,58 32,59 C42,60 50,54 60,48 C70,42 78,32 86,22 C90,18 93,17 96,16 L96,100 L4,100 Z" fill="#eceef1" />
            </svg>
          </Axis>
          <Metrics count={4} delay={260} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* New clients: twelve columns. */}
          <div className={`${cardClass} px-5 pt-5 pb-5`}>
            <ChartHeader delay={320} />
            <div className="mt-6">
              <Axis height="h-48.5">
                <div className="absolute inset-0 flex items-end">
                  {COLUMN_HEIGHTS.map((height, index) => (
                    <span key={index} className="flex h-full flex-1 items-end justify-center px-1">
                      <Bone className="w-full max-w-6 rounded-t-[5px] rounded-b-none" delay={360 + index * 40} height={`${height}%`} />
                    </span>
                  ))}
                </div>
              </Axis>
            </div>
            <Metrics count={3} delay={520} />
          </div>

          {/* Unpaid payments: one bar per client, longest first. */}
          <div className={`${cardClass} px-5 pt-5 pb-5`}>
            <ChartHeader delay={380} />
            <div className="mt-6 flex flex-col gap-3">
              {[100, 87, 67, 46, 55].map((width, index) => (
                <div key={index}>
                  <div className="mb-1.5 flex h-4.5 items-center justify-between">
                    <Bone className={`h-3 ${["w-32", "w-36", "w-32", "w-28", "w-24"][index]}`} delay={420 + index * 60} />
                    <Bone className="h-3 w-12" delay={420 + index * 60} />
                  </div>
                  <div className="h-2 rounded-full bg-[#f4f5f7]">
                    <Bone className="h-2 rounded-full bg-[#e2e5e9]" delay={420 + index * 60} width={`${width}%`} />
                  </div>
                </div>
              ))}
            </div>
            <Metrics count={3} delay={560} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SideCard rows={5} delay={180} />
        <SideCard rows={4} delay={420} dateTiles />
      </div>
    </div>
    <span className="sr-only">Loading dashboard…</span>
  </div>
);
