export default function CarDetailsSkeleton() {

  return (

    <div style={pageContainer}>

      {/* ================= TOP BAR ================= */}

      <div style={topBar}>

        <div style={backButtonSkeleton} />

      </div>

      {/* ================= HERO ================= */}

      <section style={heroSection}>

        {/* ================= LEFT ================= */}

        <div style={leftColumn}>

          <div style={mainImageSkeleton} />

          <div style={galleryRow}>

            {Array.from({
              length: 4,
            }).map((_, index) => (

              <div
                key={index}
                style={gallerySkeleton}
              />
            ))}

          </div>

        </div>

        {/* ================= RIGHT ================= */}

        <div style={infoSection}>

          <div style={badgeSkeleton} />

          <div style={titleSkeleton} />

          <div style={priceSkeleton} />

          <div style={textSkeletonLarge} />

          <div style={textSkeletonMedium} />

          {/* ================= SPECS ================= */}

          <div style={specGrid}>

            {Array.from({
              length: 4,
            }).map((_, index) => (

              <div
                key={index}
                style={specCard}
              >

                <div
                  style={
                    specLabelSkeleton
                  }
                />

                <div
                  style={
                    specValueSkeleton
                  }
                />

              </div>
            ))}

          </div>

          {/* ================= FEATURES ================= */}

          <div style={sectionSkeleton} />

          <div style={featureGrid}>

            {Array.from({
              length: 4,
            }).map((_, index) => (

              <div
                key={index}
                style={featureSkeleton}
              />
            ))}

          </div>

          {/* ================= CTA ================= */}

          <div style={buttonRow}>

            <div
              style={primaryButtonSkeleton}
            />

            <div
              style={secondaryButtonSkeleton}
            />

          </div>

        </div>

      </section>

      {/* ================= OVERVIEW ================= */}

      <section style={overviewSection}>

        <div style={overviewCard}>

          <div style={sectionSkeleton} />

          <div style={overviewLine} />

          <div style={overviewLine} />

          <div
            style={{
              ...overviewLine,
              width: "80%",
            }}
          />

        </div>

      </section>

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

const pageContainer = {
  minHeight: "100vh",
  background:
    "linear-gradient(to bottom, #f8fafc, #eef2ff)",
  paddingBottom: "100px",
};

const topBar = {
  maxWidth: "1500px",
  margin: "0 auto",
  padding:
    "24px clamp(18px, 3vw, 36px) 0",
};

const backButtonSkeleton = {
  ...shimmer,
  width: "120px",
  height: "50px",
  borderRadius: "16px",
};

const heroSection = {
  maxWidth: "1500px",
  margin: "0 auto",
  padding:
    "24px clamp(18px, 3vw, 36px) 0",
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(420px, 1fr))",
  gap: "34px",
};

const leftColumn = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const mainImageSkeleton = {
  ...shimmer,
  width: "100%",
  aspectRatio: "16 / 10",
  borderRadius: "36px",
};

const galleryRow = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
};

const gallerySkeleton = {
  ...shimmer,
  width: "100px",
  height: "80px",
  borderRadius: "18px",
};

const infoSection = {
  background: "white",
  borderRadius: "36px",
  padding:
    "clamp(28px, 4vw, 48px)",
  border: "1px solid #e2e8f0",
  boxShadow:
    "0 24px 60px rgba(15,23,42,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: "28px",
};

const badgeSkeleton = {
  ...shimmer,
  width: "160px",
  height: "36px",
  borderRadius: "999px",
};

const titleSkeleton = {
  ...shimmer,
  width: "70%",
  height: "74px",
  borderRadius: "20px",
};

const priceSkeleton = {
  ...shimmer,
  width: "40%",
  height: "58px",
  borderRadius: "16px",
};

const textSkeletonLarge = {
  ...shimmer,
  width: "100%",
  height: "22px",
  borderRadius: "10px",
};

const textSkeletonMedium = {
  ...shimmer,
  width: "80%",
  height: "22px",
  borderRadius: "10px",
};

const specGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "18px",
};

const specCard = {
  background:
    "linear-gradient(to bottom, #ffffff, #f8fafc)",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #e2e8f0",
};

const specLabelSkeleton = {
  ...shimmer,
  width: "60%",
  height: "16px",
  borderRadius: "8px",
  marginBottom: "18px",
};

const specValueSkeleton = {
  ...shimmer,
  width: "90%",
  height: "28px",
  borderRadius: "10px",
};

const sectionSkeleton = {
  ...shimmer,
  width: "240px",
  height: "42px",
  borderRadius: "14px",
};

const featureGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const featureSkeleton = {
  ...shimmer,
  height: "72px",
  borderRadius: "20px",
};

const buttonRow = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap",
};

const primaryButtonSkeleton = {
  ...shimmer,
  width: "220px",
  height: "58px",
  borderRadius: "18px",
};

const secondaryButtonSkeleton = {
  ...shimmer,
  width: "220px",
  height: "58px",
  borderRadius: "18px",
  opacity: 0.7,
};

const overviewSection = {
  maxWidth: "1500px",
  margin: "0 auto",
  padding:
    "34px clamp(18px, 3vw, 36px) 0",
};

const overviewCard = {
  background: "white",
  borderRadius: "30px",
  padding: "40px",
  border: "1px solid #e2e8f0",
  boxShadow:
    "0 24px 60px rgba(15,23,42,0.06)",
};

const overviewLine = {
  ...shimmer,
  height: "20px",
  borderRadius: "10px",
  marginTop: "18px",
};