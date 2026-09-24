// Tailwind class strings for the building blocks many pages share — page headers,
// buttons, cards, form fields, tables. One-off styles live inline in each component.

// ── Page header ──────────────────────────────────────────────────────────────
export const breadcrumbRow = "flex items-center justify-between";
export const breadcrumbs = "text-[13px] text-[#6a7b8a] [&_b]:text-[#18232c]";
export const breadcrumbLink = "cursor-pointer font-bold text-[#18232c] hover:underline";
export const pageTitle = "font-[Georgia,serif] text-[26px] font-bold text-[#0b1a26]";
export const pageDesc = "mt-1 text-[13px] text-[#657787]";
// Title on the left, actions on the right — `headlineRow` sits them on the baseline.
export const headlineRow = "flex items-end justify-between";
export const pageHeaderRow = "flex items-center justify-between";
export const actionButtons = "flex gap-2.5";

// ── Buttons ──────────────────────────────────────────────────────────────────
export const btnDraft =
  "cursor-pointer rounded-md border border-[#cfdcd6] bg-white px-4.5 py-2.25 text-[13px] font-semibold text-[#273847]";
export const btnPrimary = "cursor-pointer rounded-md bg-[#d99136] px-5 py-2.25 text-[13px] font-semibold text-white";
export const btnSaveClient =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#2563eb] px-4.5 py-2.5 text-[12.5px] font-bold text-white disabled:cursor-default disabled:opacity-60";
export const btnViewReport =
  "cursor-pointer whitespace-nowrap rounded-md bg-[#0d1e2e] px-4 py-2.25 text-[12.5px] font-bold text-white";
export const btnDanger =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#dc2626] bg-[#dc2626] px-4 py-2.25 text-[13px] font-semibold text-white disabled:cursor-wait";
export const btnDangerOutline =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#f0b8b8] bg-white px-4 py-2.25 text-[13px] font-semibold text-[#b42318]";
export const btnEditAction =
  "inline-flex cursor-pointer items-center gap-1.25 rounded-[5px] border border-[#cbd6d0] bg-white px-2.5 py-1.25 text-[11.5px] font-semibold text-[#273847] no-underline hover:bg-[#f1f5f3]";
export const moreBtn = "cursor-pointer px-1 text-[16px] text-[#7a8e9b]";
export const deleteConfirm = "inline-flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-[#b42318]";

// ── Cards & layout ───────────────────────────────────────────────────────────
export const sectionCard = "rounded-lg border border-[#dbe3de] bg-white p-5 transition-all duration-200";
export const sectionHeader = "mb-4 flex items-center justify-between gap-2.5 border-b border-[#eef3ef] pb-3";
export const sectionTitle = "text-[15px] font-bold text-[#0d1e2c]";
export const sectionSub = "text-[11.5px] text-[#64748b]";
// `sideCardBase` has no colors, for tinted variants; `sideCard` is the plain white one.
export const sideCardBase = "mb-4.5 rounded-lg border px-5 py-4.5";
export const sideCard = `${sideCardBase} border-[#dbe3de] bg-white`;
export const sideHeader = "mb-3.5";
export const sideTitle = "text-[14px] font-bold text-[#0d1e2c]";
export const sideSub = "mt-0.5 mb-3.5 text-[11px] text-[#728492]";
export const dashMainGrid = "grid grid-cols-[2.1fr_1fr] items-start gap-5";
export const dashSideCol = "flex flex-col gap-4";
export const layoutGrid = "grid grid-cols-[2fr_1fr] items-start gap-5";
export const contentStack = "flex flex-col gap-4";

// ── Stats & small text ───────────────────────────────────────────────────────
export const dashMetricsGrid = "grid grid-cols-4 gap-4";
export const dashMetricCard = "rounded-[10px] border border-[#dbe3de] bg-white px-5 py-4.5";
export const dashMetricLbl = "mb-2 text-[10.5px] font-bold tracking-[0.6px] text-[#8496a3]";
export const dashMetricVal = "mb-2 text-[30px] font-bold text-[#0d1e2c]";
export const dashPendingTitle = "text-[12.5px] leading-[1.3] font-bold text-[#172632]";
export const dashPendingSub = "mt-0.5 text-[11px] text-[#7a8e9b]";
export const dashLink = "cursor-pointer text-[12.5px] font-semibold text-[#2563eb] hover:underline";
export const clientStatsGrid = "grid grid-cols-4 gap-4";
export const clientStatCard = "flex items-start gap-3 rounded-[10px] border border-[#dbe3de] bg-white px-4.5 py-4";
export const clientStatIcon = "flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-lg text-[16px]";

