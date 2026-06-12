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

import CompareVehicleCard from "./CompareVehicleCard";
import CompareMobileSpecCards from "./CompareMobileSpecCards";
import CompareScoreStory from "./CompareScoreStory";
import LeadInquiryModal from "../LeadInquiryModal";
import WhatsAppLeadCta from "../leads/WhatsAppLeadCta";
import CompareUtilityRail from "./CompareUtilityRail";
import SectionErrorBoundary from "../errors/SectionErrorBoundary";

const CompareInternalLinks = lazy(() =>
  import("./CompareInternalLinks")
);
const CompareTrustExplain = lazy(() =>
  import("./CompareTrustExplain")
);
const CompareReliabilitySummary = lazy(() =>
  import("./CompareReliabilitySummary")
);
const CompareTrustPanel = lazy(() =>
  import("../catalog/CompareTrustPanel")
);
const CompareGuideEditorialSections = lazy(() =>
  import("./CompareGuideEditorialSections")
);
const VariantComparisonTable = lazy(() =>
  import("../catalog/VariantComparisonTable")
);

const CompareBelowFoldSections = lazy(() =>
  import("../catalog/CompareBelowFoldSections")
);

import { vehicleDetailPath } from "../../utils/vehicleRoutes";
import { extractFamilySlug } from "../../utils/modelFamily";
import { resolveFullDisplayName } from "../../utils/vehicleDisplayName";
import { saveCompareCars } from "../../utils/compareCarsStorage";
import { ensureArray } from "../../utils/compareArrayUtils";
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
import { attachScrollDepthTracker } from "../../utils/scrollDepthTracker";
import {
  COMPARE_CALLBACK_LABEL,
  COMPARE_PRICING_CTA_LABEL,
  WHATSAPP_CTA_LABEL,
} from "../../utils/conversionTrustCopy";
import { buildAllCompareBadges } from "../../utils/compareScoreBadges";

