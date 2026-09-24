"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Camera, Smartphone, Mail, Plus, Check, ChevronDown, Loader2, X } from "lucide-react";
import {
  changeReportStatusAction,
  createReportAction,
  updateReportAction,
  type Report,
  type ReportContentInput,
  type ReportPeriodType,
  type ReportStatus,
} from "@/app/actions/reports";
import { STATUS_BADGES, canReviewReports, canWriteReports, clientIdOf, clientNameOf, formatDate, formatDateTime, periodLabel } from "./reportUi";
import {
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDraft,
  contentStack,
  fieldHintPlain,
  formErrorBannerBase,
  headlineRow,
  inputText,
  layoutGrid,
  moreBtn,
  pageTitle,
  roleAlertBanner,
  sectionSub,
  sectionTitle,
  sideCard,
  sideTitle,
  textareaBase,
} from "@/component/shared/ui";

const dataTable = "w-full border-collapse text-[12.5px]";
const dataTh = "px-2 py-1.5 text-left text-[10.5px] font-semibold tracking-[0.6px] text-[#7a8d9b] uppercase";
const dataTd = "border-b border-[#f2f5f3] px-2 py-1.5";
const dataTr = "[&:last-child>td]:border-b-0";
const tableSubtitle = "mb-2 text-[10.5px] font-bold tracking-[0.8px] text-[#7a8d9b] uppercase";
const inputPill = "w-full rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-2.5 py-1.5 text-[12px] text-[#1a252c]";
const metaCol = "border-r border-[#edf2ee] px-4.5 py-3 last:border-r-0";
const metaLbl = "mb-1 text-[10px] font-bold tracking-[0.8px] text-[#7b8e9d] uppercase";
const metaVal = "text-[13px] font-bold text-[#10212e]";
const sideNote = "mt-2 text-[11.5px] leading-normal text-[#64748b]";

// ── Form model ──────────────────────────────────────────────────────────────

type SectionKey = "social" | "blogs" | "website" | "gmb";

const SOCIAL_FIELDS = [
  ["Facebook", "facebookReach", "e.g. 128,400"],
  ["Instagram", "instagramReach", "e.g. 61,200"],
  ["Twitter / X", "twitterReach", "e.g. 9,850"],
  ["LinkedIn", "linkedinReach", "e.g. 3,120"],
] as const;

const WEBSITE_FIELDS = [
  ["Impressions", "impressions", "e.g. 71,240"],
  ["Clicks", "clicks", "e.g. 612"],
  ["Backlinks", "backlinks", "e.g. 214"],
  ["Referring Domains", "referringDomains", "e.g. 152"],
  ["Leads Forwarded", "leadsForwarded", "e.g. 22"],
] as const;

const GMB_FIELDS = [
  ["Impressions", "impressions", "e.g. 3,412"],
  ["Calls", "calls", "e.g. 47"],
  ["Direction Requests", "directionRequests", "e.g. 203"],
  ["Website Clicks", "websiteClicks", "e.g. 112"],
] as const;

type SocialKey = (typeof SOCIAL_FIELDS)[number][1];
type WebsiteKey = (typeof WEBSITE_FIELDS)[number][1];
type GmbKey = (typeof GMB_FIELDS)[number][1];

type BlogRow = { title: string; url: string; publishedAt: string; graphicsCount: string };
type LocationRow = { name: string; impressions: string; calls: string; directions: string };

interface Values {
  clientId: string;
  periodType: ReportPeriodType;
  // "2026-09" for a month, "2026-09-07" (the first day) for a week.
  periodValue: string;
  summary: string;
  social: Record<SocialKey, string> & { reelTitle: string; reelViews: string };
  blogs: BlogRow[];
  website: Record<WebsiteKey, string>;
  gmb: Record<GmbKey, string>;
  locations: LocationRow[];
}

const SUMMARY_LIMIT = 5000;
const MAX_ROWS = 100;

const blank = <K extends string>(keys: readonly (readonly [string, K, string])[]) =>
  Object.fromEntries(keys.map(([, key]) => [key, ""])) as Record<K, string>;

const emptyBlog = (): BlogRow => ({ title: "", url: "", publishedAt: "", graphicsCount: "" });
const emptyLocation = (): LocationRow => ({ name: "", impressions: "", calls: "", directions: "" });

