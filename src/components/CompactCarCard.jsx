import { Link } from "react-router-dom";

import CatalogListingSignals from "./catalog/CatalogListingSignals";

import CatalogCardTrust from "./catalog/CatalogCardTrust";

import { formatIndianPriceCompact } from "../utils/formatIndianPrice";

import { pickListingSignals } from "../utils/listingSignals";

import VehicleImage from "./media/VehicleImage";

import { vehicleDetailPath } from "../utils/vehicleRoutes";

import CatalogOwnershipChips from "./catalog/CatalogOwnershipChips";

import { pickOwnershipChips } from "../utils/ownershipReality";

/* =========================================================
   ================= COMPACT CAR CARD ======================
   ========================================================= */

export default function CompactCarCard({
  car,
  variant = "default",
  /** First compare column only — improves LCP without eager-loading every tile */
  eagerImage = false,
}) {
  const isCompare = variant === "compare";

  /* =====================================================
     NORMALIZED VALUES
     ===================================================== */

  const price =
    car.price ||
    car.startingPrice ||
    0;

  const range =
    car.range ||
    car.specifications?.range ||
    0;

  const battery =
    car.battery ||
    car.specifications?.batteryPack ||
    "EV";

  const listingSignals = pickListingSignals(
    car,
    2
  );

  const ownershipChips = pickOwnershipChips(
    car.catalogMeta,
    2
  );

  /* =====================================================
     SEO FRIENDLY URL
     ===================================================== */

  const carUrl = vehicleDetailPath(
    car,
    car._id
  );

  /* =====================================================
     ACCESSIBILITY LABEL
     ===================================================== */

  const ariaLabel =
    `View details for ${car.name}`;

  /* =====================================================
     RENDER
     ===================================================== */

  const articleClass = [
    isCompare ? "compact-car-card--compare" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleMouseEnter = isCompare
    ? undefined
    : (e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow =
          "0 28px 55px rgba(15,23,42,0.12)";
        e.currentTarget.style.border = "1px solid #bfdbfe";
        const img = e.currentTarget.querySelector(".compact-car-image");
        if (img) img.style.transform = "scale(1.06)";
      };

  const handleMouseLeave = isCompare
    ? undefined
    : (e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow =
          "0 10px 28px rgba(15,23,42,0.06)";
        e.currentTarget.style.border = "1px solid #e2e8f0";
        const img = e.currentTarget.querySelector(".compact-car-image");
        if (img) img.style.transform = "scale(1)";
      };

  return (
    <article
      className={articleClass || undefined}
      style={card}
      aria-label={car.name}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >

      {/* ================= IMAGE ================= */}

      <div style={imageWrapper}>
        <VehicleImage
          car={car}
          role="compare"
          alt={car.name}
          responsive
          eager={Boolean(eagerImage)}
          imgClassName="compact-car-image"
          imgStyle={image}
          wrapperStyle={{
            position: "absolute",
            inset: 0,
            height: "100%",
            aspectRatio: "unset",
          }}
        />

        {/* ================= OVERLAY ================= */}

        <div style={imageOverlay} />

        {/* ================= BADGE ================= */}

        {car.badge && (

          <div style={badge}>
            {car.badge}
          </div>
        )}

        {listingSignals.length > 0 && !isCompare && (
          <div style={signalsOverlay}>
            <CatalogListingSignals
              signals={listingSignals}
            />
          </div>
        )}

      </div>

      {/* ================= CONTENT ================= */}

      <div
        className={
          isCompare ? "compact-car-card__content" : undefined
        }
        style={content}
      >
        <div
          className={
            isCompare ? "compact-car-card__top" : undefined
          }
          style={topContent}
        >

          <h3
            className={
              isCompare ? "compact-car-card__title" : undefined
            }
            style={title}
          >
            {car.name}
          </h3>

          <p
            className={
              isCompare ? "compact-car-card__price" : undefined
            }
            style={priceStyle}
          >
            {formatIndianPriceCompact(price)}
          </p>

          {!isCompare && (
            <CatalogCardTrust
              catalogMeta={car.catalogMeta}
              catalogSource={car.catalogSource}
            />
          )}

          {!isCompare && (
            <CatalogOwnershipChips chips={ownershipChips} />
          )}

          <div
            className={
              isCompare ? "compact-car-card__specs" : undefined
            }
            style={specRow}
          >
            <span
              className={
                isCompare ? "compact-car-card__spec" : undefined
              }
              style={specItem}
            >
              ⚡ {range} km
            </span>

            <span
              className={
                isCompare ? "compact-car-card__spec" : undefined
              }
              style={specItem}
            >
              🔋 {battery}
            </span>
          </div>
        </div>

        {!isCompare && (
          <Link
            to={carUrl}
            aria-label={ariaLabel}
            style={{
              textDecoration: "none",
              display: "flex",
            }}
          >
            <button style={button}>View Details</button>
          </Link>
        )}
      </div>

    </article>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const card = {
  background: "white",

  borderRadius: "26px",

  overflow: "hidden",

  border: "1px solid #e2e8f0",

  boxShadow:
    "0 10px 28px rgba(15,23,42,0.06)",

  transition:
    "all 0.32s ease",

  display: "flex",

  flexDirection: "column",

  position: "relative",

  minHeight: "100%",

  width: "100%",

  boxSizing: "border-box",

  willChange:
    "transform, box-shadow",
};

const imageWrapper = {
  position: "relative",

  overflow: "hidden",

  background:
    "linear-gradient(135deg, #e2e8f0, #f8fafc)",

  aspectRatio: "16 / 10",
};

const image = {
  width: "100%",

  height: "100%",

  objectFit: "cover",

  display: "block",

  transition:
    "transform 0.55s ease",

  backfaceVisibility:
    "hidden",
};

const imageOverlay = {
  position: "absolute",

  inset: 0,

  background:
    "linear-gradient(to top, rgba(15,23,42,0.24), transparent 60%)",

  pointerEvents: "none",
};

const signalsOverlay = {
  position: "absolute",
  bottom: "12px",
  left: "12px",
  right: "12px",
  zIndex: 10,
  pointerEvents: "none",
};

const badge = {
  position: "absolute",

  top: "16px",

  left: "16px",

  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  color: "white",

  padding: "8px 14px",

  borderRadius: "999px",

  fontSize: "11px",

  fontWeight: "700",

  letterSpacing: "0.4px",

  boxShadow:
    "0 10px 24px rgba(37,99,235,0.26)",

  zIndex: 10,

  backdropFilter:
    "blur(8px)",
};

const content = {
  padding:
    "clamp(18px, 2vw, 24px)",

  display: "flex",

  flexDirection: "column",

  justifyContent:
    "space-between",

  flex: 1,

  gap: "22px",

  boxSizing: "border-box",
};

const topContent = {
  display: "flex",

  flexDirection: "column",

  gap: "16px",
};

const title = {
  fontSize:
    "clamp(19px, 2vw, 22px)",

  fontWeight: "800",

  color: "#0f172a",

  margin: 0,

  lineHeight: "1.3",

  letterSpacing: "-0.4px",
};

const priceStyle = {
  fontSize:
    "clamp(24px, 3vw, 30px)",

  fontWeight: "800",

  color: "#2563eb",

  margin: 0,

  letterSpacing: "-0.6px",
};

const specRow = {
  display: "flex",

  gap: "12px",

  flexWrap: "wrap",
};

const specItem = {
  background: "#f8fafc",

  padding: "10px 14px",

  borderRadius: "14px",

  fontSize: "12px",

  fontWeight: "700",

  color: "#0f172a",

  border:
    "1px solid #e2e8f0",

  lineHeight: "1.4",
};

const button = {
  width: "100%",

  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  color: "white",

  border: "none",

  padding: "14px 16px",

  borderRadius: "16px",

  cursor: "pointer",

  fontWeight: "700",

  fontSize: "14px",

  transition:
    "all 0.28s ease",

  boxShadow:
    "0 10px 24px rgba(37,99,235,0.18)",

  minHeight: "52px",
};