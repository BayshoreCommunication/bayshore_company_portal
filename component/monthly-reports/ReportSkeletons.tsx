// A placeholder shaped like the Monthly Reports list, shown by its loading.tsx while
// the server renders — same cards, filter bar and table columns as ReportList, so
// nothing jumps when the real page arrives.

import { filterLeftGroup, filtersCard, reportsTable, reportsTd, reportsTh, reportsTr, tableCard, tableFooter } from "@/component/shared/ui";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <div className={`animate-pulse rounded-md bg-[#e8edea] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined }} />
);

// One page of reports is ten rows; eight fills the screen without overshooting a short list.
const TABLE_ROWS = 8;

// The same column widths as the real table, with a bone as wide as each heading.
const COLUMNS = [
  ["w-px pr-1", "w-3"],
  ["w-[34%]", "w-14"],
  ["w-[19%]", "w-12"],
  ["w-[15%]", "w-12"],
  ["w-[11%]", "w-12"],
  ["w-[13%]", "w-24"],
  ["w-[8%]", "w-12"],
] as const;

export const ReportListSkeleton = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading reports">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Bone className="h-8 w-60" />
        <Bone className="mt-2 h-3.5 w-110 max-w-full" />
      </div>
      <Bone className="h-9.5 w-44 rounded-lg bg-[#d5dcd8]" />
    </div>

    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-start gap-3 rounded-[10px] border border-[#dbe3de] bg-white px-4.5 py-4">
          <Bone className="h-9.5 w-9.5 shrink-0 rounded-lg" delay={index * 80} />
          <div className="min-w-0 flex-1">
            <Bone className="mt-0.5 h-3 w-24" delay={index * 80} />
            <Bone className="mt-3 h-8 w-12" delay={index * 80} />
            <Bone className="mt-3.5 h-3 w-32 max-w-full" delay={index * 80} />
          </div>
        </div>
      ))}
    </div>

    <div className={filtersCard}>
      <div className={filterLeftGroup}>
        <Bone className="h-9.25 w-36" delay={100} />
        <Bone className="h-9.25 w-36" delay={150} />
        <Bone className="h-9.25 w-32" delay={200} />
      </div>
      <Bone className="h-9.25 w-65" delay={250} />
    </div>

    <div className={tableCard}>
      <table className={reportsTable} aria-hidden="true">
        <thead>
          <tr>
            {COLUMNS.map(([width, heading], index) => (
              <th key={index} className={`${reportsTh} ${width}`}>
                <Bone className={`my-0.75 h-2.5 bg-[#e1e7e3] ${heading}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: TABLE_ROWS }, (_, index) => {
            const delay = 120 + index * 70;
            return (
              <tr key={index} className={reportsTr}>
                <td className={`${reportsTd} pr-1`}>
                  <Bone className="h-3 w-4" delay={delay} />
                </td>
                <td className={reportsTd}>
                  <div className="flex items-center gap-3">
                    <Bone className="h-7.5 w-7.5 shrink-0 rounded-[7px]" delay={delay} />
                    <div className="min-w-0 flex-1">
                      {/* Titles aren't all the same length. */}
                      <Bone className={`h-3 ${["w-3/4", "w-2/3", "w-4/5", "w-1/2"][index % 4]}`} delay={delay} />
                      <Bone className="mt-2 h-2.5 w-24" delay={delay} />
                    </div>
                  </div>
                </td>
                <td className={reportsTd}>
                  <div className="flex items-center gap-3">
                    <Bone className="h-8 w-8 shrink-0 rounded-full" delay={delay} />
                    <Bone className={`h-3 ${["w-28", "w-24", "w-32", "w-20"][index % 4]}`} delay={delay} />
                  </div>
                </td>
                <td className={reportsTd}>
                  {/* Two lines — the period and its Weekly / Monthly pill — set the row's height. */}
                  <div className="flex h-10 flex-col justify-center">
                    <Bone className="h-3 w-24" delay={delay} />
                    <Bone className="mt-2 h-4 w-16 rounded-full" delay={delay} />
                  </div>
                </td>
                <td className={reportsTd}>
                  <Bone className="h-5.5 w-20 rounded-xl" delay={delay} />
                </td>
                <td className={reportsTd}>
                  <Bone className="h-3 w-28 max-w-full" delay={delay} />
                </td>
                <td className={reportsTd}>
                  <div className="flex items-center gap-2">
                    <Bone className="h-7.5 w-7.5 rounded-md" delay={delay} />
                    <Bone className="h-7.5 w-7.5 rounded-md" delay={delay} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={tableFooter}>
        <Bone className="h-3 w-44 bg-[#e1e7e3]" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }, (_, index) => (
            <Bone key={index} className="h-7 w-7 rounded bg-[#e1e7e3]" />
          ))}
        </div>
      </div>
    </div>
    <span className="sr-only">Loading reports…</span>
  </div>
);
