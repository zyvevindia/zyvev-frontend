import { Link } from "react-router-dom";

import { formatIndianPrice } from "../utils/formatIndianPrice";

import { vehicleDetailPath } from "../utils/vehicleRoutes";

import { LOCAL_FALLBACK_EV } from "../utils/imageUtils";
import { getListingImage } from "../utils/vehicleMedia";

/* =========================================================
   ================ UPCOMING CAR CARD ======================
   ========================================================= */

export default function UpcomingCarCard({
  car,
}) {

  /* =====================================================
     NORMALIZED VALUES
     ===================================================== */

  const imageUrl = getListingImage(car) || LOCAL_FALLBACK_EV;

  const price =
    car.price ||
    car.startingPrice ||
    0;

  /* =====================================================
     SEO FRIENDLY URL
     ===================================================== */

  const carUrl = vehicleDetailPath(
    car,
    car._id
  );

  return (
    <div
      style={card}

      onMouseEnter={(e) => {

        e.currentTarget.style.transform =
          "translateY(-8px)";

        e.currentTarget.style.boxShadow =
          "0 28px 55px rgba(15,23,42,0.12)";

        e.currentTarget.style.border =
          "1px solid #fde68a";

        const image =
          e.currentTarget.querySelector(
            ".upcoming-car-image"
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
          "0 10px 28px rgba(15,23,42,0.06)";

        e.currentTarget.style.border =
          "1px solid #e2e8f0";

        const image =
          e.currentTarget.querySelector(
            ".upcoming-car-image"
          );

        if (image) {

          image.style.transform =
            "scale(1)";
        }
      }}
    >

      {/* ================= IMAGE ================= */}

      <div style={imageWrapper}>

        <img
          className="upcoming-car-image"
          src={imageUrl}
          alt={car.name}
          style={image}
          onError={(e) => {
            if (e.currentTarget.src !== LOCAL_FALLBACK_EV) {
              e.currentTarget.src = LOCAL_FALLBACK_EV;
            }
          }}
        />

        {/* ================= IMAGE OVERLAY ================= */}

        <div style={imageOverlay} />

        {/* ================= UPCOMING BADGE ================= */}

        <div style={badge}>
          Upcoming
        </div>

      </div>

      {/* ================= CONTENT ================= */}

      <div style={content}>

        {/* ================= TOP CONTENT ================= */}

        <div style={topContent}>

          <h3 style={title}>
            {car.name}
          </h3>

          {/* ================= INFO GRID ================= */}

          <div style={infoGrid}>

            {/* ================= LAUNCH ================= */}

            <div style={infoCard}>

              <p style={label}>
                Expected Launch
              </p>

              <p style={launchDate}>
                {car.launchDate ||
                  "Coming Soon"}
              </p>

            </div>

            {/* ================= PRICE ================= */}

            <div style={infoCard}>

              <p style={label}>
                Expected Price
              </p>

              <p style={priceStyle}>
                {formatIndianPrice(price, {
                  prefix: "From ",
                })}
              </p>

            </div>

          </div>

        </div>

        {/* ================= ACTION ================= */}

        <Link
          to={carUrl}
          style={{
            textDecoration: "none",
            display: "flex",
          }}
        >

          <button style={notifyButton}>
            View Details
          </button>

        </Link>

      </div>

    </div>
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
  transition: "all 0.32s ease",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  minHeight: "100%",
  width: "100%",
  boxSizing: "border-box",
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
  transition: "transform 0.55s ease",
};

const imageOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(15,23,42,0.28), transparent 60%)",
  pointerEvents: "none",
};

const badge = {
  position: "absolute",
  top: "16px",
  left: "16px",
  background:
    "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "white",
  padding: "8px 14px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.4px",
  boxShadow:
    "0 10px 24px rgba(245,158,11,0.28)",
  zIndex: 10,
  backdropFilter: "blur(8px)",
};

const content = {
  padding: "22px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  flex: 1,
  gap: "22px",
  boxSizing: "border-box",
};

const topContent = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const title = {
  fontSize: "22px",
  fontWeight: "800",
  color: "#0f172a",
  margin: 0,
  lineHeight: "1.3",
  letterSpacing: "-0.5px",
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const infoCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px",
  minHeight: "86px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const label = {
  fontSize: "11px",
  color: "#64748b",
  margin: 0,
  marginBottom: "8px",
  fontWeight: "700",
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

const launchDate = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#0f172a",
  margin: 0,
  lineHeight: "1.4",
};

const priceStyle = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#2563eb",
  margin: 0,
  lineHeight: "1.4",
  letterSpacing: "-0.5px",
};

const notifyButton = {
  width: "100%",
  background:
    "linear-gradient(135deg, #0f172a, #1e293b)",
  color: "white",
  border: "none",
  padding: "14px 16px",
  borderRadius: "16px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
  transition: "all 0.28s ease",
  boxShadow:
    "0 10px 24px rgba(15,23,42,0.18)",
  minHeight: "52px",
};