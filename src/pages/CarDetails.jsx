import {
  useEffect,
  useState,
} from "react";

import { API_URL } from "../config";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import LeadInquiryModal from "../components/LeadInquiryModal";
import EMICalculator from "../components/EMICalculator";

import SEO from "../components/SEO/SEO";
import JsonLd from "../components/SEO/JsonLd";

import CarDetailsSkeleton from "../components/skeletons/CarDetailsSkeleton";

import CatalogTrustBadge from "../components/catalog/CatalogTrustBadge";

import EvDetailGoldSections from "../components/catalog/EvDetailGoldSections";

import useCatalogEnrichment from "../hooks/useCatalogEnrichment";

import {
  buildFaqSchema,
} from "../utils/catalogExperience";

import {
  buildVehicleSchema,
  buildBreadcrumbSchema,
} from "../utils/structuredData";

import {
  formatIndianPrice,
  formatIndianPriceCompact,
} from "../utils/formatIndianPrice";

import { getOgImage } from "../utils/vehicleMedia";

import { fetchVehicleBySlug } from "../utils/vehicleDetailResolver";

import {
  canonicalVehicleUrl,
  normalizeVehicleSlug,
  vehicleDetailPath,
} from "../utils/vehicleRoutes";

import VehicleImage from "../components/media/VehicleImage";
import VehicleDetailNotFound from "../components/catalog/VehicleDetailNotFound";

import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";

import { BUYER_EVENTS } from "../event-tracking/eventTypes";

import { getLastSeoSource } from "../buyer-intelligence/journeyBuffer";

import {
  getResponsiveImage,
  getSafeImage,
} from "../utils/imageUtils";

/* =========================================================
   ==================== CAR DETAILS PAGE ===================
   ========================================================= */