function carKey(car) {
  return car?._id || car?.slug || null;
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
  /** SEO payload for /compare/:slug — editorial renders once below real-world block */
  guideSeoPage = null,
  /** When true, prefer variant-family table over generic spec matrix */
  variantCompareSession = false,
}) {
  const navigate = useNavigate();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryHeadline, setInquiryHeadline] = useState("Request a callback");
  const [inquirySubmit, setInquirySubmit] = useState("Request callback");

  const safeCars = useMemo(
    () => ensureArray(cars),
    [cars]
  );

  const intelligentCars = useMemo(
    () => attachIntelligenceToCompareCars(safeCars),
    [safeCars]
  );

  const compareSpecRows = useMemo(
    () => getActiveCompareRows(intelligentCars),
    [intelligentCars]
  );

  const compareVehicleLabel = useMemo(
    () =>
      safeCars
        .map((c) => resolveFullDisplayName(c))
        .filter(Boolean)
        .join(" vs "),
    [safeCars]
  );

  const compareVehicleIds = useMemo(
    () =>
      safeCars
        .map((c) => String(c?._id || ""))
        .filter(Boolean)
        .join(","),
    [safeCars]
  );

  const compareBadges = useMemo(
    () => buildAllCompareBadges(intelligentCars),
    [intelligentCars]
  );

  const priceRow = useMemo(
    () => compareSpecRows.find((row) => row.id === "price") || null,
    [compareSpecRows]
  );

  const recommendedId = compareBadges.recommendedId;
  const bestValueId = compareBadges.bestValueId;

  const primaryMongoCarId = useMemo(
    () => (safeCars[0]?._id ? String(safeCars[0]._id) : ""),
    [safeCars]
  );

  const compareContextSlugs = useMemo(
    () => safeCars.map((c) => c?.slug).filter(Boolean),
    [safeCars]
  );

  const compareSlugsKey = useMemo(
    () => [...compareContextSlugs].sort().join("|"),
    [compareContextSlugs]
  );

  const isFamilyVariantCompare = useMemo(() => {
    if (safeCars.length < 2) return false;
    const families = safeCars.map((car) =>
      extractFamilySlug(car.familySlug || car.slug)
    );
    const unique = new Set(families.filter(Boolean));
    return unique.size === 1;
  }, [safeCars]);

  const showVariantFamilyTable =
    variantCompareSession || isFamilyVariantCompare;

  const intelligenceTrackedRef = useRef(false);
  useEffect(() => {
    if (safeCars.length < 2) return;
    if (intelligenceTrackedRef.current) return;
    intelligenceTrackedRef.current = true;
    trackIntelligenceCompareEngaged({
        vehicleSlugs: safeCars.map((c) => c?.slug).filter(Boolean),
      sourcePage,
      rowCount: compareSpecRows.length,
    });
  }, [safeCars.length, compareSpecRows.length, sourcePage]);

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

  useEffect(() => {
    if (safeCars.length < 2) return undefined;
    return attachScrollDepthTracker("compare");
  }, [safeCars.length]);

  const compareAbandonTracked = useRef(false);
  const inquiryOpenRef = useRef(inquiryOpen);
  inquiryOpenRef.current = inquiryOpen;

  useEffect(() => {
    if (safeCars.length < 2) return undefined;
    const slugs = safeCars.map((c) => c?.slug).filter(Boolean);
    const depth = safeCars.length;
    return () => {
      if (compareAbandonTracked.current || inquiryOpenRef.current) return;
      compareAbandonTracked.current = true;
      trackCompareAbandoned({
        vehicleSlugs: slugs,
        compareDepth: depth,
        sourcePage,
      });
    };
  }, [safeCars, sourcePage]);

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
      const slugs = safeCars.map((c) => c?.slug).filter(Boolean);
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
    [safeCars, sourcePage]
  );

  const goToExploreCompare = useCallback(() => {
    if (safeCars.length) saveCompareCars(safeCars);
    navigate("/cars?compareMode=true");
  }, [safeCars, navigate]);

  const removeFromCompare = useCallback(
    (target) => {
      const key = target?._id || target?.slug;
      const next = safeCars.filter((c) => (c?._id || c?.slug) !== key);
      persistCars(next);
      if (variant === "tool") {
        navigate("/compare", { replace: true, state: { cars: next } });
      }
    },
    [safeCars, persistCars, navigate, variant]
  );

  const clearComparison = useCallback(() => {
    persistCars([]);
    navigate("/compare", { replace: true, state: {} });
  }, [persistCars, navigate]);

  if (safeCars.length < 2) return null;

  const gridClass =
    safeCars.length === 3
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

            {safeCars.length === 2 && variant === "tool" ? (
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

            <div className="compare-hero__actions" role="group" aria-label="Compare page actions">
              <button
                type="button"
                onClick={() =>
                  openInquiry("Request dealer callback", COMPARE_CALLBACK_LABEL)
                }
                className="compare-hero__btn compare-hero__btn--ghost"
                aria-label="Request dealer callback for compared EVs"
              >
                {COMPARE_CALLBACK_LABEL}
              </button>

              <button
                type="button"
                className="compare-hero__btn compare-hero__btn--ghost"
                onClick={() =>
                  openInquiry("Compare on-road quotes", COMPARE_PRICING_CTA_LABEL)
                }
                aria-label="Compare on-road price quotes for selected EVs"
              >
                {COMPARE_PRICING_CTA_LABEL}
              </button>

              <WhatsAppLeadCta
                sourcePage={sourcePage}
                compareSlugs={safeCars.map((c) => c?.slug).filter(Boolean)}
                vehicleName={compareVehicleLabel || "EV comparison"}
                intent="compare"
                label={WHATSAPP_CTA_LABEL}
                variant="secondary"
              />

              <button
                type="button"
                onClick={goToExploreCompare}
                className="compare-hero__btn compare-hero__btn--ghost"
                aria-label="Browse EV catalog to add more vehicles to compare"
              >
                Explore More EVs
              </button>

              {showClearComparison && variant === "tool" ? (
                <button
                  type="button"
                  className="compare-hero__btn compare-hero__btn--primary"
                  onClick={clearComparison}
                  aria-label="Clear all vehicles from comparison"
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
            {intelligentCars.map((car, cardIndex) => {
              const key = carKey(car);
              const badge = compareBadges.badgeByCarId.get(key);
              const isRecommended = key === recommendedId;
              return (
                <div
                  key={car._id || car.slug}
                  className={`compare-page-card${isRecommended ? " compare-page-card--best" : ""}`}
                >
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

                  <CompareVehicleCard
                    car={car}
                    compareBadge={badge}
                    isRecommended={isRecommended}
                    eagerImage={cardIndex === 0}
                    detailHref={vehicleDetailPath(car, car._id)}
                  />
                </div>
              );
            })}
          </div>

          <CompareScoreStory
            cars={intelligentCars}
            recommendedId={recommendedId}
            bestValueId={compareBadges.bestValueId}
            longRangeId={compareBadges.longRangeId}
            fastChargingId={compareBadges.fastChargingId}
          />

          {showVariantFamilyTable ? (
            <SectionErrorBoundary label="Variant comparison" compact>
              <Suspense
                fallback={
                  <div
                    className="compare-deferred-skeleton compare-deferred-skeleton--inline"
                    aria-busy="true"
                    aria-label="Loading variant comparison table"
                  />
                }
              >
                <VariantComparisonTable
                  embedded
                  hideHeader
                  variants={safeCars}
                  readOnly
                  showCompareAll={false}
                />
              </Suspense>
            </SectionErrorBoundary>
          ) : null}

          {!showVariantFamilyTable ? (
          <>
          <CompareMobileSpecCards
            cars={intelligentCars}
            allBadgesByCarId={compareBadges.allBadgesByCarId}
            recommendedId={recommendedId}
            priceRow={priceRow}
          />

          <div className="compare-spec compare-spec--desktop">
            <div className="compare-spec__header">
              <h2 className="compare-spec__title">Detailed Specifications</h2>
              <span className="compare-spec__hint compare-spec__hint--desktop">
                Full side-by-side specification matrix
              </span>
            </div>

            <div className="compare-spec__table-wrap">
              <table
                className="compare-spec__table"
                aria-label="Detailed EV specification comparison"
              >
                <thead>
                  <tr>
                    <th scope="col">Specifications</th>
                    {safeCars.map((car) => {
                      const key = carKey(car);
                      const isRecommended = key === recommendedId;
                      return (
                        <th
                          key={car._id}
                          scope="col"
                          className={
                            isRecommended ? "compare-spec__th--best" : undefined
                          }
                        >
                          {resolveFullDisplayName(car)}
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
                          const key = carKey(car);
                          const isBest = highlightId === car._id;
                          const isValueBest =
                            row.id === "price" && key === bestValueId;
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
          </>
          ) : null}

          {intelligentCars.length >= 2 ? (
            <SectionErrorBoundary label="Compare trust guidance" compact>
            <Suspense
              fallback={
                <div
                  className="compare-deferred-skeleton compare-deferred-skeleton--inline"
                  aria-busy="true"
                  aria-label="Loading trust summary"
                />
              }
            >
              <CompareTrustExplain
                cars={intelligentCars}
                recommendedSlug={
                  intelligentCars.find((c) => carKey(c) === recommendedId)?.slug
                }
              />
              <CompareReliabilitySummary cars={intelligentCars} />
            </Suspense>
            </SectionErrorBoundary>
          ) : null}

          <CompareUtilityRail
            recommendationLogic={recommendationLogic}
            sourcePage={sourcePage}
            cars={safeCars}
            metadata={{
              vehicleSlugs: safeCars.map((c) => c?.slug).filter(Boolean),
              compareDepth: safeCars.length,
            }}
            usefulnessLabel={
              usefulnessLabel ||
              (variant === "guide"
                ? "Was this comparison useful?"
                : "Was this useful?")
            }
          />

          <div className="compare-below-fold">
            <SectionErrorBoundary label="Comparison insights" compact>
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
                cars={safeCars}
                intelligentCars={intelligentCars}
                guideMode={variant === "guide"}
              />
            </Suspense>
            </SectionErrorBoundary>
          </div>

          {variant === "tool" ? (
            <div className="compare-trust-panel">
              <SectionErrorBoundary label="Trust panel" compact>
              <Suspense
                fallback={
                  <div
                    className="compare-deferred-skeleton compare-deferred-skeleton--inline"
                    aria-busy="true"
                    aria-label="Loading trust panel"
                  />
                }
              >
                <CompareTrustPanel cars={cars} />
              </Suspense>
              </SectionErrorBoundary>
            </div>
          ) : null}

          {variant === "guide" && guideSeoPage ? (
            <SectionErrorBoundary label="Comparison guide" compact>
            <Suspense
              fallback={
                <div
                  className="compare-deferred-skeleton compare-deferred-skeleton--inline"
                  aria-busy="true"
                  aria-label="Loading comparison guide"
                />
              }
            >
              <CompareGuideEditorialSections seoPage={guideSeoPage} />
            </Suspense>
            </SectionErrorBoundary>
          ) : null}

          <SectionErrorBoundary label="Related comparisons" compact>
          <Suspense
            fallback={
              <div
                className="compare-deferred-skeleton compare-deferred-skeleton--inline"
                aria-busy="true"
                aria-label="Loading related comparisons"
              />
            }
          >
            <CompareInternalLinks contextSlugs={compareContextSlugs} />
          </Suspense>
          </SectionErrorBoundary>
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
