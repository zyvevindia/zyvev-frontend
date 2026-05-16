import { Link } from "react-router-dom";

import { vehicleFamilyPath } from "../../utils/vehicleRoutes";

export default function DetailBreadcrumbs({
  brand,
  familySlug,
  familyTitle,
  variantLabel,
}) {
  const crumbs = [
    { label: "Home", to: "/" },
    {
      label: brand || "EVs",
      to: "/cars",
    },
    {
      label: familyTitle || "Model",
      to: vehicleFamilyPath(familySlug),
    },
  ];

  if (variantLabel) {
    crumbs.push({
      label: variantLabel,
      to: null,
    });
  }

  return (
    <nav
      className="detail-breadcrumbs"
      aria-label="Breadcrumb"
    >
      <ol className="detail-breadcrumbs__list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li
              key={`${crumb.label}-${index}`}
              className="detail-breadcrumbs__item"
            >
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="detail-breadcrumbs__link"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="detail-breadcrumbs__current"
                  aria-current={
                    isLast ? "page" : undefined
                  }
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <span
                  className="detail-breadcrumbs__sep"
                  aria-hidden
                >
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