const text = (value?: number | string) => (value === undefined || value === null ? "" : String(value));

const valuesFrom = (report?: Report): Values => ({
  clientId: report ? clientIdOf(report.client) : "",
  periodType: report?.periodType ?? "monthly",
  periodValue: report ? (report.periodType === "monthly" ? report.periodStart.slice(0, 7) : report.periodStart.slice(0, 10)) : "",
  summary: report?.summary ?? "",
  social: {
    ...blank(SOCIAL_FIELDS),
    ...Object.fromEntries(SOCIAL_FIELDS.map(([, key]) => [key, text(report?.social?.[key])])),
    reelTitle: report?.social?.reel?.title ?? "",
    reelViews: text(report?.social?.reel?.views),
  } as Values["social"],
  blogs: (report?.blogs.length ? report.blogs : [undefined]).map((blog) =>
    blog
      ? { title: blog.title, url: blog.url ?? "", publishedAt: blog.publishedAt?.slice(0, 10) ?? "", graphicsCount: text(blog.graphicsCount) }
      : emptyBlog()
  ),
  website: {
    ...blank(WEBSITE_FIELDS),
    ...Object.fromEntries(WEBSITE_FIELDS.map(([, key]) => [key, text(report?.website?.[key])])),
  } as Values["website"],
  gmb: {
    ...blank(GMB_FIELDS),
    ...Object.fromEntries(GMB_FIELDS.map(([, key]) => [key, text(report?.gmb?.[key])])),
  } as Values["gmb"],
  locations: (report?.gmb?.locations ?? []).map((location) => ({
    name: location.name,
    impressions: text(location.impressions),
    calls: text(location.calls),
    directions: text(location.directions),
  })),
});

// A section is "included" when it holds something. New reports start with none.
const includedFrom = (report?: Report): Record<SectionKey, boolean> => {
  const anyNumber = (section?: object) =>
    Boolean(section) && Object.values(section as Record<string, unknown>).some((value) => typeof value === "number");
  return {
    social: anyNumber(report?.social) || Boolean(report?.social?.reel?.title) || anyNumber(report?.social?.reel),
    blogs: (report?.blogs.length ?? 0) > 0,
    website: anyNumber(report?.website),
    gmb: anyNumber(report?.gmb) || (report?.gmb?.locations.length ?? 0) > 0,
  };
};

// ── Turning what was typed into what the API takes ──────────────────────────

// "128,400" → 128400, "" → null, "12.5" → "invalid".
const parseFigure = (raw: string): number | null | "invalid" => {
  const cleaned = raw.replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  return /^\d+$/.test(cleaned) ? Number(cleaned) : "invalid";
};

const pad = (value: number) => String(value).padStart(2, "0");

const periodDates = (type: ReportPeriodType, value: string) => {
  if (!value) return null;
  if (type === "monthly") {
    const [year, month] = value.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { periodStart: `${value}-01`, periodEnd: `${value}-${pad(lastDay)}` };
  }
  const end = new Date(new Date(`${value}T00:00:00Z`).getTime() + 6 * 24 * 60 * 60 * 1000);
  return { periodStart: value, periodEnd: end.toISOString().slice(0, 10) };
};

