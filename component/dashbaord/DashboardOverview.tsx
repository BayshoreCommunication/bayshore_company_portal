import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Clapperboard,
  Clock,
  FileText,
  Image as ImageIcon,
  Receipt,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// The staff dashboard: how the whole book of clients is doing this month, laid out like
// the client portal's dashboard. Every figure below is sample data until it's wired to the API.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

type TrendDirection = "up" | "down" | "flat";
type Change = { percent: number; direction: TrendDirection };

// "October 2026" / "September" / "Sep" — this month and the ones before, for the sample text.
const monthName = (offset: number, options: Intl.DateTimeFormatOptions) => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
};

// The date tile for a meeting some days from today, so the sample never shows a past date.
const dayFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: String(date.getDate()).padStart(2, "0"),
  };
};

// ── The four headline cards ──────────────────────────────────────────────────

const SAMPLE_CARDS: {
  title: string;
  value: string;
  change: Change | null;
  // An increase is bad news here (money still owed), so it shows red.
  lowerIsBetter?: boolean;
  href: string;
  icon: LucideIcon;
  color: string;
  background: string;
}[] = [
  { title: "ACTIVE CLIENTS", value: "48", change: { percent: 4.3, direction: "up" }, href: "/clients", icon: Users, color: "#2f5fd8", background: "#dce4f3" },
  { title: "LEADS CAPTURED", value: "312", change: { percent: 8, direction: "up" }, href: "/leads", icon: UserPlus, color: "#16a34a", background: "#d6ebdc" },
  { title: "REVENUE COLLECTED", value: "$28.5K", change: { percent: 2.6, direction: "down" }, href: "/payments", icon: Wallet, color: "#4f46e5", background: "#e0e0f3" },
  {
    title: "UNPAID PAYMENTS",
    value: "$14.9K",
    change: { percent: 18.3, direction: "up" },
    lowerIsBetter: true,
    href: "/payments",
    icon: Receipt,
    color: "#dc2626",
    background: "#f6dcdf",
  },
];

// The ▲/▼ at a card's bottom right. Always shown: a grey "0.0%" when nothing changed,
// and a grey "—" when there's no earlier month to compare with.
const MetricTrend = ({ change, note, lowerIsBetter = false }: { change: Change | null; note: string; lowerIsBetter?: boolean }) => {
  const direction = change?.direction;
  const good = lowerIsBetter ? "down" : "up";
  const color = direction === "up" || direction === "down" ? (direction === good ? "text-[#16a34a]" : "text-[#e11d2e]") : "text-[#8a94a6]";

  return (
    <div className={`flex shrink-0 items-center gap-1.5 pb-1 text-[12px] font-medium whitespace-nowrap ${color}`}>
      {direction === "up" || direction === "down" ? (
        <svg width="12" height="7" viewBox="0 0 12 7" fill="currentColor" aria-hidden className={direction === "up" ? "" : "rotate-180"}>
          <path d="M6 0 12 7H0z" />
        </svg>
      ) : null}
      {change ? `${change.percent.toFixed(1)}%` : "—"}
      <span className="ml-2 font-normal text-[#56637a]">vs {note}</span>
    </div>
  );
};

// ── Shared chart pieces ──────────────────────────────────────────────────────

// 28450 → "28,450"; axis ticks → "40K".
const formatNumber = (value: number) => value.toLocaleString("en-US");
const formatMoney = (value: number) => `$${formatNumber(value)}`;
const formatTick = (value: number) => (value >= 1000 ? `${Math.round((value / 1000) * 10) / 10}K` : String(value));

// A round top for the chart: 4 equal steps of 1, 2, 2.5 or 5 × a power of ten.
const niceMax = (value: number) => {
  const rough = value / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((candidate) => candidate >= rough) ?? rough;
  return step * 4;
};

// The small figures under a chart. An increase is green unless less is better (unpaid, overdue).
type Metric = { label: string; value: string; change?: { percent: number; direction: "up" | "down" }; lowerIsBetter?: boolean };

