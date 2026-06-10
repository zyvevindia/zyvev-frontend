import { Link, useLocation } from "react-router-dom";

import {
  buildPageNumberWindow,
  CATALOG_PAGE_SIZE,
} from "../../utils/catalogPagination";

import "../../styles/catalog-pagination.css";

/**
 * Accessible catalog pagination — preserves query string via `to` builder.
 */
export default function CatalogPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = CATALOG_PAGE_SIZE,
  buildPageHref,
}) {
  if (totalItems <= pageSize) return null;

  const location = useLocation();
  const pages = buildPageNumberWindow(currentPage, totalPages);

  const hrefFor = (page) => {
    if (typeof buildPageHref === "function") {
      return buildPageHref(page);
    }
    const params = new URLSearchParams(location.search);
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const qs = params.toString();
    return `${location.pathname}${qs ? `?${qs}` : ""}`;
  };

  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      className="catalog-pagination"
      aria-label="Catalog pagination"
    >
      <p className="catalog-pagination__summary">
        Showing{" "}
        <span className="catalog-pagination__count">
          {rangeStart}–{rangeEnd}
        </span>{" "}
        of{" "}
        <span className="catalog-pagination__count">{totalItems}</span>{" "}
        EV{totalItems === 1 ? "" : "s"}
      </p>

      <ul className="catalog-pagination__list">
        <li>
          {currentPage > 1 ? (
            <Link
              to={hrefFor(currentPage - 1)}
              className="catalog-pagination__btn"
              rel={currentPage - 1 === 1 ? undefined : "prev"}
              aria-label={`Go to page ${currentPage - 1}`}
            >
              Previous
            </Link>
          ) : (
            <span
              className="catalog-pagination__btn catalog-pagination__btn--disabled"
              aria-disabled="true"
            >
              Previous
            </span>
          )}
        </li>

        {pages.map((page) => (
          <li key={page}>
            {page === currentPage ? (
              <span
                className="catalog-pagination__page catalog-pagination__page--current"
                aria-current="page"
              >
                {page}
              </span>
            ) : (
              <Link
                to={hrefFor(page)}
                className="catalog-pagination__page"
                aria-label={`Go to page ${page}`}
              >
                {page}
              </Link>
            )}
          </li>
        ))}

        <li>
          {currentPage < totalPages ? (
            <Link
              to={hrefFor(currentPage + 1)}
              className="catalog-pagination__btn"
              rel="next"
              aria-label={`Go to page ${currentPage + 1}`}
            >
              Next
            </Link>
          ) : (
            <span
              className="catalog-pagination__btn catalog-pagination__btn--disabled"
              aria-disabled="true"
            >
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