const buildContent = (values: Values, included: Record<SectionKey, boolean>, isEdit: boolean) => {
  const problems: string[] = [];

  // Editing sends `null` to clear a figure; creating simply leaves it out.
  const figures = <K extends string>(
    source: Record<K, string>,
    fields: readonly (readonly [string, K, string])[],
    on: boolean
  ) => {
    const out: Record<string, number | null> = {};
    for (const [label, key] of fields) {
      const parsed = on ? parseFigure(source[key]) : null;
      if (parsed === "invalid") problems.push(`${label}: use whole numbers only`);
      else if (parsed !== null) out[key] = parsed;
      else if (isEdit) out[key] = null;
    }
    return out;
  };

  const content: ReportContentInput = { summary: values.summary.trim() };
  if (!isEdit && !content.summary) delete content.summary;

  const socialOn = included.social;
  const socialFigures = figures(values.social, SOCIAL_FIELDS, socialOn);
  const reelViews = socialOn ? parseFigure(values.social.reelViews) : null;
  if (reelViews === "invalid") problems.push("Reel views: use whole numbers only");
  const reel = {
    ...(socialOn && values.social.reelTitle.trim() ? { title: values.social.reelTitle.trim() } : isEdit ? { title: "" } : {}),
    ...(typeof reelViews === "number" ? { views: reelViews } : isEdit ? { views: null } : {}),
  };
  if (isEdit || Object.keys(socialFigures).length || Object.keys(reel).length) {
    content.social = { ...socialFigures, ...(Object.keys(reel).length ? { reel } : {}) };
  }

  const blogs = included.blogs
    ? values.blogs.flatMap((row) => {
        const title = row.title.trim();
        const graphics = parseFigure(row.graphicsCount);
        if (!title && !row.url.trim() && !row.publishedAt && graphics === null) return [];
        if (!title) problems.push("Every blog needs a title");
        if (graphics === "invalid") problems.push(`Graphics for "${title || "a blog"}": use whole numbers only`);
        return [
          {
            title,
            ...(row.url.trim() ? { url: row.url.trim() } : {}),
            ...(row.publishedAt ? { publishedAt: row.publishedAt } : {}),
            ...(typeof graphics === "number" ? { graphicsCount: graphics } : {}),
          },
        ];
      })
    : [];
  if (isEdit || blogs.length) content.blogs = blogs;

  const websiteFigures = figures(values.website, WEBSITE_FIELDS, included.website);
  if (isEdit || Object.keys(websiteFigures).length) content.website = websiteFigures;

  const gmbFigures = figures(values.gmb, GMB_FIELDS, included.gmb);
  const locations = included.gmb
    ? values.locations.flatMap((row) => {
        const name = row.name.trim();
        const parsed = [row.impressions, row.calls, row.directions].map(parseFigure);
        if (!name && parsed.every((value) => value === null)) return [];
        if (!name) problems.push("Every location needs a name");
        if (parsed.includes("invalid")) problems.push(`Figures for "${name || "a location"}": use whole numbers only`);
        const [impressions, calls, directions] = parsed;
        return [
          {
            name,
            ...(typeof impressions === "number" ? { impressions } : {}),
            ...(typeof calls === "number" ? { calls } : {}),
            ...(typeof directions === "number" ? { directions } : {}),
          },
        ];
      })
    : [];
  if (isEdit || Object.keys(gmbFigures).length || locations.length) content.gmb = { ...gmbFigures, locations };

  return { content, problems: Array.from(new Set(problems)) };
};

const STATUS_TOAST: Record<ReportStatus, string> = {
  draft: "Report sent back to draft",
  submitted: "Report submitted for review",
  approved: "Report approved",
  published: "Report published to the client",
};

// ── Small pieces ────────────────────────────────────────────────────────────