const MetricGrid = ({ metrics }: { metrics: Metric[] }) => (
  <div className="mt-5 grid gap-3 border-t border-[#eef0f2] pt-4" style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}>
    {metrics.map((metric) => {
      const good = metric.change ? (metric.change.direction === "up") !== Boolean(metric.lowerIsBetter) : false;
      return (
        <div key={metric.label} className="min-w-0">
          <div className="truncate text-[11.5px] text-[#4b5260]">{metric.label}</div>
          <div className="mt-1 flex items-center gap-2.5">
            <span className="text-[20px] leading-none font-bold text-[#0b0c24]">{metric.value}</span>
            {metric.change ? (
              <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${good ? "text-[#16a34a]" : "text-[#e11d2e]"}`}>
                <svg width="12" height="7" viewBox="0 0 12 7" fill="currentColor" aria-hidden className={metric.change.direction === "up" ? "" : "rotate-180"}>
                  <path d="M6 0 12 7H0z" />
                </svg>
                {metric.change.percent.toFixed(1)}%
              </span>
            ) : null}
          </div>
        </div>
      );
    })}
  </div>
);

// A chart card's top row: icon tile, title and subtitle, and the headline figure on the right.
const ChartHeader = ({
  icon: Icon,
  color,
  tile,
  title,
  sub,
  headline,
  headlineLabel,
  href,
}: {
  icon: LucideIcon;
  color: string;
  tile: string;
  title: string;
  sub: string;
  headline: string;
  headlineLabel: string;
  href: string;
}) => (
  <div className="flex items-start justify-between gap-3">
    <Link href={href} className="flex min-w-0 items-center gap-3 text-inherit no-underline">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: tile, color }}>
        <Icon size={21} strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-bold text-[#0b0c24] uppercase">{title}</span>
        <span className="block truncate text-[12px] text-[#6b7280]">{sub}</span>
      </span>
    </Link>
    <div className="shrink-0 text-right">
      <div className="text-[24px] leading-none font-bold text-[#0b0c24]">{headline}</div>
      <div className="mt-1 text-[11.5px] text-[#6b7280]">{headlineLabel}</div>
    </div>
  </div>
);

// ── Revenue, new clients and unpaid payments ─────────────────────────────────

// One color per series, everywhere it appears: what was collected is blue, what is
// still unpaid is orange (here and in the unpaid-by-client bars), new clients violet.
const COLLECTED = "#2a78d6";
const UNPAID = "#eb6834";
const NEW_CLIENTS = "#4a3aa7";

type Series = { name: string; color: string; values: number[] };

// A lighter step of a series color. Opaque, so gridlines never show through a mark.
const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, white)`;

// Twelve months, oldest first; the last is this month.
const SAMPLE_REVENUE: Series[] = [
  { name: "Collected", color: COLLECTED, values: [14200, 15100, 16400, 15800, 17900, 18600, 19800, 21400, 23650, 25100, 29200, 28450] },
  { name: "Unpaid", color: UNPAID, values: [0, 0, 300, 0, 450, 0, 600, 900, 1200, 1850, 3400, 6200] },
];

const SAMPLE_NEW_CLIENTS: Series[] = [{ name: "New clients", color: NEW_CLIENTS, values: [2, 1, 3, 2, 4, 2, 3, 2, 2, 1, 3, 3] }];

// What each client still owes, largest first. `overdueDays` is missing while an invoice isn't due yet.
const SAMPLE_UNPAID: { client: string; amount: number; overdueDays?: number; dueInDays?: number }[] = [
  { client: "Carter Injury Law", amount: 4200, overdueDays: 21 },
  { client: "Apex Advisor Group", amount: 3650, dueInDays: 6 },
  { client: "McCulloch Law P.A.", amount: 2800, overdueDays: 9 },
  { client: "Tiki Travel Agency", amount: 1950, dueInDays: 12 },
  { client: "4 other clients", amount: 2300 },
];

// One month's figures, shown while its slot is hovered or focused (the slot is the `group`).
// Values lead and names follow; with several series the total comes last.
const ChartTooltip = ({
  offset,
  series,
  index,
  format,
  className,
  style,
}: {
  offset: number;
  series: Series[];
  index: number;
  format: (value: number) => string;
  className: string;
  style?: CSSProperties;
}) => (
  <div
    className={`pointer-events-none absolute z-10 hidden rounded-xl border border-[#e6e8eb] bg-white/95 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.16)] backdrop-blur-sm group-hover:block group-focus-visible:block ${className}`}
    style={style}
  >
    <div className="text-[10.5px] whitespace-nowrap text-[#6b7280]">{monthName(offset, { month: "long", year: "numeric" })}</div>
    {series.map((item) => (
      <div key={item.name} className="mt-1 flex items-center gap-2 text-[11.5px] whitespace-nowrap">
        <span className="h-0.75 w-3 rounded-full" style={{ background: item.color }} />
        <span className="text-[#4b5260]">{item.name}</span>
        <span className="ml-auto pl-4 font-bold text-[#0b0c24]">{format(item.values[index])}</span>
      </div>
    ))}
    {series.length > 1 ? (
      <div className="mt-1.5 flex items-center gap-2 border-t border-[#eef0f2] pt-1.5 text-[11.5px] whitespace-nowrap">
        <span className="text-[#4b5260]">Invoiced</span>
        <span className="ml-auto pl-4 font-bold text-[#0b0c24]">{format(series.reduce((sum, item) => sum + item.values[index], 0))}</span>
      </div>
    ) : null}
  </div>
);

// Columns over the last twelve months — stacked when there is more than one series.
// This month is solid and labeled; earlier months are lighter until hovered (or tabbed to),
// which also shows their figures. The columns grow from the baseline as the page opens.
const ColumnChart = ({
  series,
  format,
  tickFormat,
  height = "h-44",
}: {
  series: Series[];
  format: (value: number) => string;
  tickFormat: (value: number) => string;
  // A Tailwind height class for the plot.
  height?: string;
}) => {
  const offsets = Array.from({ length: series[0].values.length }, (_, index) => index - series[0].values.length + 1);
  const totals = offsets.map((_, index) => series.reduce((sum, item) => sum + item.values[index], 0));
  const top = niceMax(Math.max(...totals));
  const ticks = [4, 3, 2, 1, 0].map((step) => (top / 4) * step);

  return (
    <div className="flex gap-2">
      <div className={`flex ${height} flex-col justify-between text-right text-[10px] text-[#4b5260] tabular-nums`}>
        {ticks.map((tick) => (
          <span key={tick} className="-my-1.5 leading-3">
            {tickFormat(tick)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`relative ${height}`}>
          {ticks.map((tick, index) => (
            <span key={tick} className="absolute inset-x-0 border-t border-[#f0f1f3]" style={{ top: `${(index / 4) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end">
            {offsets.map((offset, index) => {
              const current = offset === 0;
              const shown = series.filter((item) => item.values[index] > 0);
              // Keep the tooltip inside the card at either end of the chart.
              const align = index < 2 ? "left-0" : index > offsets.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <div
                  key={offset}
                  tabIndex={0}
                  role="img"
                  aria-label={`${monthName(offset, { month: "long", year: "numeric" })}: ${series.map((item) => `${item.name} ${format(item.values[index])}`).join(", ")}`}
                  className="group relative flex h-full flex-1 items-end justify-center px-1 outline-none"
                >
                  <span className="pointer-events-none absolute inset-x-0.5 inset-y-0 rounded-lg bg-[linear-gradient(to_top,#eef1f6,transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
                  <div className="relative w-full max-w-6" style={{ height: `${(totals[index] / top) * 100}%` }}>
                    <div
                      className="absolute inset-0 flex origin-bottom flex-col-reverse gap-0.5 motion-safe:animate-chart-grow-y"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      {shown.map((item, position) => (
                        <span
                          key={item.name}
                          className={`relative min-h-0.5 overflow-hidden ${position === shown.length - 1 ? "rounded-t-[5px]" : ""}`}
                          style={{ flex: item.values[index], background: `linear-gradient(to top, ${tint(item.color, 34)}, ${tint(item.color, 62)})` }}
                        >
                          {/* The full-strength fill: always on this month, faded in on the others while hovered. */}
                          <span
                            className={`absolute inset-0 transition-opacity duration-200 ${
                              current ? "" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                            }`}
                            style={{ background: `linear-gradient(to top, ${tint(item.color, 72)}, ${item.color})` }}
                          />
                        </span>
                      ))}
                    </div>
                    {current ? (
                      <span
                        className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-[10.5px] font-bold whitespace-nowrap text-[#0b0c24] group-hover:opacity-0 group-focus-visible:opacity-0 motion-safe:animate-chart-fade"
                        style={{ animationDelay: `${index * 45 + 450}ms` }}
                      >
                        {tickFormat(totals[index])}
                      </span>
                    ) : null}
                    <ChartTooltip offset={offset} series={series} index={index} format={format} className={`bottom-full mb-2 ${align}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex">
          {offsets.map((offset) => (
            <span key={offset} className={`flex-1 text-center text-[10.5px] ${offset === 0 ? "font-bold text-[#0b0c24]" : "text-[#6b7280]"}`}>
              {monthName(offset, { month: "short" })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── The revenue area chart ───────────────────────────────────────────────────

type Point = { x: number; y: number };
type Segment = { start: Point; c1: Point; c2: Point; end: Point };

const at = ({ x, y }: Point) => `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;

// A smooth curve through the points that never rises above or dips below them
// (a monotone cubic), so the line can't suggest a value no month actually had.
const smoothSegments = (points: Point[]): Segment[] => {
  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / (point.x - points[index].x));
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes[slopes.length - 1];
    const before = slopes[index - 1];
    const after = slopes[index];
    return before * after <= 0 ? 0 : (2 * before * after) / (before + after);
  });

  return points.slice(1).map((end, index) => {
    const start = points[index];
    const third = (end.x - start.x) / 3;
    return {
      start,
      c1: { x: start.x + third, y: start.y + tangents[index] * third },
      c2: { x: end.x - third, y: end.y - tangents[index + 1] * third },
      end,
    };
  });
};

// The curve drawn left to right, and the same curve continued right to left (to close a band).
const pathAlong = (segments: Segment[]) =>
  `M${at(segments[0].start)}${segments.map((segment) => `C${at(segment.c1)} ${at(segment.c2)} ${at(segment.end)}`).join("")}`;
const pathBack = (segments: Segment[]) =>
  [...segments].reverse().map((segment) => `C${at(segment.c2)} ${at(segment.c1)} ${at(segment.start)}`).join("");

// Stacked areas over the last twelve months: each series sits on the ones before it, so the
// top line is the total. Hovering (or tabbing to) a month drops a guide line with its figures.
// The chart draws in from the left as the page opens, and this month's points carry a soft halo.
const AreaChart = ({
  id,
  series,
  format,
  tickFormat,
}: {
  // Unique on the page — names the gradient.
  id: string;
  series: Series[];
  format: (value: number) => string;
  tickFormat: (value: number) => string;
}) => {
  const count = series[0].values.length;
  const offsets = Array.from({ length: count }, (_, index) => index - count + 1);
  // stacks[s][i] is the top of series s in month i.
  const stacks = series.map((_, position) =>
    offsets.map((_, index) => series.slice(0, position + 1).reduce((sum, item) => sum + item.values[index], 0)),
  );
  const totals = stacks[stacks.length - 1];
  const top = niceMax(Math.max(...totals));
  const ticks = [4, 3, 2, 1, 0].map((step) => (top / 4) * step);

  // The plot is drawn on a 100 × 100 grid and stretched to fit; each month sits mid-slot.
  const x = (index: number) => ((index + 0.5) / count) * 100;
  const lines = stacks.map((stack) => smoothSegments(stack.map((value, index) => ({ x: x(index), y: 100 - (value / top) * 100 }))));
  const bands = lines.map((line, position) =>
    position === 0
      ? `${pathAlong(line)}L${at({ x: x(count - 1), y: 100 })}L${at({ x: x(0), y: 100 })}Z`
      : `${pathAlong(line)}L${at(lines[position - 1][count - 2].end)}${pathBack(lines[position - 1])}Z`,
  );

  return (
    <div className="flex gap-2">
      <div className="flex h-56 flex-col justify-between text-right text-[10px] text-[#4b5260] tabular-nums">
        {ticks.map((tick) => (
          <span key={tick} className="-my-1.5 leading-3">
            {tickFormat(tick)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-56">
          {ticks.map((tick, index) => (
            <span key={tick} className="absolute inset-x-0 border-t border-[#f0f1f3]" style={{ top: `${(index / 4) * 100}%` }} />
          ))}

          {/* The negative vertical insets in the reveal keep each line's glow from being clipped. */}
          <div className="absolute inset-0 motion-safe:animate-chart-reveal" aria-hidden>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                {series.map((item, position) => (
                  <linearGradient key={item.name} id={`${id}-fill-${position}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={item.color} stopOpacity={position === 0 ? 0.34 : 0.42} />
                    <stop offset="1" stopColor={item.color} stopOpacity={position === 0 ? 0.02 : 0.16} />
                  </linearGradient>
                ))}
              </defs>
              {bands.map((band, position) => (
                <path key={series[position].name} d={band} fill={`url(#${id}-fill-${position})`} />
              ))}
            </svg>
            {/* One layer per line so each casts a glow in its own color. Upper lines first,
                so where two meet the lower series' line stays on top. */}
            {lines
              .map((line, position) => (
                <svg
                  key={series[position].name}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full overflow-visible"
                  style={{ filter: `drop-shadow(0 6px 6px color-mix(in srgb, ${series[position].color} 32%, transparent))` }}
                >
                  <path
                    d={pathAlong(line)}
                    fill="none"
                    stroke={series[position].color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ))
              .reverse()}
          </div>

          <div className="absolute inset-0 flex">
            {offsets.map((offset, index) => {
              const current = offset === 0;
              const height = `${(totals[index] / top) * 100}%`;
              // Keep the tooltip inside the card at either end of the chart.
              const align = index < 2 ? "left-0" : index > count - 3 ? "right-0" : "left-1/2 -translate-x-1/2";
              return (
                <div
                  key={offset}
                  tabIndex={0}
                  role="img"
                  aria-label={`${monthName(offset, { month: "long", year: "numeric" })}: ${series.map((item) => `${item.name} ${format(item.values[index])}`).join(", ")}`}
                  className="group relative h-full flex-1 outline-none"
                >
                  <span className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(to_top,#aeb7c5,transparent)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" />
                  {/* A dot on each line: always on this month, on the others while hovered. */}
                  {stacks.map((stack, position) =>
                    position > 0 && series[position].values[index] === 0 ? null : (
                      <span
                        key={series[position].name}
                        className={`pointer-events-none absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full ${
                          current
                            ? "motion-safe:animate-chart-fade"
                            : "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                        }`}
                        style={{
                          bottom: `${(stack[index] / top) * 100}%`,
                          background: series[position].color,
                          // A white ring to lift the dot off the line, then a soft halo in its own color.
                          boxShadow: `0 0 0 2px #fff, 0 0 0 ${current ? 6 : 5}px color-mix(in srgb, ${series[position].color} 22%, transparent)`,
                          animationDelay: current ? "900ms" : undefined,
                        }}
                      />
                    ),
                  )}
                  {current ? (
                    <span
                      className="pointer-events-none absolute left-1/2 mb-3.5 -translate-x-1/2 text-[10.5px] font-bold whitespace-nowrap text-[#0b0c24] group-hover:opacity-0 group-focus-visible:opacity-0 motion-safe:animate-chart-fade"
                      style={{ bottom: height, animationDelay: "900ms" }}
                    >
                      {tickFormat(totals[index])}
                    </span>
                  ) : null}
                  <ChartTooltip offset={offset} series={series} index={index} format={format} className={`mb-4 ${align}`} style={{ bottom: height }} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex">
          {offsets.map((offset) => (
            <span key={offset} className={`flex-1 text-center text-[10.5px] ${offset === 0 ? "font-bold text-[#0b0c24]" : "text-[#6b7280]"}`}>
              {monthName(offset, { month: "short" })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// What was invoiced each month, split into what has come in and what is still owed.
const RevenueCard = () => {
  const [collected, unpaid] = SAMPLE_REVENUE;
  const last = collected.values.length - 1;
  const invoiced = collected.values[last] + unpaid.values[last];

  return (
    <div className={`${cardClass} px-5 pt-5 pb-5`}>
      <ChartHeader
        icon={Wallet}
        color={COLLECTED}
        tile="#dbe8fb"
        title="Revenue"
        sub="Invoiced each month — collected and still unpaid"
        headline={formatMoney(collected.values[last])}
        headlineLabel={`Collected in ${monthName(0, { month: "long" })}`}
        href="/payments"
      />

      <div className="mt-5 mb-4 flex items-center gap-4 text-[11.5px] text-[#4b5260]">
        {SAMPLE_REVENUE.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs" style={{ background: item.color }} />
            {item.name}
          </span>
        ))}
      </div>

      <AreaChart id="revenue" series={SAMPLE_REVENUE} format={formatMoney} tickFormat={(value) => `$${formatTick(value)}`} />

      <MetricGrid
        metrics={[
          { label: "INVOICED", value: formatMoney(invoiced), change: { percent: 6.3, direction: "up" } },
          { label: "COLLECTED", value: formatMoney(collected.values[last]), change: { percent: 2.6, direction: "down" } },
          { label: "UNPAID", value: formatMoney(unpaid.values[last]), change: { percent: 82.4, direction: "up" }, lowerIsBetter: true },
          { label: "COLLECTION RATE", value: `${Math.round((collected.values[last] / invoiced) * 100)}%` },
        ]}
      />
    </div>
  );
};

// How clients are coming in: the number signed each month.
const NewClientsCard = () => (
  <div className={`${cardClass} px-5 pt-5 pb-5`}>
    <ChartHeader
      icon={Users}
      color={NEW_CLIENTS}
      tile="#e3e0f5"
      title="New Clients"
      sub="Clients signed each month"
      headline="48"
      headlineLabel="Active clients"
      href="/clients"
    />

    <div className="mt-6">
      <ColumnChart series={SAMPLE_NEW_CLIENTS} format={String} tickFormat={String} height="h-48.5" />
    </div>

    <MetricGrid
      metrics={[
        { label: "THIS MONTH", value: "3" },
        { label: "ONBOARDING", value: "4" },
        { label: "CLOSED", value: "1", change: { percent: 50, direction: "down" }, lowerIsBetter: true },
      ]}
    />
  </div>
);

// Who still owes what. Every bar carries its amount, so nothing here depends on hovering.
const UnpaidCard = () => {
  const total = SAMPLE_UNPAID.reduce((sum, row) => sum + row.amount, 0);
  const largest = Math.max(...SAMPLE_UNPAID.map((row) => row.amount));
  const overdue = SAMPLE_UNPAID.filter((row) => row.overdueDays).reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className={`${cardClass} px-5 pt-5 pb-5`}>
      <ChartHeader
        icon={Receipt}
        color={UNPAID}
        tile="#fbe3d9"
        title="Unpaid Payments"
        sub="Outstanding invoices by client"
        headline={formatMoney(total)}
        headlineLabel="Outstanding"
        href="/payments"
      />

      <div className="mt-6 flex flex-col gap-3">
        {SAMPLE_UNPAID.map((row, position) => (
          <div key={row.client}>
            <div className="mb-1.5 flex items-center gap-2 text-[12px]">
              <span className="min-w-0 truncate font-semibold text-[#0b0c24]">{row.client}</span>
              {row.overdueDays ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-[#fbe0e0] px-1.5 py-px text-[9.5px] font-semibold text-[#b91c1c]">
                  <AlertCircle size={10} strokeWidth={2.5} /> Overdue {row.overdueDays}d
                </span>
              ) : row.dueInDays ? (
                <span className="shrink-0 text-[10.5px] text-[#6b7280]">Due in {row.dueInDays}d</span>
              ) : null}
              <span className="ml-auto shrink-0 font-bold text-[#0b0c24] tabular-nums">{formatMoney(row.amount)}</span>
            </div>
            <div className="h-2 rounded-full bg-[#f1f3f6]">
              <div
                className="h-2 origin-left rounded-full motion-safe:animate-chart-grow-x"
                style={{
                  width: `${(row.amount / largest) * 100}%`,
                  background: `linear-gradient(90deg, ${tint(UNPAID, 58)}, ${UNPAID})`,
                  animationDelay: `${position * 80}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <MetricGrid
        metrics={[
          { label: "OVERDUE", value: formatMoney(overdue) },
          { label: "INVOICES", value: "11" },
          { label: "CLIENTS", value: "8" },
        ]}
      />
    </div>
  );
};

// ── The right column ─────────────────────────────────────────────────────────

// A right-column card: icon tile, title and subtitle, an optional count, the list, and a footer link.
const SideCard = ({
  icon: Icon,
  iconColor,
  iconBackground,
  title,
  sub,
  count,
  footer,
  children,
}: {
  icon: LucideIcon;
  iconColor: string;
  iconBackground: string;
  title: string;
  sub: string;
  count?: number;
  footer: { href: string; label: string };
  children: ReactNode;
}) => (
  <div className={`${cardClass} overflow-hidden`}>
    <div className="flex items-center gap-3 px-4.5 pt-4.5 pb-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBackground, color: iconColor }}>
        <Icon size={19} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-bold text-[#0b0c24] uppercase">{title}</div>
        <div className="truncate text-[11.5px] text-[#6b7280]">{sub}</div>
      </div>
      {count !== undefined ? (
        <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-[#fbdada] text-[11.5px] font-bold text-[#dc2626]">
          {count}
        </span>
      ) : null}
    </div>
    <div className="flex flex-col gap-1 px-2.5 pb-2">{children}</div>
    <Link
      href={footer.href}
      className="flex items-center justify-center gap-1.5 border-t border-[#eef0f2] py-3.5 text-[12px] font-bold tracking-[0.4px] text-[#0b0c24] uppercase no-underline hover:bg-[#f9fafb]"
    >
      {footer.label} <ArrowRight size={14} strokeWidth={2.25} />
    </Link>
  </div>
);

// Work waiting on the team: reports to review, content a client sent back, new project requests.
type ReviewKind = "report" | "content" | "reel" | "project";
type ReviewStatus = "review" | "revision" | "request";

const REVIEW_ICONS: Record<ReviewKind, { icon: LucideIcon; background: string; color: string; href: string }> = {
  report: { icon: FileText, background: "#dbe8fb", color: "#1877f2", href: "/monthly-reports" },
  content: { icon: ImageIcon, background: "#d6ebdc", color: "#16a34a", href: "/content" },
  reel: { icon: Clapperboard, background: "#f6dcdf", color: "#dc2626", href: "/content" },
  project: { icon: Briefcase, background: "#f5e3c9", color: "#c8811f", href: "/projects" },
};

const REVIEW_PILLS: Record<ReviewStatus, { label: string; background: string; color: string; dot: string }> = {
  review: { label: "In Review", background: "#fbecd3", color: "#a35a12", dot: "#d99136" },
  revision: { label: "Revision Requested", background: "#fbe0e0", color: "#b91c1c", dot: "#dc2626" },
  request: { label: "New Request", background: "#dce4f3", color: "#2f5fd8", dot: "#2f5fd8" },
};

const SAMPLE_REVIEWS: { kind: ReviewKind; title: string; sub: string; status: ReviewStatus }[] = [
  { kind: "report", title: "Monthly Performance Report", sub: "Carter Injury Law", status: "review" },
  { kind: "reel", title: "Reel — “Know Your Rights”", sub: "McCulloch Law P.A.", status: "revision" },
  { kind: "project", title: "Website Redesign", sub: "Apex Advisor Group", status: "request" },
  { kind: "content", title: "Blog — Dog Bite Claims Explained", sub: "Trip Law, P.A.", status: "revision" },
  { kind: "report", title: "Weekly Report — Week 4", sub: "Tiki Travel Agency", status: "review" },
];

// `inDays` is counted from today when the page renders.
const SAMPLE_MEETINGS = [
  { inDays: 1, title: "Monthly Strategy Call", sub: "Carter Injury Law · 2:00 PM" },
  { inDays: 3, title: "Social Media Review", sub: "McCulloch Law P.A. · 10:30 AM" },
  { inDays: 6, title: "Website Redesign Kickoff", sub: "Apex Advisor Group · 11:00 AM" },
  { inDays: 9, title: "Quarterly Campaign Review", sub: "Trip Law, P.A. · 4:00 PM" },
];

// ── The dashboard ────────────────────────────────────────────────────────────

const DashboardOverview = ({ name }: { name: string }) => (
  <>
    <div className="mt-1.5">
      <div className="text-[30px] leading-tight font-bold tracking-[-0.2px] text-[#0b0c24]">Welcome back{name ? `, ${name}` : ""}</div>
      <div className="mt-1.5 text-[13px] text-[#4b5563]">
        Here&apos;s how your clients are doing in {monthName(0, { month: "long", year: "numeric" })} so far, compared to {monthName(-1, { month: "long" })}.
      </div>
    </div>

    <div className="grid grid-cols-4 gap-4">
      {SAMPLE_CARDS.map((card) => (
        <div className="rounded-xl border border-[#e6e8eb] bg-white px-4 pt-3.5 pb-4.5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]" key={card.title}>
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg border"
              style={{ background: card.background, color: card.color, borderColor: `${card.color}33` }}
            >
              <card.icon size={16} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold tracking-[0.2px] text-[#4a4a4a]">{card.title}</span>
            <Link
              href={card.href}
              aria-label={`Open ${card.title.toLowerCase()}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d6dce7] text-[#34466b] hover:bg-[#c5cee0]"
            >
              <ArrowUpRight size={15} strokeWidth={2} />
            </Link>
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-[34px] leading-none font-semibold tracking-[-0.3px] text-[#0a0a0f]">{card.value}</span>
            <MetricTrend change={card.change} note={monthName(-1, { month: "short" })} lowerIsBetter={card.lowerIsBetter} />
          </div>
        </div>
      ))}
    </div>

    <div className="mt-1 flex items-center justify-between">
      <div className="text-base font-bold text-[#0d1e2c]">Activity by Area</div>
      <Link href="/payments" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#2563eb] no-underline hover:underline">
        View payments <ArrowRight size={13} strokeWidth={2.5} />
      </Link>
    </div>

    <div className="grid grid-cols-[minmax(0,2.7fr)_minmax(300px,1fr)] items-start gap-5">
      <div className="flex flex-col gap-4">
        <RevenueCard />
        <div className="grid grid-cols-2 gap-4">
          <NewClientsCard />
          <UnpaidCard />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SideCard
          icon={Clock}
          iconColor="#d97706"
          iconBackground="#f8e4c6"
          title="Needs Your Attention"
          sub={`${SAMPLE_REVIEWS.length} items waiting on the team`}
          count={SAMPLE_REVIEWS.length}
          footer={{ href: "/monthly-reports?status=submitted", label: `Review All (${SAMPLE_REVIEWS.length})` }}
        >
          {SAMPLE_REVIEWS.map((item) => {
            const tile = REVIEW_ICONS[item.kind];
            const pill = REVIEW_PILLS[item.status];
            return (
              <Link
                href={tile.href}
                key={`${item.title}-${item.sub}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-inherit no-underline hover:bg-[#f7f8fa]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: tile.background, color: tile.color }}>
                  <tile.icon size={18} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold text-[#0b0c24]">{item.title}</span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-[#6b7280]">{item.sub}</span>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-px text-[9.5px] font-semibold"
                      style={{ background: pill.background, color: pill.color }}
                    >
                      <span className="h-1 w-1 rounded-full" style={{ background: pill.dot }} />
                      {pill.label}
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </SideCard>

        <SideCard
          icon={CalendarDays}
          iconColor="#2f5fd8"
          iconBackground="#dce4f3"
          title="Upcoming Meetings"
          sub="With your clients"
          footer={{ href: "/calendar", label: `View All (${SAMPLE_MEETINGS.length})` }}
        >
          {SAMPLE_MEETINGS.map((meeting) => {
            const date = dayFromNow(meeting.inDays);
            return (
              <div className="flex items-center gap-3 rounded-xl px-2 py-2.5" key={meeting.title}>
                <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-[#eceef1] bg-[#f7f8fa]">
                  <span className="text-[9px] leading-none font-semibold text-[#dc2626] uppercase">{date.month}</span>
                  <span className="mt-0.5 text-[15px] leading-none font-bold text-[#0b0c24]">{date.day}</span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-bold text-[#0b0c24]">{meeting.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#6b7280]">{meeting.sub}</span>
                </span>
              </div>
            );
          })}
        </SideCard>
      </div>
    </div>
  </>
);

export default DashboardOverview;
