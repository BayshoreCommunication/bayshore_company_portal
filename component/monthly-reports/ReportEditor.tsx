"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Camera, Smartphone, Mail, Plus, Check, ChevronDown, X } from "lucide-react";
import {
  changeReportStatusAction,
  createReportAction,
  updateReportAction,
  type Report,
  type ReportContentInput,
  type ReportPeriodType,
  type ReportStatus,
} from "@/app/actions/reports";
import RoleAlertBanner from "@/component/shared/RoleAlertBanner";
import { roleLabel } from "@/component/shared/roleLabels";
import { STATUS_BADGES, canReviewReports, canWriteReports, clientIdOf, clientNameOf, formatDate, formatDateTime, periodLabel } from "./reportUi";

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
    className="report-section-card"
    style={{
      padding: 0,
      overflow: "hidden",
      borderColor: included ? "#93c5fd" : undefined,
      boxShadow: included ? "0 0 0 1px #93c5fd" : undefined,
    }}
  >
    <div
      className="section-header"
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
      style={{ cursor: disabled ? "default" : "pointer", margin: 0, padding: 18, background: included ? "#f5f9ff" : "#fff" }}
    >
      <div
        className={`check-icon toggleable${included ? "" : " unchecked"}`}
        style={!included ? { color: "#8496a3", fontSize: 11, fontWeight: 700 } : undefined}
      >
        {included ? <Check size={12} strokeWidth={2.5} /> : index}
      </div>
      <div style={{ flex: 1 }}>
        <div className="section-title">{title}</div>
        <div className="section-sub">{sub}</div>
      </div>
      {icons ? (
        <div className="social-icons-group" style={{ display: "flex", gap: 6, color: "#8496a3" }}>
          {icons.map((Icon, iconIndex) => (
            <Icon key={iconIndex} size={14} strokeWidth={2} />
          ))}
        </div>
      ) : null}
      <ChevronDown
        size={16}
        strokeWidth={2}
        color="#8496a3"
        style={{ transform: included ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .15s ease", flexShrink: 0 }}
      />
    </div>
    {included ? <div style={{ padding: "0 20px 20px" }}>{children}</div> : null}
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
    className={`input-pill${center ? " text-center" : ""}`}
    placeholder={placeholder}
    aria-label={label}
    value={value}
    disabled={disabled}
    onChange={(event) => onChange(event.target.value)}
  />
);

const AddRowButton = ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) =>
  disabled ? null : (
    <button className="btn-add-item" type="button" onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12 }}>
      <Plus size={12} strokeWidth={2.5} /> Add Another
    </button>
  );

const RemoveRowButton = ({ label, onClick, disabled, reason }: { label: string; onClick: () => void; disabled?: boolean; reason?: string }) => (
  <button
    type="button"
    className="more-btn"
    aria-label={label}
    title={disabled ? reason : "Remove"}
    disabled={disabled}
    style={disabled ? { opacity: 0.3, cursor: "not-allowed" } : undefined}
    onClick={onClick}
  >
    <X size={14} strokeWidth={2} />
  </button>
);

// ── The editor ──────────────────────────────────────────────────────────────

