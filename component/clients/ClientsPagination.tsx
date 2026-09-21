import Link from "next/link";
import type { ClientListData } from "@/app/actions/clients";
import { pageItems } from "@/component/shared/pageItems";
import { clientsHref } from "./clientUi";

const ClientsPagination = ({
  pagination,
  status,
  search,
}: {
  pagination: ClientListData["pagination"];
  status: string;
  search: string;
}) => {
  const { page, limit, total, totalPages, hasPreviousPage, hasNextPage } = pagination;
  // Everything fits on one page — nothing to show, not even the summary.
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const href = (target: number) => clientsHref({ status, q: search, page: target });

  return (
    <div className="clients-pagination">
      <span>
        Showing {from} to {to} of {total} clients
      </span>

      <nav className="pagination-controls" aria-label="Clients pagination">
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
  );
};

export default ClientsPagination;
