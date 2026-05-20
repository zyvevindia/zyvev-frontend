import { Link, useNavigate } from "react-router-dom";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "../../styles/compare-page.css";

import CompactCarCard from "../CompactCarCard";
import CompareInsightCard from "../catalog/CompareInsightCard";
import CompareTrustPanel from "../catalog/CompareTrustPanel";
import LeadInquiryModal from "../LeadInquiryModal";
import WhatsAppLeadCta from "../leads/WhatsAppLeadCta";
import CompareUtilityRail from "./CompareUtilityRail";

const CompareBelowFoldSections = lazy(() =>
  import("../catalog/CompareBelowFoldSections")
);

import { vehicleDetailPath } from "../../utils/vehicleRoutes";
import { saveCompareCars } from "../../utils/compareCarsStorage";
import { trackBuyerEvent } from "../../event-tracking/trackBuyerEvent";
import {
  trackLaunchCompareCta,
  trackLaunchCompareStarted,
} from "../../launch/launchTelemetry";
import { BUYER_EVENTS } from "../../event-tracking/eventTypes";
import {
  attachIntelligenceToCompareCars,
  getActiveCompareRows,
  formatCompareCellValue,
  getCompareHighlightWinnerId,
} from "../../intelligence/compareSpecRows";
import {
  trackCompareAbandoned,
  trackIntelligenceCompareEngaged,
} from "../../analytics/funnel";

function getBestValueId(cars) {
  if (!cars?.length) return null;
  let best = cars[0];
  let bestScore =
    (best.startingPrice || 1) / (best.specifications?.range || 1);
  cars.forEach((c) => {
    const catalogScore = c.catalogMeta?.compareValueScore;
    const score =
      catalogScore != null
        ? -Number(catalogScore)
        : (c.startingPrice || 1) /
          (c.specifications?.range || c.range || 1);
    if (score < bestScore) {
      best = c;
      bestScore = score;
    }
  });
  return best._id;
}

/**
 * Premium compare composition — shared by /compare and /compare/:slug.
 * Parent owns car list + persistence; this component renders hero, cards, trust, specs.
 */