// ── Form fields ──────────────────────────────────────────────────────────────
export const fieldLabel = "mb-1.25 block text-[11.5px] font-bold text-[#384b59]";
// `inputBase` leaves out horizontal padding so a field with an icon can set its own.
export const inputBase =
  "w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] py-2.25 text-[12.5px] text-[#17242f] outline-none focus:border-[#2563eb] focus:bg-white";
export const inputText = `${inputBase} px-3`;
// `textareaBase` leaves out the height so each textarea can size itself.
export const textareaBase =
  "w-full resize-y rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2.25 font-[inherit] text-[12px] text-[#1a252c] outline-none focus:border-[#2563eb] focus:bg-white";
export const textareaCaption = `${textareaBase} h-27.5`;
export const fieldHintPlain = "mt-1 text-[10.5px] text-[#7a8e9b]";
export const fieldHint = `${fieldHintPlain} italic`;
export const fieldError = "mt-1 text-[11.5px] font-semibold text-[#b42318]";
export const requiredStar = "text-[#dc2626]";
export const formGrid2 = "grid grid-cols-2 gap-4";
// `formErrorBannerBase` has no top margin, for banners placed above a form.
export const formErrorBannerBase =
  "rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#b42318] [&_ul]:mt-1.5 [&_ul]:pl-4.5 [&_ul]:font-medium";
export const formErrorBanner = `${formErrorBannerBase} mt-4`;

// ── Search ───────────────────────────────────────────────────────────────────
export const dashSearch =
  "flex flex-1 items-center gap-2 rounded-3xl border border-[#dbe3de] bg-white px-4.5 py-2.5 [&_input]:w-full [&_input]:border-none [&_input]:bg-transparent [&_input]:text-[13px] [&_input]:text-[#17242f] [&_input]:outline-none";
export const dashSearchIcon = "text-[14px] text-[#8496a3]";
export const searchClear =
  "inline-flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded-full text-[#7a8e9b] hover:bg-[#eef3ef] hover:text-[#17242f]";

// ── Filter bar (lists) ───────────────────────────────────────────────────────
export const filtersCard =
  "flex items-center justify-between gap-3 rounded-lg border border-[#dbe3de] bg-white px-4 py-3";
export const filterLeftGroup = "flex gap-2.5";
export const filterSelect =
  "cursor-pointer rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-3 py-2 text-[12.5px] text-[#1e293b] outline-none";
export const filterSearchBox = "relative w-65";
export const filterSearchIcon = "absolute top-1/2 left-2.5 inline-flex -translate-y-1/2 text-[12px] text-[#7a8e9b]";
export const filterSearchInput =
  "w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] py-2 pr-3 pl-7.5 text-[12px] text-[#1e293b] outline-none [&::-webkit-search-cancel-button]:hidden";
export const filterSearchClear = `${searchClear} absolute top-1/2 right-1.5 -translate-y-1/2`;

// ── Tables (lists) ───────────────────────────────────────────────────────────
export const tableCard = "overflow-hidden rounded-lg border border-[#dbe3de] bg-white";
export const reportsTable = "w-full border-collapse text-[12.5px]";
export const reportsTh =
  "border-b border-[#eef3ef] bg-[#fafcfb] px-4 py-3 text-left text-[11px] font-bold tracking-[0.6px] text-[#7a8d9b] uppercase";
export const reportsTd = "border-b border-[#f2f5f3] px-4 py-3 align-middle";
// On each <tr>: hover tint, and no divider under the last row.
export const reportsTr = "hover:bg-[#fbfdfc] [&:last-child>td]:border-b-0";
export const tableFooter =
  "flex items-center justify-between border-t border-[#eef3ef] bg-[#fafcfb] px-4.5 py-3 text-[12px] text-[#64748b]";
export const clientFlex = "flex items-center gap-3";
export const clientAvatarBadge =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white";
export const clientNameText = "text-[13px] font-bold text-[#0d1e2c]";
export const actionWrap = "flex items-center gap-2";

