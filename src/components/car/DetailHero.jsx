import VehicleImage from "../media/VehicleImage";
import DetailEmiTeaser from "../catalog/DetailEmiTeaser";
import DetailDealerTeaser from "./DetailDealerTeaser";
import DetailQuickSpecs from "./DetailQuickSpecs";
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
  activeCharging,
  fourthQuickSpec,
  category,
  galleryImages,
  selectedImage,
  selectedVariantSlug,
  safeDisplayImage,
  onSelectImage,
  onPriceClick,
  onScrollEmi,
  onScrollDealer,
  onScrollCharging,
}) {
  const subtitleParts = [];
  if (activeVariantLabel) subtitleParts.push(activeVariantLabel);
  if (variantCount > 1) subtitleParts.push(`${variantCount} variants`);
  if (familyMaxRange > 0) subtitleParts.push(`Up to ${familyMaxRange} km`);

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

        {galleryImages.length > 1 && (
          <div className="cd-hero__thumbs" role="list">
            {galleryImages.map((image, index) => {
              const safe = getSafeImage(image);
              const isActive = selectedImage === image;
              return (
                <button
                  key={index}
                  type="button"
                  role="listitem"
                  className={`cd-hero__thumb${isActive ? " cd-hero__thumb--active" : ""}`}
                  onClick={() => onSelectImage(image)}
                  aria-label={`View image ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <VehicleImage
                    car={vehicle}
                    src={safe}
                    role="gallery"
                    alt={`${vehicle.name} ${index + 1}`}
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

        <div className="cd-hero__teasers">
          <DetailEmiTeaser
            price={activePrice}
            onOpenCalculator={onScrollEmi}
            variant="card"
          />
          <DetailDealerTeaser onOpenDealer={onScrollDealer} />
        </div>

        <DetailQuickSpecs
          range={activeRange}
          battery={activeBattery}
          charging={activeCharging}
          fourthMetric={fourthQuickSpec}
          onScrollCharging={onScrollCharging}
        />
      </div>
    </section>
  );
}
