import { Link } from "react-router-dom";

/* =========================================================
   ====================== CAR CARD ==========================
   ========================================================= */

export default function CarCard({
  car,
  compareList,
  toggleCompare,
}) {
  const isCompared = compareList.find(
    (c) => c._id === car._id
  );

  return (
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
          src={car.image}
          alt={car.name}
          style={image}
        />

        {/* ================= IMAGE OVERLAY ================= */}

        <div style={imageOverlay} />

        {/* ================= BRAND BADGE ================= */}

        <div style={brandBadge}>
          {car.brand}
        </div>
      </div>

      {/* ================= CARD CONTENT ================= */}

      <div style={content}>
        {/* ================= TOP CONTENT ================= */}

        <div style={topContent}>
          <h3 style={title}>
            {car.name}
          </h3>

          <p style={price}>
            ₹
            {car.price.toLocaleString()}
          </p>

          {/* ================= SPECS ================= */}

          <div style={specRow}>
            <div style={specBox}>
              <span style={specLabel}>
                Range
              </span>

              <span style={specValue}>
                ⚡ {car.range} km
              </span>
            </div>

            <div style={specBox}>
              <span style={specLabel}>
                Battery
              </span>

              <span style={specValue}>
                🔋 {car.battery}
              </span>
            </div>
          </div>
        </div>

        {/* ================= ACTION BUTTONS ================= */}

        <div style={buttonContainer}>
          <Link
            to={`/car/${car._id}`}
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
            style={{
              ...secondaryButton,
              background: isCompared
                ? "#f59e0b"
                : "#111827",
            }}
            onClick={() =>
              toggleCompare(car)
            }
          >
            {isCompared
              ? "Remove"
              : "Compare"}
          </button>
        </div>
      </div>
    </div>
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

const price = {
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