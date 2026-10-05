// A placeholder shaped like the Content list, shown by its loading.tsx while the
// server renders — same cards, filter bar and table columns as ContentList, so
// nothing jumps when the real page arrives.

import {
  clientStatCard,
  clientStatsGrid,
  filterLeftGroup,
  filtersCard,
  pageHeaderRow,
  reportsTable,
  reportsTd,
  reportsTh,
  reportsTr,
  tableCard,
  tableFooter,
} from "@/component/shared/ui";

// Each bone pulses a little after the one before it, so the page shimmers top to
// bottom instead of blinking all at once.
const Bone = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <div className={`animate-pulse rounded-md bg-[#e8edea] ${className}`} style={{ animationDelay: delay ? `${delay}ms` : undefined }} />
);

// One page of content is ten rows; eight fills the screen without overshooting a short list.
const TABLE_ROWS = 8;

// The same column widths as the real table, with a bone as wide as each heading.
const COLUMNS = [
  ["w-[4%]", "w-3"],
  ["w-[28%]", "w-16"],
  ["w-[18%]", "w-12"],
  ["w-[11%]", "w-10"],
  ["w-[11%]", "w-12"],
  ["w-[13%]", "w-12"],
  ["w-[13%]", "w-24"],
  ["w-[12%]", "w-12"],
] as const;

// Client, type, status, month and batch — each select is as wide as its "All …" label.
const FILTER_WIDTHS = ["w-28", "w-26", "w-30", "w-30", "w-30"];

export const ContentListSkeleton = () => (
  <div className="flex flex-col gap-4.5" role="status" aria-live="polite" aria-label="Loading content">
    <div className={pageHeaderRow}>
      <div>
        <Bone className="h-8 w-32" />
        <Bone className="mt-2.5 h-3.5 w-100 max-w-full" />
      </div>
      <Bone className="h-10 w-34 bg-[#d5dcd8]" />
    </div>

    <div className={clientStatsGrid}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={clientStatCard}>
          <Bone className="h-9.5 w-9.5 shrink-0 rounded-lg" delay={index * 80} />
          <div className="min-w-0 flex-1">
            <Bone className="mt-0.5 h-3 w-24" delay={index * 80} />
            <Bone className="mt-3 h-8 w-12" delay={index * 80} />
            <Bone className="mt-4 h-3 w-32 max-w-full" delay={index * 80} />
          </div>
        </div>
      ))}
    </div>

    <div className={filtersCard}>
      <div className={`${filterLeftGroup} flex-wrap`}>
        {FILTER_WIDTHS.map((width, index) => (
          <Bone key={index} className={`h-9.25 ${width}`} delay={100 + index * 50} />
        ))}
      </div>
      <Bone className="h-9.25 w-65 shrink-0" delay={350} />
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
                <td className={reportsTd}>
                  <Bone className="h-3 w-4" delay={delay} />
                </td>
                <td className={reportsTd}>
                  {/* Two lines — the title and who prepared it — set the row's height. */}
                  <div className="flex h-9.5 items-center gap-3">
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
                  <Bone className={`h-5.5 rounded-xl ${["w-16", "w-20", "w-14", "w-18"][index % 4]}`} delay={delay} />
                </td>
                <td className={reportsTd}>
                  <Bone className="h-3 w-24 max-w-full" delay={delay} />
                </td>
                <td className={reportsTd}>
                  <Bone className={`h-5.5 max-w-full rounded-xl ${["w-28", "w-20", "w-32", "w-24"][index % 4]}`} delay={delay} />
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
        <Bone className="h-3 w-40 bg-[#e1e7e3]" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 4 }, (_, index) => (
            <Bone key={index} className="h-7 w-7 rounded bg-[#e1e7e3]" />
          ))}
        </div>
      </div>
    </div>
    <span className="sr-only">Loading content…</span>
  </div>
);
