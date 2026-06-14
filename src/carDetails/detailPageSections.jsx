import { lazy, Suspense } from "react";

import EvDetailGoldSections from "../components/catalog/EvDetailGoldSections";
import DetailSeoDiscovery from "../components/catalog/DetailSeoDiscovery";
import DetailOverviewDashboard from "../components/car/DetailOverviewDashboard";
import DetailDealerAssistance from "../components/car/DetailDealerAssistance";
import DetailKeySpecifications from "../components/car/DetailKeySpecifications";
import { scrollToDetailSection } from "../utils/detailPageNav.js";
import TrustDataStrip from "../components/trust/TrustDataStrip";
import SectionErrorBoundary from "../components/errors/SectionErrorBoundary";
import EvIntelligenceSections from "../components/intelligence/EvIntelligenceSections";
import PeopleAlsoCompareSection from "../components/car/PeopleAlsoCompareSection";
import SimilarEvsSection from "../components/car/SimilarEvsSection";
import PopularAmongSimilarBuyersSection from "../components/car/PopularAmongSimilarBuyersSection";
import {
  buildDetailOwnershipExpectation,
  buildDetailTrustMaturityNote,
} from "../utils/ownershipTrustCopy";
import { trackLaunchDealerAssistance } from "../launch/launchTelemetry";

const EMICalculator = lazy(() => import("../components/EMICalculator"));
const VariantComparisonTable = lazy(() =>
  import("../components/catalog/VariantComparisonTable")
);

/**
 * @typedef {import("./detailPageRegistry").DetailPageRenderContext} DetailPageRenderContext
 */

export function DetailOverviewSection({ page }) {
  const { vehicle, intelligenceCar, isFamilyOverviewMode, evSavariScores } =
    page;

  return (
    <>
      <DetailOverviewDashboard
        overview={page.overview}
        overviewSupplement={page.overviewSupplement}
        features={page.features}
        catalogMeta={vehicle.catalogMeta}
        catalogSource={vehicle.catalogSource}
        vehicle={intelligenceCar}
        familyOverviewMode={isFamilyOverviewMode}
        evSavariScores={evSavariScores}
      />
      <TrustDataStrip car={vehicle} variant="detail" />
      <p
        style={{
          fontSize: "0.85rem",
          color: "#64748b",
          lineHeight: 1.55,
          margin: "8px 0 0",
          maxWidth: 720,
        }}
      >
        {buildDetailOwnershipExpectation(vehicle)}
        {buildDetailTrustMaturityNote(vehicle) ? (
          <> {buildDetailTrustMaturityNote(vehicle)}</>
        ) : null}
      </p>
      {!isFamilyOverviewMode && page.detailMetrics ? (
        <DetailKeySpecifications metrics={page.detailMetrics} />
      ) : null}
    </>
  );
}

export function DetailVariantsSection({ page }) {
  return (
    <SectionErrorBoundary label="Variant comparison" compact>
      <Suspense
        fallback={
          <div aria-busy="true" aria-label="Loading variant comparison table">
            Loading variants…
          </div>
        }
      >
        <VariantComparisonTable
          ref={page.comparisonRef}
          embedded
          variants={page.enrichedVariants}
          selectedSlug={page.selectedVariantSlug}
          onSelect={page.handleSelectVariant}
          onCompareAll={() => scrollToDetailSection("compare")}
          onAddToCompare={page.handleCompareEv}
          onToggleCompare={page.toggleVariantCompare}
          compareList={page.compareList}
        />
      </Suspense>
    </SectionErrorBoundary>
  );
}

export function DetailCompareSection({ page }) {
  return (
    <SectionErrorBoundary label="Compare rivals" compact>
      <EvDetailGoldSections
        car={page.vehicle}
        slug={page.slug}
        layout="v2"
        embedded
        only={["compare-rivals"]}
      />
    </SectionErrorBoundary>
  );
}

export function DetailPeopleAlsoCompareSection({ page }) {
  const comparisons = page.peopleAlsoCompare?.comparisons || [];

  if (!comparisons.length) return null;

  return (
    <SectionErrorBoundary label="People also compare" compact>
      <PeopleAlsoCompareSection
        currentVehicle={page.intelligenceCar || page.vehicle}
        comparisons={comparisons}
        navigate={page.navigate}
      />
    </SectionErrorBoundary>
  );
}

