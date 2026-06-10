import { Link } from "react-router-dom";

const navStyle = {
  fontSize: "0.875rem",
  color: "#64748b",
};

const linkStyle = {
  color: "#2563eb",
  textDecoration: "none",
};

/**
 * Accessible breadcrumb nav matching JSON-LD trail.
 * @param {{ name: string, url: string }[]} items
 * @param {boolean} [includeCurrent=true] — show last item as text (current page)
 */
export default function DiscoveryBreadcrumbNav({ items, includeCurrent = true }) {
  if (!items?.length) return null;

  const visible = includeCurrent ? items : items.slice(0, -1);

  return (
    <nav style={navStyle} aria-label="Breadcrumb">
      {visible.map((item, index) => {
        const isLast = index === visible.length - 1;
        const isCurrentPage = includeCurrent && isLast;

        return (
          <span key={`${item.url}-${index}`}>
            {index > 0 && <span> / </span>}
            {isCurrentPage ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link to={item.url} style={linkStyle}>
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
