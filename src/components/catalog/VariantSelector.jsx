import { formatIndianPriceCompact } from "../../utils/formatIndianPrice";

function pickVisibleBadges(badges = []) {
  const priority = [
    "recommended",
    "best_value",
    "long_range",
  ];
  const picked = [];

  for (const key of priority) {
    const match = badges.find((b) => b.key === key);
    if (match) picked.push(match);
    if (picked.length >= 2) break;
  }

  if (!picked.length && badges[0]) {
    picked.push(badges[0]);
  }

  return picked;
}

export default function VariantSelector({
  variants = [],
  selectedSlug,
  onSelect,
  onCompareVariants,
  sticky = false,
}) {
  if (!variants.length) return null;

  const showCompare = variants.length > 1;
  const shellClass = [
    "variant-selector-shell",
    sticky ? "variant-selector-shell--sticky" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={shellClass}
      aria-label="Choose a variant"
    >
      <div className="variant-selector__header">
        <div>
          <h2 className="variant-selector__title">
            Choose your variant
          </h2>
          <p className="variant-selector__subtitle">
            Compare trims, then select the one that fits
            your budget and driving pattern.
          </p>
        </div>

        {showCompare && onCompareVariants && (
          <button
            type="button"
            className="variant-selector__compare-btn"
            onClick={onCompareVariants}
          >
            Compare variants
          </button>
        )}
      </div>

      <div
        className="variant-selector-scroll"
        role="listbox"
        aria-label="Vehicle variants"
      >
        {variants.map((variant) => {
          const isActive =
            selectedSlug === variant.slug;
          const visibleBadges = pickVisibleBadges(
            variant.insightBadges
          );

          return (
            <button
              key={variant.slug}
              type="button"
              role="option"
              aria-selected={isActive}
              className={`variant-selector-card${
                isActive
                  ? " variant-selector-card--active"
                  : ""
              }`}
              onClick={() => onSelect(variant)}
            >
              {isActive && (
                <span
                  className="variant-selector-card__active-ring"
                  aria-hidden
                />
              )}

              {visibleBadges.length > 0 && (
                <span className="variant-selector-card__badges">
                  {visibleBadges.map((badge) => (
                    <span
                      key={badge.key}
                      className={`variant-selector-badge${
                        badge.key === "recommended"
                          ? " variant-selector-badge--recommended"
                          : badge.key === "best_value"
                            ? " variant-selector-badge--value"
                            : badge.key === "long_range"
                              ? " variant-selector-badge--range"
                              : ""
                      }`}
                    >
                      {badge.label}
                    </span>
                  ))}
                </span>
              )}

              <span className="variant-selector-card__name">
                {variant.variantLabel || variant.name}
              </span>

              <span className="variant-selector-card__price">
                {formatIndianPriceCompact(
                  variant.price || variant.startingPrice
                )}
              </span>

              <span className="variant-selector-card__specs">
                <span>
                  {variant.displayBattery || "—"}
                </span>
                <span>
                  {variant.displayRange || "—"}
                </span>
              </span>

              {variant.drivetrain && (
                <span className="variant-selector-card__tag">
                  {variant.drivetrain}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
