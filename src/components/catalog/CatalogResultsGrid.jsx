import { Children } from "react";

import "../../styles/catalog-results-grid.css";

/**
 * Responsive EV card grid with a max card width and centered layout for 1–2 results.
 */
export default function CatalogResultsGrid({
  children,
  /** Explicit item count; defaults to non-empty child count */
  count,
  className = "",
  ...rest
}) {
  const items = Children.toArray(children).filter(
    (child) => child !== null && child !== undefined && child !== false
  );
  const itemCount = typeof count === "number" ? count : items.length;
  const compact = itemCount > 0 && itemCount <= 2;

  const classes = [
    "catalog-results-grid",
    compact ? "catalog-results-grid--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {items}
    </div>
  );
}
