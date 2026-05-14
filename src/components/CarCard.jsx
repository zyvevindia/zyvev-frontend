import {
  useState,
} from "react";

import { Link } from "react-router-dom";

import LeadInquiryModal from "./LeadInquiryModal";

/* =========================================================
   ====================== CAR CARD ==========================
   ========================================================= */

export default function CarCard({
  car,
  compareList = [],
  toggleCompare = () => {},
  compareModeActive = false,
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
    range,
    battery,
  } = safeCar;

  const isCompared =
    Array.isArray(compareList) &&
    compareList.find(
      (c) => c?._id === _id
    );

  const fallbackImage =
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop";

  const safeImage =
    image || fallbackImage;

  const safeName =
    name || "Electric Vehicle";

  const safeBrand =
    brand || "EV";

  const safePrice =
    typeof price === "number"
      ? price
      : 0;

  const safeRange =
    range || "N/A";

  const safeBattery =
    battery || "Battery";

  const carSlug =
    safeCar.slug;

  const detailPath =
    carSlug
      ? `/car/${carSlug}`
      : `/car/${_id}`;

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
        <img
          className="car-image"
          src={safeImage}
          alt={safeName}
          style={imageStyle}
          onError={(e) => {
            e.target.src =
              fallbackImage;
          }}
        />

        {/* ================= IMAGE OVERLAY ================= */}

        <div style={imageOverlay} />

        {/* ================= BRAND BADGE ================= */}

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
            ₹
            {safePrice.toLocaleString()}
          </p>

          {/* ================= SPECS ================= */}

          <div style={specRow}>
            <div style={specBox}>
              <span style={specLabel}>
                Range
              </span>

              <span style={specValue}>
                ⚡ {safeRange} km
              </span>
            </div>

            <div style={specBox}>
              <span style={specLabel}>
                Battery
              </span>

              <span style={specValue}>
                🔋 {safeBattery}
              </span>
            </div>
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

          <button
            type="button"
            style={{
              ...secondaryButton,
              background: isCompared
                ? "#f59e0b"
                : "#111827",
              ...(compareModeActive &&
              !isCompared
                ? {
                    boxShadow:
                      "0 0 0 3px rgba(96,165,250,0.75)",
                  }
                : {}),
            }}
            onClick={() =>
              toggleCompare(safeCar)
            }
          >
            {isCompared
              ? "Remove"
              : "Compare"}
          </button>
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
        vehicleName={`${safeBrand} ${safeName}`}
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
  borderRadius: "28px",
  overflow: "hidden",
  boxShadow:
    "0 14px 40px rgba(15,23,42,0.08)",
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
  background:
    "linear-gradient(135deg, #e2e8f0, #f8fafc)",
  aspectRatio: "16 / 10",
};

const imageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
  transition: "transform 0.55s ease",
};

const imageOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(15,23,42,0.28), transparent 55%)",
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
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  flex: 1,
  gap: "24px",
};

const topContent = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const title = {
  fontSize: "23px",
  fontWeight: "800",
  color: "#0f172a",
  margin: 0,
  lineHeight: "1.25",
  letterSpacing: "-0.5px",
};

const priceStyle = {
  fontSize: "30px",
  fontWeight: "800",
  color: "#2563eb",
  margin: 0,
  letterSpacing: "-0.8px",
};

const specRow = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const specBox = {
  background: "#f8fafc",
  borderRadius: "16px",
  padding: "14px",
  display: "flex",
  flexDirection: "column",
  border: "1px solid #e2e8f0",
  minHeight: "78px",
  justifyContent: "center",
};

const specLabel = {
  fontSize: "11px",
  color: "#64748b",
  marginBottom: "8px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

const specValue = {
  fontWeight: "700",
  color: "#0f172a",
  fontSize: "15px",
  lineHeight: "1.4",
};

const buttonContainer = {
  display: "flex",
  gap: "12px",
  alignItems: "stretch",
};

const leadRow = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

const ctaOutline = {
  flex: 1,
  padding: "12px 10px",
  borderRadius: "14px",
  border:
    "1px solid #bfdbfe",
  background: "#f8fafc",
  color: "#1d4ed8",
  fontWeight: "700",
  fontSize: "13px",
  cursor: "pointer",
  minHeight: "46px",
};

const primaryButton = {
  width: "100%",
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  border: "none",
  padding: "14px 18px",
  borderRadius: "16px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  transition: "all 0.28s ease",
  boxShadow:
    "0 10px 24px rgba(37,99,235,0.22)",
  minHeight: "52px",
};

const secondaryButton = {
  color: "white",
  border: "none",
  padding: "14px 18px",
  borderRadius: "16px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  transition: "all 0.28s ease",
  minWidth: "124px",
  minHeight: "52px",
};