// Pass `report` to edit an existing one; leave it out to write a new one.
const ReportEditor = ({
  clients,
  report,
  role,
  userName,
  readOnly,
}: {
  clients: { _id: string; companyName: string }[];
  report?: Report;
  role: string;
  userName: string;
  readOnly: boolean;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(report);
  const status: ReportStatus = report?.status ?? "draft";
  const canReview = canReviewReports(role);

  const [values, setValues] = useState<Values>(() => valuesFrom(report));
  const [included, setIncluded] = useState<Record<SectionKey, boolean>>(() => includedFrom(report));
  const [error, setError] = useState<string | null>(null);
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
        <button className="btn-draft" type="button" disabled={isPending} onClick={() => save()}>
          {isPending ? "Saving…" : saveLabel}
        </button>
      ) : null}
      {primary ? (
        <button className="btn-primary-preview" type="button" disabled={isPending} onClick={() => save(primary.target)}>
          {primary.label}
        </button>
      ) : null}
    </>
  );

  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <Link href="/monthly-reports" className="breadcrumb-link">
            Monthly Reports
          </Link>{" "}
          / {report ? <>{clientName} / <b>{periodLabel(report)}</b></> : <b>New Report</b>}
        </div>
      </div>

      <RoleAlertBanner
        message={
          <>
            You&apos;re viewing the <b>{roleLabel(role)}</b> editor for this report.
          </>
        }
      />

      <div className="headline-row">
        <div>
          <div className="page-title">{report ? report.title : "New Report"}</div>
          <div className="status-line">
            {isEdit ? (
              <span className={badge.badge}>
                <span className={badge.dot} /> {badge.label}
              </span>
            ) : (
              <span className="tag-draft">
                <span className="dot-amber" /> Draft • In Progress
              </span>
            )}
            <span>{report ? `Last saved ${formatDateTime(report.updatedAt)}` : "Not yet saved"}</span>
          </div>
        </div>
        <div className="action-buttons">{actionButtons}</div>
      </div>

      {readOnly ? (
        <div className="role-alert-banner" role="status">
          {canWriteReports(role)
            ? "This report has been handed in for review, so it can't be edited. A manager can edit it or send it back to draft."
            : "You can view this report but not change it."}
        </div>
      ) : null}

      {error ? (
        <div className="form-error-banner" role="alert" style={{ marginTop: 0, marginBottom: 14 }}>
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

      <div className="meta-card">
        <div className="meta-col">
          <div className="meta-lbl">Client</div>
          {isEdit ? (
            <div className="meta-val">{clientName}</div>
          ) : (
            <select className="input-text" value={values.clientId} disabled={disabled} onChange={(event) => patch({ clientId: event.target.value })}>
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
        <div className="meta-col">
          <div className="meta-lbl">Report Period</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <select
              className="input-text"
              aria-label="Period type"
              value={values.periodType}
              disabled={disabled}
              onChange={(event) => patch({ periodType: event.target.value as ReportPeriodType, periodValue: "" })}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            {values.periodType === "monthly" ? (
              <input type="month" className="input-text" aria-label="Report month" value={values.periodValue} disabled={disabled} onChange={(event) => patch({ periodValue: event.target.value })} />
            ) : (
              <input type="date" className="input-text" aria-label="Week starting" value={values.periodValue} disabled={disabled} onChange={(event) => patch({ periodValue: event.target.value })} />
            )}
            {values.periodType === "weekly" && dates ? (
              <div style={{ fontSize: 11, color: "#7a8e9b" }}>Ends {formatDate(dates.periodEnd)}</div>
            ) : null}
          </div>
        </div>
        <div className="meta-col">
          <div className="meta-lbl">Prepared By</div>
          <div className="meta-val">{preparedBy}</div>
        </div>
        <div className="meta-col">
          <div className="meta-lbl">Sections Included</div>
          <div className="meta-val">{includedCount} of 4</div>
          <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: "#eef3ef", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: "#16a34a", borderRadius: 2, transition: "width .2s ease" }} />
          </div>
        </div>
      </div>

      <div className="layout-grid">
        <div className="content-stack">
          <div className="report-section-card">
            <div className="section-title">Executive Summary</div>
            <div className="section-sub">The written overview the client reads first. Separate paragraphs with a blank line.</div>
            <textarea
              className="textarea-caption"
              style={{ height: 120, marginTop: 10 }}
              placeholder="Write a short summary of the period..."
              maxLength={SUMMARY_LIMIT}
              value={values.summary}
              disabled={disabled}
              onChange={(event) => patch({ summary: event.target.value })}
            />
            <div className="field-hint" style={{ textAlign: "right", fontStyle: "normal" }}>
              {values.summary.length}/{SUMMARY_LIMIT}
            </div>
          </div>

          <SectionCard index={1} title="Social Media Content Performance" sub="Reach per platform and the best-performing video" icons={[Camera, Smartphone, Mail]} included={included.social} disabled={readOnly} onToggle={() => toggle("social")}>
            <div className="table-subtitle">Platform Reach</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Platform</th>
                  <th>Reach this period</th>
                </tr>
              </thead>
              <tbody>
                {SOCIAL_FIELDS.map(([label, key, placeholder]) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <FigureInput label={`${label} reach`} value={values.social[key]} placeholder={placeholder} disabled={disabled} onChange={(value) => patch({ social: { ...values.social, [key]: value } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-subtitle" style={{ marginTop: 16 }}>
              Best-performing Video
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "72%" }}>Video Title</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input type="text" className="input-pill" aria-label="Video title" placeholder="e.g. Know Your Rights — Reel" value={values.social.reelTitle} disabled={disabled} onChange={(event) => patch({ social: { ...values.social, reelTitle: event.target.value } })} />
                  </td>
                  <td>
                    <FigureInput label="Video views" value={values.social.reelViews} placeholder="e.g. 14,300" disabled={disabled} onChange={(value) => patch({ social: { ...values.social, reelViews: value } })} />
                  </td>
                </tr>
              </tbody>
            </table>
          </SectionCard>

          <SectionCard index={2} title="Blogs" sub="Published blogs for this period" included={included.blogs} disabled={readOnly} onToggle={() => toggle("blogs")}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "32%" }}>Title</th>
                  <th style={{ width: "32%" }}>Link</th>
                  <th style={{ width: "18%" }}>Published</th>
                  <th style={{ width: "12%" }}>Graphics</th>
                  <th style={{ width: "6%" }} />
                </tr>
              </thead>
              <tbody>
                {values.blogs.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input type="text" className="input-pill" aria-label="Blog title" placeholder="e.g. Vehicle Black Box Data and Your Case" value={row.title} disabled={disabled} onChange={(event) => setBlog(index, { title: event.target.value })} />
                    </td>
                    <td>
                      <input type="text" className="input-pill" aria-label="Blog link" placeholder="e.g. carterinjurylaw.com/blog/black-box" value={row.url} disabled={disabled} onChange={(event) => setBlog(index, { url: event.target.value })} />
                    </td>
                    <td>
                      <input type="date" className="input-pill" aria-label="Published date" value={row.publishedAt} disabled={disabled} onChange={(event) => setBlog(index, { publishedAt: event.target.value })} />
                    </td>
                    <td>
                      <FigureInput center label="Graphics" value={row.graphicsCount} placeholder="e.g. 2" disabled={disabled} onChange={(value) => setBlog(index, { graphicsCount: value })} />
                    </td>
                    <td>
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
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Metric</th>
                  <th>This period</th>
                </tr>
              </thead>
              <tbody>
                {WEBSITE_FIELDS.map(([label, key, placeholder]) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <FigureInput label={label} value={values.website[key]} placeholder={placeholder} disabled={disabled} onChange={(value) => patch({ website: { ...values.website, [key]: value } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard index={4} title="GMB Performance Report" sub="Google Business Profile & local visibility" included={included.gmb} disabled={readOnly} onToggle={() => toggle("gmb")}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}>Metric</th>
                  <th>This period</th>
                </tr>
              </thead>
              <tbody>
                {GMB_FIELDS.map(([label, key, placeholder]) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      <FigureInput label={label} value={values.gmb[key]} placeholder={placeholder} disabled={disabled} onChange={(value) => patch({ gmb: { ...values.gmb, [key]: value } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-subtitle" style={{ marginTop: 16 }}>
              By Location
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "34%" }}>Location</th>
                  <th style={{ width: "20%" }}>Impressions</th>
                  <th style={{ width: "20%" }}>Calls</th>
                  <th style={{ width: "20%" }}>Directions</th>
                  <th style={{ width: "6%" }} />
                </tr>
              </thead>
              <tbody>
                {values.locations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ color: "#7a8e9b" }}>
                      No locations added yet.
                    </td>
                  </tr>
                ) : null}
                {values.locations.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input type="text" className="input-pill" aria-label="Location name" placeholder="e.g. Tampa" value={row.name} disabled={disabled} onChange={(event) => setLocation(index, { name: event.target.value })} />
                    </td>
                    <td>
                      <FigureInput label="Location impressions" value={row.impressions} placeholder="e.g. 1,486" disabled={disabled} onChange={(value) => setLocation(index, { impressions: value })} />
                    </td>
                    <td>
                      <FigureInput label="Location calls" value={row.calls} placeholder="e.g. 21" disabled={disabled} onChange={(value) => setLocation(index, { calls: value })} />
                    </td>
                    <td>
                      <FigureInput label="Location directions" value={row.directions} placeholder="e.g. 88" disabled={disabled} onChange={(value) => setLocation(index, { directions: value })} />
                    </td>
                    <td>{!readOnly ? <RemoveRowButton label="Remove location" onClick={() => patch({ locations: values.locations.filter((_, i) => i !== index) })} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {values.locations.length < MAX_ROWS ? <AddRowButton disabled={readOnly} onClick={() => patch({ locations: [...values.locations, emptyLocation()] })} /> : null}
          </SectionCard>
        </div>

        <div>
          <div className="side-card">
            <div className="side-title">Report Status</div>
            <div style={{ marginTop: 8 }}>
              <span className={badge.badge}>
                <span className={badge.dot} /> {isEdit ? badge.label : "Not saved yet"}
              </span>
            </div>

            {report ? (
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.7, marginTop: 10 }}>
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
              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, marginTop: 10 }}>
                Save a draft first. You can come back to it any time before handing it in.
              </div>
            )}

            {report && canReview && !readOnly ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                {status === "draft" || status === "submitted" ? (
                  <button className="btn-draft" type="button" disabled={isPending} onClick={() => save("approved")}>
                    Approve
                  </button>
                ) : null}
                {status !== "draft" ? (
                  <button className="btn-draft" type="button" disabled={isPending} onClick={() => save("draft")}>
                    Send back to draft
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="side-card">
            <div className="side-title">Before You Send</div>
            <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, marginTop: 8 }}>
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
            <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5, marginTop: 8 }}>
              The percentage changes clients see are worked out from the previous published report, so only enter this
              period&apos;s figures.
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <div className="autosave-tag">{report ? `Last saved ${formatDateTime(report.updatedAt)}` : "Not yet saved"}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/monthly-reports" className="btn-draft">
            Back to All Reports
          </Link>
          {actionButtons}
        </div>
      </div>
    </>
  );
};

export default ReportEditor;