export function DetailSimilarEvsSection({ page }) {
  const similarVehicles = page.similarEvs?.similarVehicles || [];

  if (!similarVehicles.length) return null;

  return (
    <SectionErrorBoundary label="Similar EVs" compact>
      <SimilarEvsSection similarVehicles={similarVehicles} />
    </SectionErrorBoundary>
  );
}

export function DetailPopularAmongSimilarBuyersSection({ page }) {
  const vehicles = page.popularAmongSimilarBuyers?.vehicles || [];

  if (!vehicles.length) return null;

  return (
    <SectionErrorBoundary label="Popular among similar buyers" compact>
      <PopularAmongSimilarBuyersSection vehicles={vehicles} />
    </SectionErrorBoundary>
  );
}

export function DetailRangeSection({ page }) {
  return (
    <SectionErrorBoundary label="Range intelligence" compact>
      <EvIntelligenceSections
        car={page.intelligenceCar}
        slug={page.slug}
        layout="v2"
        embedInParent
        showRangeConfidence={!page.isFamilyOverviewMode}
        sections={["range"]}
      />
    </SectionErrorBoundary>
  );
}

export function DetailChargingSection({ page }) {
  return (
    <SectionErrorBoundary label="Charging intelligence" compact>
      <EvIntelligenceSections
        car={page.intelligenceCar}
        slug={page.slug}
        layout="v2"
        embedInParent
        sections={["charging", "ownership"]}
      />
    </SectionErrorBoundary>
  );
}

export function DetailSuitabilitySection({ page }) {
  return (
    <SectionErrorBoundary label="EV suitability" compact>
      <EvIntelligenceSections
        car={page.intelligenceCar}
        slug={page.slug}
        layout="v2"
        embedInParent
        sections={["suitability"]}
      />
    </SectionErrorBoundary>
  );
}

export function DetailEmiSection({ page }) {
  return (
    <>
      <h2 className="cd-section__title">EMI</h2>
      <p className="cd-section__intro">
        Calculate EMI and check finance options in your city.
      </p>
      <div
        ref={page.emiSectionRef}
        className="detail-emi-section__inner"
        onFocusCapture={() =>
          page.trackPricingInteraction("emi_calculator")
        }
      >
        <SectionErrorBoundary label="EMI calculator" compact>
          <Suspense
            fallback={
              <p className="cd-section__intro" aria-busy="true">
                Loading EMI calculator…
              </p>
            }
          >
            <EMICalculator
              price={page.activePrice}
              onGetFinanceHelp={() => page.handleFinanceHelp("emi_widget")}
            />
          </Suspense>
        </SectionErrorBoundary>
      </div>
    </>
  );
}

export function DetailFaqsSection({ page }) {
  return (
    <SectionErrorBoundary label="FAQs" compact>
      <EvDetailGoldSections
        car={page.vehicle}
        slug={page.slug}
        layout="v2"
        embedded
        only={["faq"]}
      />
    </SectionErrorBoundary>
  );
}

export function DetailReviewsSection() {
  return (
    <>
      <h2 className="cd-section__title">Reviews</h2>
      <p className="cd-section__intro">
        See expert and user reviews across categories. Owner reviews and ratings
        for this model are being curated on EVSavari. Explore variant specs and
        compare rivals while we add verified owner feedback.
      </p>
    </>
  );
}

export function DetailRelatedEvsSection({ page }) {
  const { vehicle, familySlug, activePrice } = page;

  return (
    <DetailSeoDiscovery
      embedded
      familySlug={familySlug}
      vehicleName={vehicle.name}
      compareRivals={vehicle.catalogMeta?.compareRivals || []}
      brand={vehicle.brand}
      bodyType={vehicle.bodyType || vehicle.catalogMeta?.bodyType}
      priceInr={activePrice}
      evIntelligence={vehicle.evIntelligence}
      catalogMeta={vehicle.catalogMeta}
    />
  );
}

export function DetailAssistanceSection({ page }) {
  const openCallback = () => {
    trackLaunchDealerAssistance({
      sourcePage: "car_details",
      surface: "request_callback",
    });
    page.openInquiry("Request a callback", "Request callback");
  };

  const openBestDeal = () => {
    trackLaunchDealerAssistance({
      sourcePage: "car_details",
      surface: "get_best_deal",
    });
    page.openInquiry("Get the best deal", "Get best deal");
  };

  return (
    <DetailDealerAssistance
      embedded
      vehicle={page.vehicle}
      familySlug={page.familySlug}
      selectedVariantSlug={page.selectedVariantSlug}
      onRequestCallback={openCallback}
      onGetBestDeal={openBestDeal}
    />
  );
}
