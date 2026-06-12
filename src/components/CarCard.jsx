import {
  useState,
} from "react";

import { Link } from "react-router-dom";

import LeadInquiryModal from "./LeadInquiryModal";
import WhatsAppLeadCta from "./leads/WhatsAppLeadCta";

import CatalogListingSignals from "./catalog/CatalogListingSignals";

import CatalogCardTrust from "./catalog/CatalogCardTrust";

import { formatIndianPriceCompact } from "../utils/formatIndianPrice";

import { pickListingSignals } from "../utils/listingSignals";

import VehicleImage from "./media/VehicleImage";

import { vehicleDetailPath } from "../utils/vehicleRoutes";

import CatalogOwnershipChips from "./catalog/CatalogOwnershipChips";

import CatalogScoreBadge from "./catalog/CatalogScoreBadge";

import { pickOwnershipChips } from "../utils/ownershipReality";

import { pickListingCardSpecChips } from "../utils/listingCardSpecs";

import "../styles/car-card-compare.css";
import "../styles/catalog-ux-wave-b.css";

import { isCarInCompareList } from "../utils/compareCarsStorage";

/* =========================================================
   ====================== CAR CARD ==========================
   ========================================================= */

export default function CarCard({
  car,
  compareList = [],
  toggleCompare = () => {},
  compareModeActive = false,
  eagerImage = false,
  showValueScore = false,
}) {
  /* =======================================================
     ================= SAFETY FALLBACKS ====================
     ======================================================= */

  const safeCar = car || {};

  const {
    _id,
    name,
    brand,
    image,
    price,
  } = safeCar;

  const isCompared = isCarInCompareList(
    compareList,
    safeCar.defaultVariant || safeCar
  );

  const listingSignals = pickListingSignals(
    safeCar,
    2
  );

  const ownershipChips = pickOwnershipChips(
    safeCar.catalogMeta,
    2
  );

  const specChips = pickListingCardSpecChips(safeCar);

  const safeName =
    name || "Electric Vehicle";

  const safeBrand =
    brand || "EV";

  const safePrice =
    typeof price === "number"
      ? price
      : 0;

  const carSlug =
    safeCar.slug;

  const detailPath = vehicleDetailPath(
    safeCar,
    _id
  );

  const [inquiryOpen,
    setInquiryOpen] =
    useState(false);

  const [inquiryHeadline,
    setInquiryHeadline] =
    useState(
      "Request a callback"
    );

  const [inquirySubmit,
    setInquirySubmit] =
    useState(
      "Request callback"
    );

  const openInquiry = (
    headline,
    submit
  ) => {

    setInquiryHeadline(
      headline
    );

    setInquirySubmit(
      submit
    );

    setInquiryOpen(
      true
    );
  };

  return (
    <>
    <div
      style={card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform =
          "translateY(-10px)";

        e.currentTarget.style.boxShadow =
          "0 30px 60px rgba(15,23,42,0.14)";

        e.currentTarget.style.border =
          "1px solid #bfdbfe";

        const image =
          e.currentTarget.querySelector(
            ".car-image"
          );

        if (image) {
          image.style.transform =
            "scale(1.06)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform =
          "translateY(0px)";

        e.currentTarget.style.boxShadow =
          "0 14px 40px rgba(15,23,42,0.08)";

        e.currentTarget.style.border =
          "1px solid #e2e8f0";

        const image =
          e.currentTarget.querySelector(
            ".car-image"
          );

        if (image) {
          image.style.transform =
            "scale(1)";
        }
      }}
    >
      {/* ================= CAR IMAGE ================= */}

      <div style={imageWrapper}>
        <VehicleImage
          car={safeCar}
          role="listing"
          alt={safeName}
          responsive
          eager={eagerImage}
          imgClassName="car-image"
          imgStyle={imageStyle}
          wrapperStyle={{
            position: "absolute",
            inset: 0,
            height: "100%",
            aspectRatio: "unset",
          }}
        />

        <div style={imageOverlay} />

        {listingSignals.length > 0 && (
          <div style={signalsOverlay}>
            <CatalogListingSignals
              signals={listingSignals}
            />
          </div>
        )}

        <div style={brandBadge}>
          {safeBrand}
        </div>
      </div>

      {/* ================= CARD CONTENT ================= */}

      <div style={content}>
        {/* ================= TOP CONTENT ================= */}

        <div style={topContent}>
          <h3 style={title}>
            {safeName}
          </h3>

          <p style={priceStyle}>
            {formatIndianPriceCompact(safePrice)}
          </p>

          <div className="car-card__score-row">
            <CatalogScoreBadge
              vehicle={safeCar}
              showValueScore={showValueScore}
            />
          </div>

          <CatalogCardTrust
            catalogMeta={safeCar.catalogMeta}
            catalogSource={safeCar.catalogSource}
          />

          <CatalogOwnershipChips chips={ownershipChips} />

          {/* ================= SPECS ================= */}

          <div style={specRow}>
            {specChips.rangeLabel ? (
              <span style={specItem}>
                ⚡ {specChips.rangeLabel}
              </span>
            ) : null}

            {specChips.batteryLabel ? (
              <span style={specItem}>
                🔋 {specChips.batteryLabel}
              </span>
            ) : null}

            {specChips.chargingLabel ? (
              <span style={specItem}>
                🔌 {specChips.chargingLabel}
              </span>
            ) : null}
          </div>
        </div>

        {/* ================= ACTION BUTTONS ================= */}

        <div style={buttonContainer}>
          <Link
            to={detailPath}
            style={{
              textDecoration: "none",
              flex: 1,
              display: "flex",
            }}
          >
            <button
              style={primaryButton}
            >
              View Details
            </button>
          </Link>

          {compareModeActive ? (
            <button
              type="button"
              className={[
                "car-card__compare-btn",
                isCompared
                  ? "car-card__compare-btn--selected"
                  : "",
                compareModeActive && !isCompared
                  ? "car-card__compare-btn--hint"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={secondaryButton}
              onClick={() =>
                toggleCompare(
                  safeCar.defaultVariant ||
                    safeCar
                )
              }
            >
              {isCompared ? "✓ Comparing" : "Compare"}
            </button>
          ) : null}
        </div>

        <div style={leadRow}>
          <button
            type="button"
            style={ctaOutline}
            onClick={() =>
              openInquiry(
                "Request a callback",
                "Request callback"
              )
            }
          >
            Callback
          </button>

          <button
            type="button"
            style={ctaOutline}
            onClick={() =>
              openInquiry(
                "Get the best deal",
                "Get best deal"
              )
            }
          >
            Best deal
          </button>
        </div>

        <div style={waRow}>
          <WhatsAppLeadCta
            vehicleName={`${safeBrand} ${safeName}`}
            vehicleSlug={carSlug || ""}
            sourcePage="listing_card"
            intent="inquiry"
            label="WhatsApp"
            variant="secondary"
            style={waBtnCompact}
          />
        </div>
      </div>
    </div>

      <LeadInquiryModal
        isOpen={inquiryOpen}
        onClose={() =>
          setInquiryOpen(
            false
          )
        }
        sourcePage="listing_card"
        modelName={`${safeBrand} ${safeName}`.trim()}
        vehicleName={`${safeBrand} ${safeName}`.trim()}
        vehicleId={
          String(
            carSlug || _id || ""
          )
        }
        mongoCarId={
          _id
            ? String(_id)
            : ""
        }
        headline={inquiryHeadline}
        submitLabel={inquirySubmit}
      />
    </>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const card = {
  background: "white",
  borderRadius: "22px",
  overflow: "hidden",
  boxShadow:
    "0 12px 32px rgba(15,23,42,0.07)",
  transition: "all 0.35s ease",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  border: "1px solid #e2e8f0",
  position: "relative",
  minHeight: "100%",
};

const imageWrapper = {
  position: "relative",
  overflow: "hidden",
  aspectRatio: "16 / 8",
};

const imageStyle = {
  transition: "transform 0.55s ease",
};

const imageOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(15,23,42,0.28), transparent 55%)",
  pointerEvents: "none",
};

const signalsOverlay = {
  position: "absolute",
  bottom: "14px",
  left: "14px",
  right: "14px",
  zIndex: 2,
  pointerEvents: "none",
};

const brandBadge = {
  position: "absolute",
  top: "18px",
  left: "18px",
  background:
    "rgba(15, 23, 42, 0.82)",
  color: "white",
  padding: "8px 14px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
  backdropFilter: "blur(10px)",
  letterSpacing: "0.4px",
  boxShadow:
    "0 10px 24px rgba(0,0,0,0.16)",
  zIndex: 2,
};

const content = {
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  flex: 1,
  gap: "16px",
};

const topContent = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const title = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#0f172a",
  margin: 0,
  lineHeight: "1.25",
  letterSpacing: "-0.5px",
};

const priceStyle = {
  fontSize: "26px",
  fontWeight: "800",
  color: "#2563eb",
  margin: 0,
  letterSpacing: "-0.8px",
};

const specRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const specItem = {
  background: "#f8fafc",
  padding: "6px 10px",
  borderRadius: "10px",
  fontSize: "11px",
  fontWeight: "700",
  color: "#0f172a",
  border: "1px solid #e2e8f0",
  lineHeight: "1.4",
};

const buttonContainer = {
  display: "flex",
  gap: "12px",
  alignItems: "stretch",
};

const leadRow = {
  display: "flex",
  gap: "8px",
  marginTop: "6px",
};

const waRow = {
  marginTop: "6px",
};

const waBtnCompact = {
  padding: "0.5rem 0.75rem",
  fontSize: "0.85rem",
  width: "100%",
};

const ctaOutline = {
  flex: 1,
  padding: "10px 8px",
  borderRadius: "12px",
  border:
    "1px solid #bfdbfe",
  background: "#f8fafc",
  color: "#1d4ed8",
  fontWeight: "700",
  fontSize: "12px",
  cursor: "pointer",
  minHeight: "40px",
};

const primaryButton = {
  width: "100%",
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  padding: "11px 14px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
  transition: "all 0.28s ease",
  boxShadow:
    "0 8px 20px rgba(37,99,235,0.2)",
  minHeight: "42px",
};

const secondaryButton = {
  color: "white",
  border: "none",
  padding: "11px 14px",
  borderRadius: "14px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
  transition: "all 0.28s ease",
  minWidth: "112px",
  minHeight: "42px",
};