export default function CarDetails() {

  const { slug } =
    useParams();

  const navigate =
    useNavigate();

  const [car, setCar] =
    useState(null);

  const {
    vehicle: displayCar,
    catalogLoading,
    hasGoldExperience,
  } = useCatalogEnrichment(car, slug);

  const [loading, setLoading] =
    useState(true);

  const [selectedImage, setSelectedImage] =
    useState("");

  const [selectedVariant, setSelectedVariant] =
    useState(null);

  const [selectedColor, setSelectedColor] =
    useState(null);

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

    trackBuyerEvent(BUYER_EVENTS.LEAD_CTA_INITIATED, {
      vehicleSlugs: slug ? [normalizeVehicleSlug(slug)] : [],
      sourcePage: window.location.pathname,
    });
  };

  /* =========================================================
     ======================= FETCH CAR =======================
     ========================================================= */

  useEffect(() => {

    let cancelled = false;

    async function fetchCar() {
      setLoading(true);

      const result = await fetchVehicleBySlug(slug);

      if (cancelled) return;

      if (result?.vehicle) {
        setCar(result.vehicle);

        const resolved = normalizeVehicleSlug(
          result.resolvedSlug
        );
        const requested = normalizeVehicleSlug(slug);

        if (
          resolved &&
          requested &&
          resolved !== requested
        ) {
          navigate(
            vehicleDetailPath(resolved),
            { replace: true }
          );
        }
      } else {
        setCar(null);
      }

      setLoading(false);
    }

    fetchCar();

    fetch(`${API_URL}/views`, {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        carId: normalizeVehicleSlug(slug) || slug,
      }),

    }).catch((err) => {

      console.error(err);
    });

    return () => {
      cancelled = true;
    };

  }, [slug, navigate]);

  /* =========================================================
     ================= INITIAL SELECTORS =====================
     ========================================================= */

  useEffect(() => {

    if (!car) return;

    const hero =
      car.heroImage ||
      car.image;

    setSelectedImage(hero);

    if (
      Array.isArray(car.variants) &&
      car.variants.length > 0
    ) {

      setSelectedVariant(
        car.variants[0]
      );
    }

    if (
      Array.isArray(car.colors) &&
      car.colors.length > 0
    ) {

      setSelectedColor(
        car.colors[0]
      );
    }

  }, [car]);

  useEffect(() => {
    if (!displayCar || loading) return;

    const vehicleSlug =
      normalizeVehicleSlug(
        displayCar.slug || slug
      ) || slug;

    trackBuyerEvent(BUYER_EVENTS.DETAIL_PAGE_VIEWED, {
      vehicleSlugs: vehicleSlug ? [vehicleSlug] : [],
      sourcePage: window.location.pathname,
      sessionIntent: getLastSeoSource()
        ? "seo_referral"
        : undefined,
      metadata: getLastSeoSource()
        ? { seoPageSlug: getLastSeoSource() }
        : undefined,
    });
  }, [displayCar, loading, slug]);

  /* =========================================================
     ======================= LOADING =========================
     ========================================================= */

  if (loading || catalogLoading) {

    return <CarDetailsSkeleton />;
  }

  /* =========================================================
     ======================= NOT FOUND =======================
     ========================================================= */

  if (!displayCar) {
    return <VehicleDetailNotFound requestedSlug={slug} />;
  }

  /* =========================================================
     ====================== GALLERY ==========================
     ========================================================= */

  const vehicle = displayCar;

  const galleryImages =
    vehicle.galleryImages?.length > 0

      ? vehicle.galleryImages

      : [
          vehicle.heroImage ||
          vehicle.image,
        ];

  const displayImage =
    selectedColor?.image ||
    selectedImage ||
    vehicle.heroImage;

  const safeDisplayImage =
    getSafeImage(
      displayImage
    );

  const responsiveMainImage =
    getResponsiveImage(
      safeDisplayImage
    );

  /* =========================================================
     ====================== VARIANT DATA =====================
     ========================================================= */

  const activePrice =
    selectedVariant?.price ||

    vehicle.startingPrice ||

    0;

  const activeRange =
    selectedVariant?.range ||

    vehicle.specifications
      ?.range ||

    0;

  const activeBattery =
    selectedVariant
      ?.batteryPack ||

    vehicle.specifications
      ?.batteryPack ||

    "EV Battery";

  const activeCharging =
    selectedVariant
      ?.chargingTime ||

    vehicle.specifications
      ?.chargingTime ||

    "Fast Charging";

  const topSpeed =
    vehicle.specifications
      ?.topSpeed ||

    "N/A";

  const features =
    Array.isArray(vehicle.features)

      ? vehicle.features

      : [];

  const safety =
    Array.isArray(vehicle.safety)

      ? vehicle.safety

      : [];

  const overview =
    vehicle.catalogMeta?.expertSummary ||
    vehicle.overview ||

    "Experience next-generation electric mobility.";

  const seoTitle =
    vehicle.seo?.metaTitle ||
    `${vehicle.name} Price, Range, Specs & Review | EVSavari`;

  const seoDescription =
    vehicle.seo?.metaDescription ||
    overview;

  const faqSchema = buildFaqSchema(
    [
      ...(vehicle.catalogMeta?.faq || []),
      ...(vehicle.catalogMeta?.chargingFaq || []),
    ],
    canonicalVehicleUrl(slug)
  );

  /* =========================================================
     ====================== JSON-LD SEO ======================
     ========================================================= */

  const vehicleSchema = buildVehicleSchema({
    name: vehicle.name,
    brand: vehicle.brand,
    description: overview,
    images: galleryImages,
    priceInr: activePrice,
    slug,
    sku: vehicle._id,
  });

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Cars", url: "/cars" },
    {
      name: vehicle.name,
      url: canonicalVehicleUrl(slug),
    },
  ]);

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={
          canonicalVehicleUrl(slug)
        }
        image={getOgImage(vehicle)}
        type="product"
      />

      <JsonLd
        data={vehicleSchema}
      />

      <JsonLd
        data={breadcrumbSchema}
      />

      {faqSchema && (
        <JsonLd data={faqSchema} />
      )}

      <div style={pageContainer}>

        {/* ================= TOP BAR ================= */}

        <div style={topBar}>

          <button
            onClick={() =>
              navigate(-1)
            }

            style={backButton}

            aria-label="Go back"
          >
            ← Back
          </button>

        </div>

        {/* ================= HERO ================= */}

        <section style={heroSection}>

          {/* ================= LEFT ================= */}

          <div style={leftColumn}>

            {/* ================= MAIN IMAGE ================= */}

            <div style={imageSection}>

              <VehicleImage
                car={vehicle}
                src={safeDisplayImage}
                role="hero"
                alt={vehicle.name}
                eager
                responsive
                imgStyle={carImage}
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: "unset",
                }}
              />

            </div>

            {/* ================= GALLERY ================= */}

            <div style={galleryRow}>

              {galleryImages.map(
                (
                  image,
                  index
                ) => {

                  const safeImage =
                    getSafeImage(
                      image
                    );

                  return (

                    <button
                      key={index}

                      style={{
                        ...galleryButton,

                        border:
                          selectedImage === image

                            ? "3px solid #2563eb"

                            : "1px solid #e2e8f0",
                      }}

                      onClick={() =>
                        setSelectedImage(
                          image
                        )
                      }

                      aria-label={`View image ${index + 1}`}
                    >

                      <VehicleImage
                        car={vehicle}
                        src={safeImage}
                        role="gallery"
                        alt={`${vehicle.name} ${index + 1}`}
                        imgStyle={galleryImage}
                        wrapperStyle={{
                          width: "100%",
                          height: "100%",
                          aspectRatio: "unset",
                        }}
                      />

                    </button>
                  );
                }
              )}

            </div>

            {/* ================= COLORS ================= */}

            {vehicle.colors?.length >
              0 && (

              <div>

                <h2 style={sectionTitle}>
                  Available Colors
                </h2>

                <div style={colorRow}>

                  {vehicle.colors.map(
                    (
                      color,
                      index
                    ) => (

                      <button
                        key={index}

                        style={{
                          ...colorButton,

                          border:
                            selectedColor
                              ?.name ===
                            color.name

                              ? "3px solid #2563eb"

                              : "1px solid #cbd5e1",
                        }}

                        onClick={() => {

                          setSelectedColor(
                            color
                          );

                          setSelectedImage(
                            color.image
                          );
                        }}

                        aria-label={`Select ${color.name} color`}
                      >
                        {color.name}
                      </button>
                    )
                  )}

                </div>

              </div>
            )}

          </div>

          {/* ================= RIGHT ================= */}

          <div style={infoSection}>

            <div>

              <div style={premiumBadge}>
                {vehicle.category ||
                  "Premium Electric Vehicle"}
              </div>

              <h1 style={carTitle}>
                {vehicle.name}
              </h1>

              <p style={priceText}>
                {formatIndianPrice(activePrice)}
              </p>

              <p style={subtitleText}>
                {overview}
              </p>

              <CatalogTrustBadge
                catalogMeta={
                  vehicle.catalogMeta
                }
                catalogSource={
                  vehicle.catalogSource
                }
              />

            </div>

            {/* ================= VARIANTS ================= */}

            {vehicle.variants?.length >
              0 && (

              <div>

                <h2 style={sectionTitle}>
                  Variants
                </h2>

                <div style={variantGrid}>

                  {vehicle.variants.map(
                    (
                      variant,
                      index
                    ) => (

                      <button
                        key={index}

                        style={{
                          ...variantButton,

                          border:
                            selectedVariant
                              ?.name ===
                            variant.name

                              ? "2px solid #2563eb"

                              : "1px solid #e2e8f0",
                        }}

                        onClick={() =>
                          setSelectedVariant(
                            variant
                          )
                        }
                      >

                        <strong>
                          {
                            variant.name
                          }
                        </strong>

                        <span>
                          {formatIndianPriceCompact(
                            variant.price
                          )}
                        </span>

                      </button>
                    )
                  )}

                </div>

              </div>
            )}

            {/* ================= SPEC GRID ================= */}

            <div style={specGrid}>

              <div style={specCard}>
                <p style={specLabel}>
                  Range
                </p>

                <h3 style={specValue}>
                  ⚡ {activeRange} km
                </h3>
              </div>

              <div style={specCard}>
                <p style={specLabel}>
                  Battery
                </p>

                <h3 style={specValue}>
                  🔋 {activeBattery}
                </h3>
              </div>

              <div style={specCard}>
                <p style={specLabel}>
                  Charging
                </p>

                <h3 style={specValue}>
                  ⚡ {activeCharging}
                </h3>
              </div>

              <div style={specCard}>
                <p style={specLabel}>
                  Top Speed
                </p>

                <h3 style={specValue}>
                  🚀 {topSpeed}
                </h3>
              </div>

            </div>

            {/* ================= FEATURES ================= */}

            {features.length >
              0 && (

              <div>

                <h2 style={sectionTitle}>
                  Features
                </h2>

                <div style={highlightGrid}>

                  {features.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}

                        style={
                          highlightCard
                        }
                      >
                        ✔ {item}
                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* ================= SAFETY ================= */}

            {safety.length >
              0 && (

              <div>

                <h2 style={sectionTitle}>
                  Safety
                </h2>

                <div style={highlightGrid}>

                  {safety.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}

                        style={
                          safetyCard
                        }
                      >
                        🛡 {item}
                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* ================= CTA ================= */}

            <div style={actionRow}>

              <button
                type="button"
                style={secondaryAction}
                onClick={() =>
                  openInquiry(
                    "Request a callback",
                    "Request callback"
                  )
                }
              >
                Request callback
              </button>

              <button
                type="button"
                style={secondaryAction}
                onClick={() =>
                  openInquiry(
                    "Get the best deal",
                    "Get best deal"
                  )
                }
              >
                Get best deal
              </button>

              <button
                style={primaryAction}
              >
                Book Test Drive
              </button>

              <button
                style={secondaryAction}

                onClick={() => {

                  let existing = [];

                  try {

                    const raw =
                      localStorage.getItem(
                        "compareCars"
                      );

                    if (raw) {

                      const parsed =
                        JSON.parse(raw);

                      existing =
                        Array.isArray(parsed)
                          ? parsed
                          : [];
                    }
                  } catch {

                    existing = [];
                  }

                  const alreadyExists =
                    existing.find(
                      (item) =>
                        item._id ===
                        vehicle._id
                    );

                  if (!alreadyExists) {

                    existing.push(vehicle);

                    localStorage.setItem(
                      "compareCars",
                      JSON.stringify(
                        existing
                      )
                    );
                  }

                  navigate(
                    "/compare",

                    {
                      state: {
                        cars: existing,
                      },
                    }
                  );
                }}
              >
                Compare EV
              </button>

            </div>

          </div>

        </section>

        {hasGoldExperience && (
          <EvDetailGoldSections
            car={vehicle}
            slug={slug}
          />
        )}

        {/* ================= OVERVIEW ================= */}

        <section style={overviewContainer}>

          <div style={overviewCard}>

            <h2 style={sectionTitle}>
              Vehicle Overview
            </h2>

              <p style={descriptionText}>
              {vehicle.catalogMeta?.expertSummary ||
                overview}
            </p>

          </div>

        </section>

        {/* ================= LOWER ================= */}

        <section style={bottomSection}>

          <div style={bottomGrid}>

            <div style={premiumCard}>

              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#0f172a",
                }}
              >
                Dealer assistance
              </h3>

              <p
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "14px",
                  lineHeight: "1.75",
                  color: "#475569",
                }}
              >
                Verified EV dealers will contact you
                with pricing and availability. Your
                details are used only for this enquiry.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >

                <button
                  type="button"
                  style={secondaryAction}
                  onClick={() =>
                    openInquiry(
                      "Request a callback",
                      "Request callback"
                    )
                  }
                >
                  Request callback
                </button>

                <button
                  type="button"
                  style={secondaryAction}
                  onClick={() =>
                    openInquiry(
                      "Get the best deal",
                      "Get best deal"
                    )
                  }
                >
                  Get best deal
                </button>

              </div>

            </div>

            <div style={premiumCard}>
              <EMICalculator
                price={activePrice}
              />
            </div>

            <LeadInquiryModal
              isOpen={inquiryOpen}
              onClose={() =>
                setInquiryOpen(
                  false
                )
              }
              sourcePage="car_details"
              vehicleName={vehicle.name}
              vehicleId={
                String(
                  vehicle.slug ||
                    vehicle._id ||
                    ""
                )
              }
              mongoCarId={
                String(
                  vehicle._id || ""
                )
              }
              headline={inquiryHeadline}
              submitLabel={inquirySubmit}
            />

          </div>

        </section>

      </div>

    </>
  );
}

