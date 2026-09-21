import Link from "next/link";
import { ChevronDown, FileText, Pencil, Plus, RotateCcw, SearchX, Eye } from "lucide-react";
import type { ReportListData } from "@/app/actions/reports";
import { pageItems } from "@/component/shared/pageItems";
import { avatarColorFor, initialsOf } from "@/component/clients/clientUi";
import DeleteReportButton from "./DeleteReportButton";
import {
  STATUS_BADGES,
  clientIdOf,
  clientNameOf,
  formatDateTime,
  periodLabel,
  reportsHref,
} from "./reportUi";

type Filters = { client: string; month: string; status: string; search: string };

const EmptyState = ({ filtered, canWrite }: { filtered: boolean; canWrite: boolean }) => {
  const Icon = filtered ? SearchX : FileText;

  return (
    <div className="clients-empty-state" style={{ border: "none", margin: 0 }}>
      <div className="clients-empty-icon">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <div className="empty-title">{filtered ? "No reports match your filters" : "No reports yet"}</div>
      <div className="empty-desc">
        {filtered
          ? "Try another client, month or status, or search for something else."
          : canWrite
            ? "Create the first report for one of your clients to see it here."
            : "Reports for the clients you have access to will show up here."}
      </div>
      {filtered ? (
        <Link href="/monthly-reports" className="btn-draft clients-empty-action">
          <RotateCcw size={13} strokeWidth={2} /> Clear filters
        </Link>
      ) : canWrite ? (
        <Link href="/monthly-reports/add" className="btn-add-client clients-empty-action">
          <Plus size={14} strokeWidth={2.5} /> Create New Report
        </Link>
      ) : null}
    </div>
  );
};

const ReportsTable = ({
  data,
  filters,
  canWrite,
  canDelete,
}: {
  data: ReportListData;
  filters: Filters;
  canWrite: boolean;
  canDelete: boolean;
}) => {
  const { reports, pagination } = data;
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  const filtered = Boolean(filters.client || filters.month || filters.status || filters.search);
  const href = (target: number) => reportsHref({ ...filters, q: filters.search, page: target });

  if (reports.length === 0) {
    return (
      <div className="table-card">
        <EmptyState filtered={filtered} canWrite={canWrite} />
      </div>
    );
  }

  return (
    <div className="table-card">
      <table className="reports-table">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>#</th>
            <th style={{ width: "30%" }}>Client Name</th>
            <th style={{ width: "17%" }}>
              Report Date <ChevronDown size={12} strokeWidth={2.5} style={{ verticalAlign: "-1px" }} />
            </th>
            <th style={{ width: "14%" }}>Status</th>
            <th style={{ width: "20%" }}>Last Updated</th>
            <th style={{ width: "14%" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => {
            const name = clientNameOf(report.client) || "Unknown client";
            const badge = STATUS_BADGES[report.status];

            return (
              <tr key={report._id}>
                <td style={{ color: "#64748b" }}>{(page - 1) * limit + index + 1}</td>
                <td>
                  <div className="client-flex">
                    <div className="client-avatar-badge" style={{ background: avatarColorFor(clientIdOf(report.client)) }}>
                      {initialsOf(name)}
                    </div>
                    <span className="client-name-text">{name}</span>
                  </div>
                </td>
                <td>{periodLabel(report)}</td>
                <td>
                  <span className={badge.badge}>
                    <span className={badge.dot} /> {badge.label}
                  </span>
                </td>
                <td style={{ color: "#64748b" }}>{formatDateTime(report.updatedAt)}</td>
                <td>
                  <div className="action-wrap">
                    <Link
                      href={`/monthly-reports/${report._id}/edit`}
                      className="btn-edit-action"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                    >
                      {canWrite ? <Pencil size={12} strokeWidth={2} /> : <Eye size={12} strokeWidth={2} />}
                      {canWrite ? "Edit" : "View"}
                    </Link>
                    {canDelete ? <DeleteReportButton reportId={report._id} name={report.title} /> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* One page of results needs no footer. */}
      {totalPages > 1 ? (
        <div className="table-footer">
          <div>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} reports
          </div>
          <nav className="pagination-group" aria-label="Reports pagination">
            {hasPreviousPage ? (
              <Link className="page-btn" href={href(page - 1)} rel="prev" aria-label="Previous page">
                ‹
              </Link>
            ) : (
              <span className="page-btn" aria-disabled="true" aria-label="Previous page">
                ‹
              </span>
            )}
            {pageItems(page, totalPages).map((item) =>
              typeof item === "string" ? (
                <span className="page-gap" key={item} aria-hidden="true">
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  className={`page-btn${item === page ? " active" : ""}`}
                  href={href(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Link>
              )
            )}
            {hasNextPage ? (
              <Link className="page-btn" href={href(page + 1)} rel="next" aria-label="Next page">
                ›
              </Link>
            ) : (
              <span className="page-btn" aria-disabled="true" aria-label="Next page">
                ›
              </span>
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsTable;
