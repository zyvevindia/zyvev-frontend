export default function CarCardSkeleton() {

  return (

    <div style={card}>

      {/* ================= IMAGE ================= */}

      <div style={imageSkeleton} />

      {/* ================= CONTENT ================= */}

      <div style={content}>

        <div style={titleSkeleton} />

        <div style={priceSkeleton} />

        <div style={specRow}>

          <div style={specSkeleton} />

          <div style={specSkeleton} />

          <div style={specSkeleton} />

        </div>

        <div style={buttonRow}>

          <div style={buttonSkeleton} />

          <div style={buttonSkeletonDark} />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const shimmer = {
  background:
    "linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%)",

  backgroundSize:
    "200% 100%",

  animation:
    "skeleton-loading 1.5s infinite linear",
};

const card = {
  background: "white",
  borderRadius: "30px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow:
    "0 18px 40px rgba(15,23,42,0.06)",
};

const imageSkeleton = {
  ...shimmer,

  width: "100%",
  aspectRatio: "16 / 10",
};

const content = {
  padding: "24px",
};

const titleSkeleton = {
  ...shimmer,

  height: "34px",
  borderRadius: "12px",
  marginBottom: "20px",
  width: "70%",
};

const priceSkeleton = {
  ...shimmer,

  height: "28px",
  borderRadius: "12px",
  marginBottom: "24px",
  width: "40%",
};

const specRow = {
  display: "flex",
  gap: "12px",
  marginBottom: "26px",
};

const specSkeleton = {
  ...shimmer,

  flex: 1,
  height: "72px",
  borderRadius: "18px",
};

const buttonRow = {
  display: "flex",
  gap: "14px",
};

const buttonSkeleton = {
  ...shimmer,

  flex: 1,
  height: "52px",
  borderRadius: "16px",
};

const buttonSkeletonDark = {
  ...buttonSkeleton,

  opacity: 0.7,
};