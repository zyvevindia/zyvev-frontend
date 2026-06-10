/** Catalog listing pagination — 12 families per page. */

export const CATALOG_PAGE_SIZE = 12;

export const CATALOG_PAGE_URL_PARAM = "page";

/**
 * @param {URLSearchParams} searchParams
 * @param {number} [totalPages=1]
 */
export function parsePageFromParams(searchParams, totalPages = 1) {
  const raw = parseInt(
    String(searchParams?.get(CATALOG_PAGE_URL_PARAM) || "1"),
    10
  );
  if (!Number.isFinite(raw) || raw < 1) return 1;
  const max = Math.max(1, totalPages);
  return Math.min(raw, max);
}

/**
 * @param {number} itemCount
 * @param {number} [pageSize]
 */
export function getCatalogTotalPages(itemCount, pageSize = CATALOG_PAGE_SIZE) {
  if (!itemCount || itemCount <= 0) return 1;
  return Math.ceil(itemCount / pageSize);
}

/**
 * @param {T[]} items
 * @param {number} page 1-based
 * @param {number} [pageSize]
 * @returns {T[]}
 * @template T
 */
export function paginateCatalogItems(items, page, pageSize = CATALOG_PAGE_SIZE) {
  const list = items || [];
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

/**
 * @param {number} page
 * @param {URLSearchParams} searchParams
 */
export function writePageToParams(page, searchParams) {
  const next = new URLSearchParams(searchParams);
  if (page <= 1) {
    next.delete(CATALOG_PAGE_URL_PARAM);
  } else {
    next.set(CATALOG_PAGE_URL_PARAM, String(page));
  }
  return next;
}

/**
 * Remove page param when filters/search/sort change.
 * @param {URLSearchParams} searchParams
 */
export function resetPageInParams(searchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete(CATALOG_PAGE_URL_PARAM);
  return next;
}

/**
 * Build compact page number window for pagination UI.
 * @param {number} current
 * @param {number} total
 * @param {number} [maxVisible]
 */
export function buildPageNumberWindow(current, total, maxVisible = 5) {
  if (total <= 1) return [1];

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(total, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  return pages;
}