const SectionCard = ({
  index,
  title,
  sub,
  icons,
  included,
  disabled,
  onToggle,
  children,
}: {
  index: number;
  title: string;
  sub: string;
  icons?: (typeof Camera)[];
  included: boolean;
  disabled: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => (
  <div
    className={`overflow-hidden rounded-lg border bg-white ${
      included ? "border-[#93c5fd] shadow-[0_0_0_1px_#93c5fd]" : "border-[#dbe3de]"
    }`}
  >
    <div
      className={`flex items-center justify-start gap-2.5 border-b border-[#eef3ef] p-4.5 ${
        disabled ? "cursor-default" : "cursor-pointer"
      } ${included ? "bg-[#f5f9ff]" : "bg-white"}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={included}
      aria-disabled={disabled}
      onClick={() => !disabled && onToggle()}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <div
        className={`flex h-5 w-5 cursor-pointer select-none items-center justify-center rounded font-bold ${
          included ? "bg-[#16a34a] text-[12px] text-white" : "border-[1.5px] border-[#cbd6d0] bg-white text-[11px] text-[#8496a3]"
        }`}
      >
        {included ? <Check size={12} strokeWidth={2.5} /> : index}
      </div>
      <div className="flex-1">
        <div className={sectionTitle}>{title}</div>
        <div className={sectionSub}>{sub}</div>
      </div>
      {icons ? (
        <div className="ml-auto flex gap-1.5 text-[13px] text-[#8496a3]">
          {icons.map((Icon, iconIndex) => (
            <Icon key={iconIndex} size={14} strokeWidth={2} />
          ))}
        </div>
      ) : null}
      <ChevronDown
        size={16}
        strokeWidth={2}
        color="#8496a3"
        className={`shrink-0 transition-transform duration-150 ease-[ease] ${included ? "" : "-rotate-90"}`}
      />
    </div>
    {included ? <div className="px-5 pb-5">{children}</div> : null}
  </div>
);

const FigureInput = ({
  value,
  placeholder,
  disabled,
  label,
  onChange,
  center,
}: {
  value: string;
  placeholder?: string;
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  center?: boolean;
}) => (
  <input
    type="text"
    inputMode="numeric"
    className={`${inputPill}${center ? " text-center" : ""}`}
    placeholder={placeholder}
    aria-label={label}
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
  />
);

const AddRowButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) =>
  disabled ? null : (
    <button
      className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-[20px] bg-[#2563eb] px-3.5 py-1.75 text-[11.5px] font-semibold text-white"
      type="button"
      onClick={onClick}
    >
      <Plus size={12} strokeWidth={2.5} /> Add Another
    </button>
  );

const RemoveRowButton = ({ label, onClick, disabled, reason }: { label: string; onClick: () => void; disabled?: boolean; reason?: string }) => (
  <button
    type="button"
    className={`${moreBtn} disabled:cursor-not-allowed disabled:opacity-30`}
    aria-label={label}
    title={disabled ? reason : "Remove"}
    disabled={disabled}
    onClick={onClick}
  >
    <X size={14} strokeWidth={2} />
  </button>
);

// ── The editor ──────────────────────────────────────────────────────────────

// Pass `report` to edit an existing one; leave it out to write a new one.
// `initialClientId` picks the client for a new report (from a client's page).
const ReportEditor = ({
  clients,
  report,
  role,
  userName,
  readOnly,
  initialClientId = "",
}: {
  clients: { _id: string; companyName: string }[];
  report?: Report;
  role: string;
  userName: string;
  readOnly: boolean;
  initialClientId?: string;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(report);
  const status: ReportStatus = report?.status ?? "draft";
  const canReview = canReviewReports(role);

  const [values, setValues] = useState<Values>(() => {
    const initial = valuesFrom(report);
    if (!report && clients.some((option) => option._id === initialClientId)) initial.clientId = initialClientId;
    return initial;
  });
  const [included, setIncluded] = useState<Record<SectionKey, boolean>>(() => includedFrom(report));
  const [error, setError] = useState<string | null>(null);
  // Which button was pressed, so that one shows the spinner.
  const [pressed, setPressed] = useState<ReportStatus | "save">("save");
  const [problems, setProblems] = useState<string[]>([]);

  const disabled = readOnly || isPending;
  const includedCount = Object.values(included).filter(Boolean).length;
  const progressPct = Math.round((includedCount / 4) * 100);

  const patch = (changes: Partial<Values>) => setValues((current) => ({ ...current, ...changes }));
  const toggle = (key: SectionKey) => setIncluded((current) => ({ ...current, [key]: !current[key] }));
  const setBlog = (index: number, changes: Partial<BlogRow>) =>
    patch({ blogs: values.blogs.map((row, i) => (i === index ? { ...row, ...changes } : row)) });
  const setLocation = (index: number, changes: Partial<LocationRow>) =>
    patch({ locations: values.locations.map((row, i) => (i === index ? { ...row, ...changes } : row)) });

  const dates = periodDates(values.periodType, values.periodValue);
  const clientName = report ? clientNameOf(report.client) : clients.find((option) => option._id === values.clientId)?.companyName;
  const preparedBy = report && typeof report.createdBy === "object" ? report.createdBy.fullName : userName;

  // Save the form, then optionally move the report to another status.
  const save = (target?: ReportStatus) => {
    setPressed(target ?? "save");
    setError(null);
    setProblems([]);

    const { content, problems: found } = buildContent(values, included, isEdit);
    if (!isEdit && !values.clientId) found.unshift("Select a client");
    if (!dates) found.unshift(values.periodType === "monthly" ? "Choose the report month" : "Choose the week's start date");
    if (found.length) {
      setError("Please fix the following before saving:");
      setProblems(found);
      toast.error(found[0]);
      return;
    }

    startTransition(async () => {
      const period = { periodType: values.periodType, ...dates! };
      const saved = report
        ? await updateReportAction(report._id, { ...period, ...content })
        : await createReportAction({ client: values.clientId, ...period, ...content });

      if (!saved.ok || !saved.data) {
        setError(saved.error ?? "Something went wrong.");
        setProblems(saved.fieldErrors ?? []);
        toast.error(saved.error ?? "Something went wrong.");
        return;
      }

      const id = saved.data._id;

      if (target) {
        const moved = await changeReportStatusAction(id, target);
        if (!moved.ok) {
          // The content is saved; only the move was refused.
          toast.error(`${moved.error} Your changes were saved.`);
          if (isEdit) router.refresh();
          else router.push(`/monthly-reports/${id}/edit`);
          return;
        }
        toast.success(STATUS_TOAST[target]);
        router.push("/monthly-reports");
        return;
      }

      toast.success(isEdit ? "Report saved" : "Draft saved");
      if (isEdit) router.refresh();
      else router.push(`/monthly-reports/${id}/edit`);
    });
  };

  const primary = readOnly
    ? null
    : canReview
      ? status === "published"
        ? null
        : ({ label: "Publish to Client", target: "published" } as const)
      : status === "draft"
        ? ({ label: "Submit for Review", target: "submitted" } as const)
        : null;
  const saveLabel = isEdit ? "Save Changes" : "Save Draft";
  const badge = STATUS_BADGES[status];

  const actionButtons = (
    <>
      {!readOnly ? (
        <button
          className={`${btnDraft} inline-flex items-center gap-1.5 disabled:cursor-wait`}
          type="button"
          disabled={isPending}
          aria-busy={isPending && pressed === "save"}
          onClick={() => save()}
        >
          {isPending && pressed === "save" ? (
            <>
              <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> Saving…
            </>
          ) : (
            saveLabel
          )}
        </button>
      ) : null}
      {primary ? (
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#0b1522] px-4.5 py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(11,21,34,0.2)] hover:bg-[#17263a] disabled:cursor-wait"
          type="button"
          disabled={isPending}
          aria-busy={isPending && pressed === primary.target}
          onClick={() => save(primary.target)}
        >
          {isPending && pressed === primary.target ? (
            <>
              <Loader2 size={14} strokeWidth={2.25} className="animate-spin" /> {primary.target === "published" ? "Publishing…" : "Submitting…"}
            </>
          ) : (
            primary.label
          )}
        </button>
      ) : null}
    </>
  );

  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <Link href="/monthly-reports" className={breadcrumbLink}>
            Monthly Reports
          </Link>{" "}
          / {report ? <>{clientName} / <b>{periodLabel(report)}</b></> : <b>New Report</b>}
        </div>
      </div>

      <div className={headlineRow}>
        <div>
          <div className={pageTitle}>{report ? report.title : "New Report"}</div>
          <div className="mt-1 flex items-center gap-3 text-[12px] text-[#657787]">
            {isEdit ? (
              <span className={badge.badge}>
                <span className={badge.dot} /> {badge.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.25 rounded-xl bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#92400e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b45309]" /> Draft • In Progress
              </span>
            )}
            <span>{report ? `Last saved ${formatDateTime(report.updatedAt)}` : "Not yet saved"}</span>
          </div>
        </div>
      </div>

      {readOnly ? (
        <div className={roleAlertBanner} role="status">
          {canWriteReports(role)
            ? "This report has been handed in for review, so it can't be edited. A manager can edit it or send it back to draft."
            : "You can view this report but not change it."}
        </div>
      ) : null}

      {error ? (
        <div className={`${formErrorBannerBase} mb-3.5`} role="alert">
          {error}
          {problems.length ? (
            <ul>
              {problems.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-4 rounded-lg border border-[#dbe3de] bg-white">
        <div className={metaCol}>
          <div className={metaLbl}>Client</div>
          {isEdit ? (
            <div className={metaVal}>{clientName}</div>
          ) : (
            <select className={inputText} value={values.clientId} disabled={disabled} onChange={(event) => patch({ clientId: event.target.value })}>
              <option value="" disabled>
                — Select Client —
              </option>
              {clients.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.companyName}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className={metaCol}>
          <div className={metaLbl}>Report Period</div>
          <div className="flex flex-col gap-1.5">
            <select
              className={inputText}
              aria-label="Period type"
              value={values.periodType}
              disabled={disabled}
              onChange={(event) => patch({ periodType: event.target.value as ReportPeriodType, periodValue: "" })}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            {values.periodType === "monthly" ? (
              <input type="month" className={inputText} aria-label="Report month" value={values.periodValue} disabled={disabled} onChange={(event) => patch({ periodValue: event.target.value })} />
            ) : (
              <input type="date" className={inputText} aria-label="Week starting" value={values.periodValue} disabled={disabled} onChange={(event) => patch({ periodValue: event.target.value })} />
            )}
            {values.periodType === "weekly" && dates ? (
              <div className="text-[11px] text-[#7a8e9b]">Ends {formatDate(dates.periodEnd)}</div>
            ) : null}
          </div>
        </div>
        <div className={metaCol}>
          <div className={metaLbl}>Prepared By</div>
          <div className={metaVal}>{preparedBy}</div>
        </div>
        <div className={metaCol}>
          <div className={metaLbl}>Sections Included</div>
          <div className={metaVal}>{includedCount} of 4</div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-xs bg-[#eef3ef]">
            <div
              className="h-full rounded-xs bg-[#16a34a] transition-[width] duration-200 ease-[ease]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className={layoutGrid}>
        <div className={contentStack}>
          <div className="rounded-lg border border-[#dbe3de] bg-white p-5">
            <div className={sectionTitle}>Executive Summary</div>
            <div className={sectionSub}>The written overview the client reads first. Separate paragraphs with a blank line.</div>
            <textarea
              className={`${textareaBase} mt-2.5 h-30`}
              placeholder="Write a short summary of the period..."
              maxLength={SUMMARY_LIMIT}
              value={values.summary}
              disabled={disabled}
              onChange={(event) => patch({ summary: event.target.value })}
            />
            <div className={`${fieldHintPlain} text-right`}>
              {values.summary.length}/{SUMMARY_LIMIT}
            </div>
          </div>

          <SectionCard index={1} title="Social Media Content Performance" sub="Reach per platform and the best-performing video" icons={[Camera, Smartphone, Mail]} included={included.social} disabled={readOnly} onToggle={() => toggle("social")}>
            <div className={tableSubtitle}>Platform Reach</div>
            <table className={dataTable}>
              <thead>
                <tr className={dataTr}>
                  <th className={`${dataTh} w-[50%]`}>Platform</th>
                  <th className={dataTh}>Reach this period</th>
                </tr>
              </thead>
              <tbody>
                {SOCIAL_FIELDS.map(([label, key, placeholder]) => (
                  <tr key={key} className={dataTr}>
                    <td className={dataTd}>{label}</td>
                    <td className={dataTd}>
                      <FigureInput label={`${label} reach`} value={values.social[key]} placeholder={placeholder} disabled={disabled} onChange={(value) => patch({ social: { ...values.social, [key]: value } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={`${tableSubtitle} mt-4`}>
              Best-performing Video
            </div>
            <table className={dataTable}>
              <thead>
                <tr className={dataTr}>
                  <th className={`${dataTh} w-[72%]`}>Video Title</th>
                  <th className={dataTh}>Views</th>
                </tr>
              </thead>
              <tbody>
                <tr className={dataTr}>
                  <td className={dataTd}>
                    <input type="text" className={inputPill} aria-label="Video title" placeholder="e.g. Know Your Rights — Reel" value={values.social.reelTitle} disabled={disabled} onChange={(event) => patch({ social: { ...values.social, reelTitle: event.target.value } })} />
                  </td>
                  <td className={dataTd}>
                    <FigureInput label="Video views" value={values.social.reelViews} placeholder="e.g. 14,300" disabled={disabled} onChange={(value) => patch({ social: { ...values.social, reelViews: value } })} />
                  </td>
                </tr>
              </tbody>
            </table>
          </SectionCard>

          <SectionCard index={2} title="Blogs" sub="Published blogs for this period" included={included.blogs} disabled={readOnly} onToggle={() => toggle("blogs")}>
            <table className={dataTable}>
              <thead>
                <tr className={dataTr}>
                  <th className={`${dataTh} w-[32%]`}>Title</th>
                  <th className={`${dataTh} w-[32%]`}>Link</th>
                  <th className={`${dataTh} w-[18%]`}>Published</th>
                  <th className={`${dataTh} w-[12%]`}>Graphics</th>
                  <th className={`${dataTh} w-[6%]`} />
                </tr>
              </thead>
              <tbody>
                {values.blogs.map((row, index) => (
                  <tr key={index} className={dataTr}>
                    <td className={dataTd}>
                      <input type="text" className={inputPill} aria-label="Blog title" placeholder="e.g. Vehicle Black Box Data and Your Case" value={row.title} disabled={disabled} onChange={(event) => setBlog(index, { title: event.target.value })} />
                    </td>
                    <td className={dataTd}>
                      <input type="text" className={inputPill} aria-label="Blog link" placeholder="e.g. carterinjurylaw.com/blog/black-box" value={row.url} disabled={disabled} onChange={(event) => setBlog(index, { url: event.target.value })} />
                    </td>
                    <td className={dataTd}>
                      <input type="date" className={inputPill} aria-label="Published date" value={row.publishedAt} disabled={disabled} onChange={(event) => setBlog(index, { publishedAt: event.target.value })} />
                    </td>
                    <td className={dataTd}>
                      <FigureInput center label="Graphics" value={row.graphicsCount} placeholder="e.g. 2" disabled={disabled} onChange={(value) => setBlog(index, { graphicsCount: value })} />
                    </td>
                    <td className={dataTd}>
                      {!readOnly ? (
                        <RemoveRowButton
                          label="Remove blog"
                          // There is always at least one blog row to fill in.
                          disabled={values.blogs.length <= 1}
                          reason="At least one blog row is needed"
                          onClick={() => patch({ blogs: values.blogs.filter((_, i) => i !== index) })}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {values.blogs.length < MAX_ROWS ? <AddRowButton disabled={readOnly} onClick={() => patch({ blogs: [...values.blogs, emptyBlog()] })} /> : null}
          </SectionCard>

          <SectionCard index={3} title="Website Performance Report" sub="Traffic, user behavior & key metrics" included={included.website} disabled={readOnly} onToggle={() => toggle("website")}>
            <table className={dataTable}>
              <thead>
                <tr className={dataTr}>
                  <th className={`${dataTh} w-[50%]`}>Metric</th>
                  <th className={dataTh}>This period</th>
                </tr>
              </thead>
              <tbody>
                {WEBSITE_FIELDS.map(([label, key, placeholder]) => (
                  <tr key={key} className={dataTr}>
                    <td className={dataTd}>{label}</td>
                    <td className={dataTd}>
                      <FigureInput label={label} value={values.website[key]} placeholder={placeholder} disabled={disabled} onChange={(value) => patch({ website: { ...values.website, [key]: value } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard index={4} title="GMB Performance Report" sub="Google Business Profile & local visibility" included={included.gmb} disabled={readOnly} onToggle={() => toggle("gmb")}>
            <table className={dataTable}>
              <thead>
                <tr className={dataTr}>
                  <th className={`${dataTh} w-[50%]`}>Metric</th>
                  <th className={dataTh}>This period</th>
                </tr>
              </thead>
              <tbody>
                {GMB_FIELDS.map(([label, key, placeholder]) => (
                  <tr key={key} className={dataTr}>
                    <td className={dataTd}>{label}</td>
                    <td className={dataTd}>
                      <FigureInput label={label} value={values.gmb[key]} placeholder={placeholder} disabled={disabled} onChange={(value) => patch({ gmb: { ...values.gmb, [key]: value } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={`${tableSubtitle} mt-4`}>
              By Location
            </div>
            <table className={dataTable}>
              <thead>
                <tr className={dataTr}>
                  <th className={`${dataTh} w-[34%]`}>Location</th>
                  <th className={`${dataTh} w-[20%]`}>Impressions</th>
                  <th className={`${dataTh} w-[20%]`}>Calls</th>
                  <th className={`${dataTh} w-[20%]`}>Directions</th>
                  <th className={`${dataTh} w-[6%]`} />
                </tr>
              </thead>
              <tbody>
                {values.locations.length === 0 ? (
                  <tr className={dataTr}>
                    <td colSpan={5} className={`${dataTd} text-[#7a8e9b]`}>
                      No locations added yet.
                    </td>
                  </tr>
                ) : null}
                {values.locations.map((row, index) => (
                  <tr key={index} className={dataTr}>
                    <td className={dataTd}>
                      <input type="text" className={inputPill} aria-label="Location name" placeholder="e.g. Tampa" value={row.name} disabled={disabled} onChange={(event) => setLocation(index, { name: event.target.value })} />
                    </td>
                    <td className={dataTd}>
                      <FigureInput label="Location impressions" value={row.impressions} placeholder="e.g. 1,486" disabled={disabled} onChange={(value) => setLocation(index, { impressions: value })} />
                    </td>
                    <td className={dataTd}>
                      <FigureInput label="Location calls" value={row.calls} placeholder="e.g. 21" disabled={disabled} onChange={(value) => setLocation(index, { calls: value })} />
                    </td>
                    <td className={dataTd}>
                      <FigureInput label="Location directions" value={row.directions} placeholder="e.g. 88" disabled={disabled} onChange={(value) => setLocation(index, { directions: value })} />
                    </td>
                    <td className={dataTd}>{!readOnly ? <RemoveRowButton label="Remove location" onClick={() => patch({ locations: values.locations.filter((_, i) => i !== index) })} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {values.locations.length < MAX_ROWS ? <AddRowButton disabled={readOnly} onClick={() => patch({ locations: [...values.locations, emptyLocation()] })} /> : null}
          </SectionCard>
        </div>

        <div>
          <div className={sideCard}>
            <div className={sideTitle}>Report Status</div>
            <div className="mt-2">
              <span className={badge.badge}>
                <span className={badge.dot} /> {isEdit ? badge.label : "Not saved yet"}
              </span>
            </div>

            {report ? (
              <div className="mt-2.5 text-[11.5px] leading-[1.7] text-[#64748b]">
                <div>Created {formatDate(report.createdAt)}</div>
                {report.submittedAt ? <div>Handed in {formatDate(report.submittedAt)}</div> : null}
                {report.approvedAt ? (
                  <div>
                    Approved {formatDate(report.approvedAt)}
                    {typeof report.approvedBy === "object" ? ` by ${report.approvedBy.fullName}` : ""}
                  </div>
                ) : null}
                {report.publishedAt ? (
                  <div>
                    Published {formatDate(report.publishedAt)}
                    {typeof report.publishedBy === "object" ? ` by ${report.publishedBy.fullName}` : ""}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2.5 text-[11.5px] leading-normal text-[#64748b]">
                Save a draft first. You can come back to it any time before handing it in.
              </div>
            )}

            {report && canReview && !readOnly ? (
              <div className="mt-3.5 flex flex-col gap-2">
                {status === "draft" || status === "submitted" ? (
                  <button className={btnDraft} type="button" disabled={isPending} onClick={() => save("approved")}>
                    Approve
                  </button>
                ) : null}
                {status !== "draft" ? (
                  <button className={btnDraft} type="button" disabled={isPending} onClick={() => save("draft")}>
                    Send back to draft
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={sideCard}>
            <div className={sideTitle}>Before You Send</div>
            <div className={sideNote}>
              {canReview ? (
                <>
                  Once published, this report becomes visible on <b>the client&apos;s</b> dashboard immediately. Nothing is
                  visible to the client until you publish it.
                </>
              ) : (
                <>
                  Handing a report in sends it to a manager for review. It is <b>not</b> visible to the client until a
                  manager publishes it, and you can&apos;t edit it once it has been handed in.
                </>
              )}
            </div>
            <div className={sideNote}>
              The percentage changes clients see are worked out from the previous published report, so only enter this
              period&apos;s figures.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 rounded-lg border border-[#dbe3de] bg-white px-5 py-3">
        <div className="flex items-center gap-1.5 text-[12px] text-[#64748b]">
          {report ? `Last saved ${formatDateTime(report.updatedAt)}` : "Not yet saved"}
        </div>
        <div className="flex gap-2.5">
          <Link href="/monthly-reports" className={btnDraft}>
            Back to All Reports
          </Link>
          {actionButtons}
        </div>
      </div>
    </>
  );
};

export default ReportEditor;