/* =========================================================
   ======================== STYLES ==========================
   ========================================================= */

const pageContainer = {
  minHeight: "100vh",

  background:
    "linear-gradient(to bottom, #f8fafc, #eef2ff)",

  paddingBottom: "100px",
};

const loadingWrapper = {
  minHeight: "80vh",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  padding: "30px",
};

const loaderCard = {
  background: "white",

  padding: "50px",

  borderRadius: "32px",

  boxShadow:
    "0 24px 60px rgba(15,23,42,0.08)",

  border:
    "1px solid #e2e8f0",

  textAlign: "center",
};

const topBar = {
  maxWidth: "1500px",

  margin: "0 auto",

  padding:
    "24px clamp(18px, 3vw, 36px) 0",
};

const backButton = {
  background: "#0f172a",

  color: "white",

  border: "none",

  padding: "14px 22px",

  borderRadius: "16px",

  cursor: "pointer",

  fontWeight: "700",

  transition:
    "all 0.25s ease",
};

const heroSection = {
  maxWidth: "1500px",

  margin: "0 auto",

  padding:
    "24px clamp(18px, 3vw, 36px) 0",

  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",

  gap: "34px",

  alignItems: "start",
};

const leftColumn = {
  display: "flex",

  flexDirection: "column",

  gap: "24px",
};