export default function CompareHeroExperience({
  cars = [],
  sourcePage = "/compare",
  variant = "tool",
  heroTitle,
  heroSubtitle,
  heroBadge,
  onCarsChange,
  showClearComparison = true,
  enableFab = true,
  topSlot = null,
  recommendationLogic = null,
  usefulnessLabel,
}) {
  const navigate = useNavigate();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryHeadline, setInquiryHeadline] = useState("Request a callback");
  const [inquirySubmit, setInquirySubmit] = useState("Request callback");

  const intelligentCars = useMemo(
    () => attachIntelligenceToCompareCars(cars),
    [cars]
  );

  const compareSpecRows = useMemo(
    () => getActiveCompareRows(intelligentCars),
    [intelligentCars]
  );

  const compareVehicleLabel = useMemo(
    () =>
      cars
        .map((c) => c?.name)
        .filter(Boolean)
        .join(" vs "),
    [cars]
  );

  const compareVehicleIds = useMemo(
    () =>
      cars
        .map((c) => String(c?._id || ""))
        .filter(Boolean)
        .join(","),
    [cars]
  );

  const bestId = useMemo(() => getBestValueId(intelligentCars), [intelligentCars]);

  const primaryMongoCarId = useMemo(
    () => (cars[0]?._id ? String(cars[0]._id) : ""),
    [cars]
  );

  const compareSlugsKey = useMemo(
    () =>
      cars
        .map((c) => c?.slug)
        .filter(Boolean)
        .sort()
        .join("|"),
    [cars]
  );

  const intelligenceTrackedRef = useRef(false);
  useEffect(() => {
    if (intelligentCars.length < 2) return;
    if (intelligenceTrackedRef.current) return;
    intelligenceTrackedRef.current = true;
    trackIntelligenceCompareEngaged({
      vehicleSlugs: intelligentCars.map((c) => c.slug),
      sourcePage,
      rowCount: compareSpecRows.length,
    });
  }, [intelligentCars, compareSpecRows.length, sourcePage]);

  useEffect(() => {
    if (!compareSlugsKey) return;
    const slugs = compareSlugsKey.split("|");
    if (slugs.length >= 2) {
      trackLaunchCompareStarted({
        sourcePage,
        vehicleSlugs: slugs,
        compareDepth: slugs.length,
      });
    }
  }, [compareSlugsKey, sourcePage]);

  const compareAbandonTracked = useRef(false);
  const inquiryOpenRef = useRef(inquiryOpen);
  inquiryOpenRef.current = inquiryOpen;

  useEffect(() => {
    if (cars.length < 2) return undefined;
    const slugs = cars.map((c) => c.slug).filter(Boolean);
    const depth = cars.length;
    return () => {
      if (compareAbandonTracked.current || inquiryOpenRef.current) return;
      compareAbandonTracked.current = true;
      trackCompareAbandoned({
        vehicleSlugs: slugs,
        compareDepth: depth,
        sourcePage,
      });
    };
  }, [cars, sourcePage]);

  const persistCars = useCallback(
    (next) => {
      const saved = saveCompareCars(next);
      onCarsChange?.(saved);
      return saved;
    },
    [onCarsChange]
  );

  const openInquiry = useCallback(
    (headline, submit) => {
      setInquiryHeadline(headline);
      setInquirySubmit(submit);
      setInquiryOpen(true);
      const slugs = cars.map((c) => c?.slug).filter(Boolean);
      trackLaunchCompareCta({
        sourcePage,
        headline,
        vehicleSlugs: slugs,
      });
      trackBuyerEvent(BUYER_EVENTS.LEAD_CTA_INITIATED, {
        sourcePage,
        vehicleSlugs: slugs,
      });
    },
    [cars, sourcePage]
  );

  const goToExploreCompare = useCallback(() => {
    if (cars.length) saveCompareCars(cars);
    navigate("/cars?compareMode=true");
  }, [cars, navigate]);

  const removeFromCompare = useCallback(
    (target) => {
      const key = target?._id || target?.slug;
      const next = cars.filter((c) => (c?._id || c?.slug) !== key);
      persistCars(next);
      if (variant === "tool") {
        navigate("/compare", { replace: true, state: { cars: next } });
      }
    },
    [cars, persistCars, navigate, variant]
  );

  const clearComparison = useCallback(() => {
    persistCars([]);
    navigate("/compare", { replace: true, state: {} });
  }, [persistCars, navigate]);

  if (cars.length < 2) return null;

  const gridClass =
    cars.length === 3
      ? "compare-page-grid compare-page-grid--cols-3"
      : "compare-page-grid";

  const title =
    heroTitle ||
    (variant === "guide" ? compareVehicleLabel : "Compare Electric Vehicles");
  const subtitle =
    heroSubtitle ||
    (variant === "guide"
      ? "Side-by-side range, charging, ownership, and trust signals — not a blog ranking."
      : "Side-by-side pricing, range, charging, and specs to find the right EV for your needs.");
  const badge =
    heroBadge ||
    (variant === "guide" ? "EV comparison" : "Premium EV Comparison");

  return (
    <>
      <div
        className={`compare-page compare-page--with-fab${
          variant === "guide" ? " compare-page--guide" : ""
        }`}
      >
        {topSlot}

        <section className="compare-hero">
          <div
            className="compare-hero__glow compare-hero__glow--tr"
            aria-hidden
          />
          <div
            className="compare-hero__glow compare-hero__glow--bl"
            aria-hidden
          />

          <div className="compare-hero__content">
            <span className="compare-hero__badge">{badge}</span>

            <h1 className="compare-hero__title">{title}</h1>

            {variant !== "guide" && subtitle ? (
              <p className="compare-hero__subtitle">{subtitle}</p>
            ) : null}

            {cars.length === 2 && variant === "tool" ? (
              <p
                style={{
                  margin: "0.35rem auto 0",
                  fontSize: "0.875rem",
                  color: "#64748b",
                  maxWidth: "36rem",
                }}
              >
                You can compare up to three EVs — add one more from{" "}
                <Link
                  to="/cars?compareMode=true"
                  style={{ color: "#2563eb", fontWeight: 600 }}
                >
                  Browse
                </Link>{" "}
                for charging and ownership context side by side.
              </p>
            ) : null}

            <div className="compare-hero__actions">
              <button
                type="button"
                onClick={() => openInquiry("Request a callback", "Request callback")}
                className="compare-hero__btn compare-hero__btn--ghost"
              >
                Request callback
              </button>

              <button
                type="button"
                className="compare-hero__btn compare-hero__btn--ghost"
                onClick={() => openInquiry("Get the best deal", "Get best deal")}
              >
                Get best deal
              </button>

              <WhatsAppLeadCta
                sourcePage={sourcePage}
                compareSlugs={cars.map((c) => c.slug).filter(Boolean)}
                vehicleName={compareVehicleLabel || "EV comparison"}
                intent="compare"
                label="WhatsApp enquiry"
                variant="secondary"
              />

              <button
                type="button"
                onClick={goToExploreCompare}
                className="compare-hero__btn compare-hero__btn--ghost"
              >
                Explore More EVs
              </button>

              {showClearComparison && variant === "tool" ? (
                <button
                  type="button"
                  className="compare-hero__btn compare-hero__btn--primary"
                  onClick={clearComparison}
                >
                  Clear Comparison
                </button>
              ) : null}

              {variant === "guide" ? (
                <Link
                  to="/compare"
                  className="compare-hero__btn compare-hero__btn--ghost"
                  style={{ textDecoration: "none" }}
                >
                  Open compare hub
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="compare-main">
          <div className={gridClass}>
            {cars.map((car, cardIndex) => {
              const isBest = car._id === bestId;
              return (
                <div
                  key={car._id || car.slug}
                  className={`compare-page-card${isBest ? " compare-page-card--best" : ""}`}
                >
                  {isBest && (
                    <div className="compare-page-card__badge">Best Value</div>
                  )}

                  {variant === "tool" ? (
                    <button
                      type="button"
                      onClick={() => removeFromCompare(car)}
                      aria-label={`Remove ${car.name} from comparison`}
                      className="compare-page-card__remove"
                    >
                      Remove
                    </button>
                  ) : null}

                  <div className="compare-page-card__body">
                    <div className="compare-page-card__vehicle">
                      <CompactCarCard
                        variant="compare"
                        eagerImage={cardIndex === 0}
                        car={{
                          ...car,
                          image: car.heroImage || car.image,
                          price: car.startingPrice,
                          range: car.specifications?.range || 0,
                          battery:
                            car.specifications?.batteryPack || "EV Battery",
                          badge: isBest
                            ? "Recommended"
                            : car.catalogMeta?.compareValueScore != null
                              ? `Value ${car.catalogMeta.compareValueScore}`
                              : "Compared",
                        }}
                      />
                    </div>

                    <div className="compare-page-card__insight">
                      <CompareInsightCard car={car} />
                    </div>

                    <div className="compare-page-card__cta-wrap">
                      <Link
                        to={vehicleDetailPath(car, car._id)}
                        className="compare-page-card__cta"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="compare-spec">
            <div className="compare-spec__header">
              <h2 className="compare-spec__title">Detailed Specifications</h2>
              <span className="compare-spec__hint">
                Swipe horizontally on mobile
              </span>
            </div>

            <div className="compare-spec__table-wrap">
              <table className="compare-spec__table">
                <thead>
                  <tr>
                    <th>Specifications</th>
                    {cars.map((car) => {
                      const isBest = car._id === bestId;
                      return (
                        <th
                          key={car._id}
                          className={
                            isBest ? "compare-spec__th--best" : undefined
                          }
                        >
                          {car.name}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {compareSpecRows.map((row) => {
                    const highlightId = getCompareHighlightWinnerId(
                      intelligentCars,
                      row
                    );
                    return (
                      <tr key={row.id}>
                        <td className="compare-spec__label">
                          {row.label}
                          {row.estimated ? (
                            <span className="ev-intel-est"> Est.</span>
                          ) : null}
                        </td>
                        {intelligentCars.map((car) => {
                          const raw = row.getRaw(car);
                          const isBest = highlightId === car._id;
                          const isValueBest =
                            row.id === "price" && car._id === bestId;
                          return (
                            <td
                              key={car._id}
                              className={`compare-spec__value${
                                isBest || isValueBest
                                  ? " compare-spec__value--highlight"
                                  : ""
                              }${
                                isValueBest
                                  ? " compare-spec__value--best"
                                  : ""
                              }`}
                            >
                              {formatCompareCellValue(raw, row)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {compareSpecRows.some((r) => r.estimated) && (
              <p className="compare-spec__estimate-hint">
                * Estimated values use configurable assumptions — not OEM quotes.
                Confirm specs with the dealer.
              </p>
            )}
          </div>

          <CompareUtilityRail
            recommendationLogic={recommendationLogic}
            sourcePage={sourcePage}
            metadata={{
              vehicleSlugs: cars.map((c) => c.slug).filter(Boolean),
              compareDepth: cars.length,
            }}
            usefulnessLabel={
              usefulnessLabel ||
              (variant === "guide"
                ? "Was this comparison useful?"
                : "Was this useful?")
            }
          />

          <div className="compare-below-fold">
            <Suspense
              fallback={
                <div
                  className="compare-deferred-skeleton compare-deferred-skeleton--inline"
                  aria-busy="true"
                  aria-label="Loading comparison insights"
                />
              }
            >
              <CompareBelowFoldSections
                cars={cars}
                intelligentCars={intelligentCars}
                guideMode={variant === "guide"}
              />
            </Suspense>
          </div>

          {variant === "tool" ? (
            <div className="compare-trust-panel">
              <CompareTrustPanel cars={cars} />
            </div>
          ) : null}
        </section>
      </div>

      {enableFab ? (
        <button
          type="button"
          className="compare-add-more-fab"
          onClick={goToExploreCompare}
          aria-label="Add more EVs to comparison"
        >
          <span className="compare-add-more-fab__icon" aria-hidden>
            +
          </span>
          Add more EVs
        </button>
      ) : null}

      <LeadInquiryModal
        isOpen={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        sourcePage={sourcePage.replace(/^\//, "") || "compare"}
        vehicleName={compareVehicleLabel || "EV comparison"}
        vehicleId={compareVehicleIds}
        mongoCarId={primaryMongoCarId}
        headline={inquiryHeadline}
        submitLabel={inquirySubmit}
      />
    </>
  );
}