// ── Pagination ───────────────────────────────────────────────────────────────
export const paginationGroup = "flex items-center gap-1";
const pageBtnBase =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border text-[12px] font-semibold no-underline disabled:cursor-default disabled:opacity-40 aria-disabled:cursor-default aria-disabled:opacity-40";
// One page button. The current page is filled; page *links* (not buttons) also
// highlight their border on hover.
export const pageBtn = ({ active = false, link = false }: { active?: boolean; link?: boolean } = {}) =>
  [
    pageBtnBase,
    active ? "border-[#d99136] bg-[#d99136] text-white" : "border-[#dce4e0] bg-white text-[#334155]",
    link ? (active ? "hover:border-[#2563eb]" : "hover:border-[#2563eb] hover:text-[#2563eb]") : "",
  ].join(" ");
export const pageGap = "inline-flex min-w-5 items-center justify-center text-[12px] text-[#7a8e9b]";

// ── Empty states ─────────────────────────────────────────────────────────────
// `emptyStateBare` is for inside a card that already has its own border.
export const emptyStateBare = "flex flex-col items-center rounded-[10px] bg-white px-6 py-14 text-center";
export const emptyState = `${emptyStateBare} mb-4.5 border border-dashed border-[#cbd6d0]`;
export const emptyIcon = "mb-4 flex h-15 w-15 items-center justify-center rounded-full bg-[#e8f0fe] text-[#2563eb]";
export const emptyTitle = "font-[Georgia,serif] text-[18px] font-bold text-[#0d1e2c]";
export const emptyDesc = "mt-2 mb-5 max-w-95 text-[12.5px] leading-normal text-[#7a8e9b]";
export const emptyAction = "inline-flex items-center gap-1.5 no-underline";

// ── Chips, avatars & status ──────────────────────────────────────────────────
export const tagRow = "mt-3 flex flex-wrap gap-2";
export const tagChip = "rounded-xl bg-[#eef1ef] px-2.5 py-1 text-[11px] font-semibold text-[#4a5c68]";
// Compact dashboard tables.
export const miniTh =
  "border-b border-[#eef3ef] pt-0 pr-2 pb-2 pl-0 text-left text-[10px] font-bold tracking-[0.4px] text-[#8496a3]";
export const miniTd = "whitespace-nowrap border-b border-[#f4f7f5] py-2.5 pr-2 pl-0 text-[12px] text-[#17242f]";
export const reportRowIcon = "mr-1.5 inline-flex h-5.5 w-5.5 items-center justify-center rounded-[5px] text-[10px]";
export const sourceDot = "mr-1.5 inline-block h-1.75 w-1.75 rounded-full";
export const miniStatus = "rounded-[10px] px-2.25 py-0.75 text-[10.5px] font-bold";
export const MINI_STATUS: Record<"sent" | "pending" | "published" | "draft", string> = {
  sent: "bg-[#dcf3e2] text-[#15803d]",
  pending: "bg-[#fdf1de] text-[#a35a12]",
  published: "bg-[#dbeafe] text-[#1d4ed8]",
  draft: "bg-[#f1f5f3] text-[#64748b]",
};
// Rounded status badge with a leading dot.
export const badge = "inline-flex items-center gap-1.25 rounded-xl px-2.25 py-0.75 text-[11px] font-bold";
export const BADGE_COLORS = {
  draft: "bg-[#f1f5f9] text-[#64748b]",
  review: "bg-[#fef3c7] text-[#92400e]",
  approved: "bg-[#dbeafe] text-[#1d4ed8]",
  completed: "bg-[#dcfce7] text-[#15803d]",
};
export const DOTS = {
  gray: "h-1.25 w-1.25 rounded-full bg-[#94a3b8]",
  amber: "h-1.25 w-1.25 rounded-full bg-[#d97706]",
  blue: "h-1.25 w-1.25 rounded-full bg-[#2563eb]",
  red: "h-1.5 w-1.5 rounded-full bg-[#dc2626]",
  green: "h-1.5 w-1.5 rounded-full bg-[#16a34a]",
};
export const roleAlertBanner =
  "flex items-center justify-between gap-2 rounded-lg border border-[#dce5e0] bg-[#eef3f0] px-4 py-2.5 text-[13px] text-[#384955]";