const imageSection = {
  overflow: "hidden",

  borderRadius: "36px",

  background: "white",

  aspectRatio: "16 / 10",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  boxShadow:
    "0 28px 70px rgba(15,23,42,0.10)",

  border:
    "1px solid #e2e8f0",
};

const pictureWrapper = {
  width: "100%",

  height: "100%",
};

const carImage = {
  width: "100%",

  height: "100%",

  objectFit: "contain",

  transition:
    "transform 0.45s ease",
};

const galleryRow = {
  display: "flex",

  gap: "14px",

  flexWrap: "wrap",
};

const galleryButton = {
  width: "110px",

  height: "90px",

  borderRadius: "18px",

  overflow: "hidden",

  cursor: "pointer",

  background: "white",

  transition:
    "all 0.25s ease",
};

const galleryImage = {
  width: "100%",

  height: "100%",

  objectFit: "cover",

  transition:
    "transform 0.35s ease",
};

const colorRow = {
  display: "flex",

  gap: "14px",

  flexWrap: "wrap",
};

const colorButton = {
  background: "white",

  padding: "14px 18px",

  borderRadius: "16px",

  cursor: "pointer",

  fontWeight: "700",

  transition:
    "all 0.25s ease",
};

const infoSection = {
  background: "white",

  borderRadius: "36px",

  padding:
    "clamp(28px, 4vw, 48px)",

  border:
    "1px solid #e2e8f0",

  boxShadow:
    "0 24px 60px rgba(15,23,42,0.06)",

  display: "flex",

  flexDirection: "column",

  gap: "36px",
};

