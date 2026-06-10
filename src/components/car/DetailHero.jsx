import VehicleImage from "../media/VehicleImage";
import DetailEmiTeaser from "../catalog/DetailEmiTeaser";
import DetailDealerTeaser from "./DetailDealerTeaser";
import DetailQuickSpecs from "./DetailQuickSpecs";
import DetailFamilyHeroMetrics from "./DetailFamilyHeroMetrics";
import { formatIndianPrice } from "../../utils/formatIndianPrice";
import { getSafeImage } from "../../utils/imageUtils";

export default function DetailHero({
  vehicle,
  familyTitle,
  activeVariantLabel,
  variantCount,
  familyMaxRange,
  activePrice,
  activeRange,
  activeBattery,
  chargingSummary,
  fourthQuickSpec,
  category,
  galleryItems = [],
  galleryImages: galleryImagesProp,
  selectedImage,
  selectedVariantSlug,
  safeDisplayImage,
  onSelectImage,
  onPriceClick,
  onScrollEmi,
  onScrollDealer,
  onScrollCharging,
  familyOverviewMode = false,
  familyMetrics = null,
}) {
  const galleryItemsResolved = (
    galleryItems.length > 0
      ? galleryItems
      : (galleryImagesProp || [])
          .map((src) => (src ? { src, imageType: null } : null))
          .filter(Boolean)
  );

  const subtitleParts = [];
  if (!familyOverviewMode && activeVariantLabel) {
    subtitleParts.push(activeVariantLabel);
  }
  if (variantCount > 1) {
    subtitleParts.push(
      familyOverviewMode
        ? `${variantCount} Variants`
        : `${variantCount} variants`
    );
  }
  if (!familyOverviewMode && familyMaxRange > 0) {
    subtitleParts.push(`Up to ${familyMaxRange} km`);
  }

  const emiPrice =
    familyOverviewMode && familyMetrics?.minPrice
      ? familyMetrics.minPrice
      : activePrice;

  return (
    <section className="cd-hero cd-card" aria-label="Vehicle overview">
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
        <span className="cd-hero__badge">
          {category || "Electric Vehicle"}
        </span>

        <h1 className="cd-hero__title">{familyTitle}</h1>

        {subtitleParts.length > 0 && (
          <p className="cd-hero__subtitle">
            {subtitleParts.join(" · ")}
          </p>
        )}

        {familyOverviewMode && familyMetrics ? (
          <DetailFamilyHeroMetrics
            metrics={familyMetrics}
            onScrollCharging={onScrollCharging}
          />
        ) : (
          <>
            <p
              className="cd-hero__price detail-hero-price"
              role="button"
              tabIndex={0}
              onClick={onPriceClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onPriceClick();
              }}
            >
              {formatIndianPrice(activePrice)}
              <span className="cd-hero__price-note">Ex-showroom</span>
            </p>

            <DetailQuickSpecs
              range={activeRange}
              battery={activeBattery}
              chargingSummary={chargingSummary}
              fourthMetric={fourthQuickSpec}
              onScrollCharging={onScrollCharging}
            />
          </>
        )}

        <div className="cd-hero__teasers">
          <DetailEmiTeaser
            price={emiPrice}
            onOpenCalculator={onScrollEmi}
            variant="card"
          />
          <DetailDealerTeaser onOpenDealer={onScrollDealer} />
        </div>
      </div>
    </section>
  );
}
