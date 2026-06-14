import VehicleImage from "../media/VehicleImage";
import DetailEmiTeaser from "../catalog/DetailEmiTeaser";
import DetailDealerTeaser from "./DetailDealerTeaser";
import HeroSummary from "./HeroSummary";
import EvSavariVerdictHeader from "./EvSavariVerdictHeader";
import LeadGenerationCtaStrip from "./LeadGenerationCtaStrip";
import PersonaBestForHero from "./PersonaBestForHero";
import UnifiedEvIntelligenceSection from "./UnifiedEvIntelligenceSection";
import { vehicleHasUnifiedEvIntelligence } from "../../intelligence/unifiedEvIntelligenceVisibility.js";
import { getSafeImage } from "../../utils/imageUtils";
import { scrollToDetailSection } from "../../utils/detailPageNav.js";

function resolveVerifiedBadge(vehicle) {
  const meta = vehicle?.catalogMeta;
  if (!meta) return false;

  if (meta.governanceStatus === "published") {
    return true;
  }

  const score = meta.dataQualityScore;
  return (
    vehicle?.catalogSource === "master" &&
    score != null &&
    score >= 85
  );
}

export default function DetailHero({
  vehicle,
  familyTitle,
  activeVariantLabel,
  variantCount,
  heroSummary = null,
  evSavariVerdict = null,
  intelligenceVehicle = null,
  familyOverviewMode = false,
  evSavariScores = null,
  category,
  galleryItems = [],
  galleryImages: galleryImagesProp,
  selectedImage,
  selectedVariantSlug,
  safeDisplayImage,
  onSelectImage,
  onScrollEmi,
  onScrollDealer,
  onBookTestDrive = () => {},
  onGetBestDeal = () => {},
  onRequestCallback = () => {},
  onGetDealerAssistance = () => {},
  onCompare = () => {},
}) {
  const galleryItemsResolved = (
    galleryItems.length > 0
      ? galleryItems
      : (galleryImagesProp || [])
          .map((src) => (src ? { src, imageType: null } : null))
          .filter(Boolean)
  );

  const subtitleParts = [];
  if (category && category !== "Electric Vehicle") {
    subtitleParts.push(category);
  }
  if (activeVariantLabel) {
    subtitleParts.push(activeVariantLabel);
  }
  if (variantCount > 1 && !heroSummary) {
    subtitleParts.push(`${variantCount} variants`);
  }

  const emiPrice =
    heroSummary?.minPriceInr ||
    vehicle?.startingPrice ||
    vehicle?.price ||
    0;

  const resolvedVariantCount =
    heroSummary?.variantCount || variantCount || 0;
  const showVerified = resolveVerifiedBadge(vehicle);
  const intelVehicle = intelligenceVehicle || vehicle;
  const showIntelligence =
    !familyOverviewMode &&
    intelVehicle &&
    vehicleHasUnifiedEvIntelligence(intelVehicle, evSavariScores);

  function handleExploreVariants() {
    scrollToDetailSection("variants");
  }

  return (
    <section className="cd-hero cd-card" aria-label="Vehicle overview">
      <div className="cd-hero__grid">
        <div className="cd-hero__media">
          <div className="cd-hero__frame">
            <div
              key={selectedVariantSlug}
              className="detail-hero-image-wrap"
            >
              <VehicleImage
                car={vehicle}
                src={safeDisplayImage}
                role="hero"
                alt={vehicle.name}
                eager
                responsive
                imgStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "unset",
                }}
              />
            </div>
          </div>

          {galleryItemsResolved.length > 1 && (
            <div className="cd-hero__thumbs" role="list">
              {galleryItemsResolved.map((item, index) => {
                const safe = getSafeImage(item.src);
                if (!safe) return null;
                const isActive = selectedImage === item.src;
                return (
                  <button
                    key={item.imageType || `${item.src}-${index}`}
                    type="button"
                    role="listitem"
                    className={`cd-hero__thumb${isActive ? " cd-hero__thumb--active" : ""}`}
                    onClick={() => onSelectImage(item.src)}
                    aria-label={`View ${item.imageType || "image"} ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <VehicleImage
                      car={vehicle}
                      src={safe}
                      role="gallery"
                      imageType={item.imageType || undefined}
                      alt={`${vehicle.name} ${item.imageType || index + 1}`}
                      imgStyle={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      wrapperStyle={{
                        width: "100%",
                        height: "100%",
                        aspectRatio: "unset",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}

        </div>

        <div className="cd-hero__info">
          <div className="cd-hero__head">
            <div className="cd-hero__title-row">
              <h1 className="cd-hero__title">{familyTitle}</h1>
              {showVerified ? (
                <span className="cd-hero__verified-badge">
                  Verified
                </span>
              ) : null}
            </div>

            {subtitleParts.length > 0 && (
              <p className="cd-hero__subtitle">
                {subtitleParts.join(" · ")}
              </p>
            )}
          </div>

          <HeroSummary summary={heroSummary} />

          {resolvedVariantCount > 0 ? (
            <div className="cd-hero__cta-row">
              <button
                type="button"
                className="cd-hero__explore-btn"
                onClick={handleExploreVariants}
              >
                Explore {resolvedVariantCount} Variant
                {resolvedVariantCount === 1 ? "" : "s"} ↓
              </button>
              <button
                type="button"
                className="cd-hero__compare-btn"
                onClick={onCompare}
              >
                Add to Compare
              </button>
            </div>
          ) : null}

          {resolvedVariantCount > 0 ? (
            <p className="cd-hero__scroll-hint">
              <span aria-hidden>✓</span>
              Scroll down to see all variants and compare
            </p>
          ) : null}

          <LeadGenerationCtaStrip
            onBookTestDrive={onBookTestDrive}
            onGetBestDeal={onGetBestDeal}
            onRequestCallback={onRequestCallback}
            onGetDealerAssistance={onGetDealerAssistance}
          />

          <PersonaBestForHero vehicle={intelVehicle} />

          <EvSavariVerdictHeader verdict={evSavariVerdict} />

          <div className="cd-hero__teasers">
            <DetailEmiTeaser
              price={emiPrice}
              onOpenCalculator={onScrollEmi}
              variant="card"
            />
            <DetailDealerTeaser onOpenDealer={onScrollDealer} />
          </div>
        </div>

        {showIntelligence ? (
          <div className="cd-hero__intelligence">
            <UnifiedEvIntelligenceSection
              vehicle={intelVehicle}
              layout="hero"
              evSavariScores={evSavariScores}
              catalogMeta={intelVehicle?.catalogMeta}
              familyOverviewMode={familyOverviewMode}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