const premiumBadge = {
  display: "inline-flex",

  background:
    "linear-gradient(135deg, #dbeafe, #bfdbfe)",

  color: "#1d4ed8",

  padding: "10px 18px",

  borderRadius: "999px",

  fontWeight: "700",

  fontSize: "13px",

  marginBottom: "24px",
};

const carTitle = {
  fontSize:
    "clamp(42px, 6vw, 72px)",

  fontWeight: "800",

  color: "#0f172a",

  marginBottom: "20px",

  lineHeight: "1.02",
};

const priceText = {
  fontSize:
    "clamp(34px, 5vw, 54px)",

  fontWeight: "800",

  color: "#2563eb",

  marginBottom: "20px",
};

const subtitleText = {
  color: "#475569",

  lineHeight: "2",

  fontSize: "16px",
};

const variantGrid = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",

  gap: "16px",
};

const variantButton = {
  background: "#f8fafc",

  borderRadius: "20px",

  padding: "18px",

  cursor: "pointer",

  display: "flex",

  flexDirection: "column",

  gap: "10px",

  transition:
    "all 0.25s ease",
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

  border:
    "1px solid #e2e8f0",

  transition:
    "all 0.25s ease",
};

const specLabel = {
  color: "#64748b",

  marginBottom: "12px",

  fontSize: "13px",

  fontWeight: "700",
};

const specValue = {
  color: "#0f172a",

  margin: 0,

  fontSize: "22px",

  fontWeight: "800",
};

const sectionTitle = {
  fontSize:
    "clamp(26px, 4vw, 34px)",

  fontWeight: "800",

  color: "#0f172a",

  marginBottom: "22px",
};

const highlightGrid = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",

  gap: "16px",
};

const highlightCard = {
  background:
    "linear-gradient(135deg, #eff6ff, #dbeafe)",

  color: "#1d4ed8",

  padding: "20px",

  borderRadius: "20px",

  fontWeight: "700",
};

const safetyCard = {
  background:
    "linear-gradient(135deg, #f8fafc, #eef2ff)",

  color: "#0f172a",

  padding: "20px",

  borderRadius: "20px",

  fontWeight: "700",
};

const actionRow = {
  display: "flex",

  gap: "16px",

  flexWrap: "wrap",
};

const primaryAction = {
  background:
    "linear-gradient(135deg, #2563eb, #1d4ed8)",

  color: "white",

  border: "none",

  padding: "16px 28px",

  borderRadius: "18px",

  cursor: "pointer",

  fontWeight: "700",

  transition:
    "all 0.25s ease",
};

const secondaryAction = {
  background: "#0f172a",

  color: "white",

  border: "none",

  padding: "16px 28px",

  borderRadius: "18px",

  cursor: "pointer",

  fontWeight: "700",

  transition:
    "all 0.25s ease",
};

const overviewContainer = {
  maxWidth: "1500px",

  margin: "0 auto",

  padding:
    "34px clamp(18px, 3vw, 36px) 0",
};

const overviewCard = {
  background: "white",

  borderRadius: "30px",

  padding: "40px",

  border:
    "1px solid #e2e8f0",

  boxShadow:
    "0 24px 60px rgba(15,23,42,0.06)",
};

const descriptionText = {
  color: "#475569",

  lineHeight: "2",

  fontSize: "16px",
};

const bottomSection = {
  maxWidth: "1500px",

  margin: "0 auto",

  padding:
    "34px clamp(18px, 3vw, 36px) 0",
};

const bottomGrid = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",

  gap: "28px",
};

const premiumCard = {
  background: "white",

  borderRadius: "30px",

  border:
    "1px solid #e2e8f0",

  boxShadow:
    "0 24px 60px rgba(15,23,42,0.06)",

  overflow: "hidden",
};