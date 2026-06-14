import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { API_URL } from "../config";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import LeadInquiryModal from "../components/LeadInquiryModal";

import SeoHead from "../components/SEO/SeoHead";
import JsonLd from "../components/SEO/JsonLd";
import CompareInternalLinks from "../components/compare/CompareInternalLinks";

import CarDetailsSkeleton from "../components/skeletons/CarDetailsSkeleton";

import useCatalogEnrichment from "../hooks/useCatalogEnrichment";

import {
  buildFaqSchema,
} from "../utils/catalogExperience";

import {
  buildProductSchema,
  buildBreadcrumbSchema,
} from "../utils/structuredData";

import { buildVehiclePageMeta } from "../seo/pageMetadata";
import { resolveBrandHubPath } from "../seo/breadcrumbs";

import { formatIndianPrice } from "../utils/formatIndianPrice";

import { getHeroImage, getOgImage, resolveDetailGalleryItems, resolveRequestableGalleryImages } from "../utils/vehicleMedia";

import {
  fetchVehicleFamilyBySlug,
} from "../utils/vehicleDetailResolver";

import {
  extractFamilySlug,
  filterComparableVariants,
  formatFamilyName,
} from "../utils/modelFamily";

import {
  canonicalVehicleUrl,
  normalizeVehicleSlug,
  vehicleFamilyPath,
} from "../utils/vehicleRoutes";

import DetailHero from "../components/car/DetailHero";
import VehicleDetailNotFound from "../components/catalog/VehicleDetailNotFound";
import NetworkErrorPanel from "../components/ui/NetworkErrorPanel";
import DetailBreadcrumbs from "../components/catalog/DetailBreadcrumbs";
import "../styles/car-details.css";
import DetailActionBar from "../components/car/DetailActionBar";
import DetailTabs from "../components/car/DetailTabs";
import { scoreVehicle } from "../scoring/index.js";
import {
  buildDetailPageSectionContext,
  buildVisibleDetailSections,
  buildVisibleDetailNavTabs,
  detailTabIdForSectionElement,
  getDetailNavObserveIds,
  scrollToDetailSection,
} from "../utils/detailPageNav";
import { buildVehicleIntelligence } from "../intelligence/buildVehicleIntelligence";
import { buildHeroSummary } from "../intelligence/buildHeroSummary.js";
import { buildEvSavariVerdict } from "../intelligence/buildEvSavariVerdict.js";

import {
  applyFamilyMediaFallback,
  enrichVariantsWithInsights,
  getActiveVariantLabel,
  preloadVariantGallery,
  resolveFamilyMediaFallback,
  resolveVariantSpecs,
} from "../utils/variantInsights";

import {
  buildVariantEventPayload,
  trackVariantEvent,
} from "../utils/variantAnalytics";

import {
  mergeCompareCars,
  replaceCompareCars,
} from "../utils/compareCarsStorage";

import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";
import {
  trackFinanceHelpCta,
  trackLaunchDealerAssistance,
  trackLaunchEvViewed,
} from "../launch/launchTelemetry";

import { BUYER_EVENTS } from "../event-tracking/eventTypes";

import { getLastSeoSource } from "../buyer-intelligence/journeyBuffer";

import { detailUnavailableMessage } from "../utils/apiDiagnostics";
import {
  safeFetchFireAndForget,
  safeFetchJsonWithRetry,
} from "../utils/safeFetch";
import { getSafeImage } from "../utils/imageUtils";
import {
  buildFamilyAggregateMetrics,
  buildVariantDetailMetrics,
} from "../utils/familyAggregateMetrics";

/* =========================================================
   ==================== CAR DETAILS PAGE ===================
   ========================================================= */

export default function CarDetails() {

  const { slug } =
    useParams();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const comparisonRef = useRef(null);
  const emiSectionRef = useRef(null);
  const mediaFallbackRef = useRef(null);

  const [activeTab, setActiveTab] =
    useState("overview");

  const navigate =
    useNavigate();

  const [car, setCar] =
    useState(null);

  const [family, setFamily] =
    useState(null);

  const [familyVariants, setFamilyVariants] =
    useState([]);

  const getVariantAnalyticsContext =
    useCallback(
      (variantSlugOverride) => ({
        familySlug:
          family?.familySlug ||
          extractFamilySlug(
            slug || car?.slug || ""
          ),
        variantSlug:
          variantSlugOverride ||
          car?.slug ||
          searchParams.get("variant") ||
          "",
        brand:
          car?.brand ||
          family?.brand ||
          "",
      }),
      [family, car, slug, searchParams]
    );

  const {
    vehicle: displayCar,
    catalogLoading,
    hasGoldExperience,
  } = useCatalogEnrichment(
    car,
    car?.slug || searchParams.get("variant") || slug
  );

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState(null);
  const [loadErrorContext, setLoadErrorContext] =
    useState(null);

  const [fetchRetryKey, setFetchRetryKey] =
    useState(0);

  const [selectedImage, setSelectedImage] =
    useState("");

  const [selectedVariant, setSelectedVariant] =
    useState(null);

  const [selectedColor, setSelectedColor] =
    useState(null);

  const [inquiryOpen,
    setInquiryOpen] =
    useState(false);

  const [testDriveOpen, setTestDriveOpen] =
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

  const [inquirySubtitle, setInquirySubtitle] =
    useState("");

  const [inquiryLeadMetadata, setInquiryLeadMetadata] =
    useState({});

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

    setInquirySubtitle("");

    setInquiryLeadMetadata({});

    setInquiryOpen(
      true
    );

    trackVariantEvent(
      BUYER_EVENTS.LEAD_CTA_INITIATED,
      {
        ...getVariantAnalyticsContext(),
        extra: { cta: headline },
      }
    );
  };

  const trackPricingInteraction = useCallback(
    (interactionType) => {
      trackVariantEvent(
        BUYER_EVENTS.PRICING_INTERACTION,
        {
          ...getVariantAnalyticsContext(),
          extra: { interactionType },
        }
      );
    },
    [getVariantAnalyticsContext]
  );

  /* =========================================================
     ======================= FETCH CAR =======================
     ========================================================= */

  useEffect(() => {

    let cancelled = false;

    async function fetchCar() {
      setLoading(true);
      setLoadError(null);
      setLoadErrorContext(null);

      const variantParam =
        searchParams.get("variant");

      const catalogProbe = await safeFetchJsonWithRetry(
        `${API_URL}/cars?limit=1`,
        {
          label: "detail_catalog_probe",
          fallback: { cars: [] },
          timeoutMs: 20000,
        }
      );

      if (cancelled) return;

      if (!catalogProbe.ok) {
        setFamily(null);
        setFamilyVariants([]);
        setCar(null);
        setLoadError("load_failed");
        setLoadErrorContext({
          error: catalogProbe.error,
          status: catalogProbe.status,
          durationMs: catalogProbe.durationMs,
        });
        setLoading(false);
        return;
      }

      try {
        const result =
          await fetchVehicleFamilyBySlug(slug, {
            variantSlug: variantParam,
          });

        if (cancelled) return;

        if (result?.vehicle) {
          setFamily(result.family);
          setFamilyVariants(result.variants || []);
          setCar(result.vehicle);

          if (result.canonicalizeTo) {
            navigate(
              vehicleFamilyPath(
                result.canonicalizeTo,
                result.selectedVariantSlug
              ),
              { replace: true }
            );
          }
        } else {
          setFamily(null);
          setFamilyVariants([]);
          setCar(null);
          setLoadError("not_found");
        }
      } catch {
        if (cancelled) return;
        setFamily(null);
        setFamilyVariants([]);
        setCar(null);
        setLoadError("load_failed");
        setLoadErrorContext({
          error: "network_error",
          status: 0,
          durationMs: catalogProbe.durationMs,
        });
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    fetchCar();

    safeFetchFireAndForget(`${API_URL}/views`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      label: "vehicle_view",
      body: JSON.stringify({
        carId: normalizeVehicleSlug(slug) || slug,
      }),
    });

    return () => {
      cancelled = true;
    };

  }, [slug, navigate, searchParams, fetchRetryKey]);

  useEffect(() => {
    if (loading || !familyVariants.length) return;

    const param = searchParams.get("variant");
    if (!param) return;

    const match = familyVariants.find(
      (v) =>
        normalizeVehicleSlug(v.slug) ===
        normalizeVehicleSlug(param)
    );

    if (
      match &&
      normalizeVehicleSlug(match.slug) !==
        normalizeVehicleSlug(car?.slug)
    ) {
      setCar(
        applyFamilyMediaFallback(
          [match],
          mediaFallbackRef.current
        )[0]
      );
    }
  }, [
    searchParams,
    familyVariants,
    loading,
    car?.slug,
  ]);

  const handleSelectVariant = useCallback(
    (variant) => {
      if (!variant?.slug) return;

      const withMedia =
        applyFamilyMediaFallback(
          [variant],
          mediaFallbackRef.current
        )[0];

      setCar(withMedia);
      setSelectedVariant(withMedia);
      setSelectedColor(null);

      const hero =
        withMedia.heroImage || withMedia.image || getHeroImage(withMedia);
      if (hero) setSelectedImage(hero);

      const galleryUrls = resolveDetailGalleryItems(withMedia)
        .map((item) => item.src)
        .filter(Boolean);

      preloadVariantGallery(
        galleryUrls.map((url) => getSafeImage(url))
      );

      setSearchParams(
        {
          variant: normalizeVehicleSlug(
            withMedia.slug
          ),
        },
        { replace: true }
      );

      trackVariantEvent(
        BUYER_EVENTS.VARIANT_SELECTED,
        {
          ...getVariantAnalyticsContext(
            withMedia.slug
          ),
        }
      );
    },
    [
      getVariantAnalyticsContext,
      setSearchParams,
    ]
  );

  const scrollToVariantComparison =
    useCallback(() => {
      trackVariantEvent(
        BUYER_EVENTS.VARIANT_COMPARE_CLICKED,
        {
          ...getVariantAnalyticsContext(),
          extra: { action: "scroll_to_table" },
        }
      );
      scrollToDetailSection("variants");
    }, [getVariantAnalyticsContext]);

  const navigateVariantCompare = useCallback(
    (variants, options = {}) => {
      const { cleanSession = false } = options;
      const rawList =
        variants?.length > 0
          ? variants
          : car
            ? [car]
            : [];

      const compareFamilySlug =
        extractFamilySlug(
          rawList[0]?.familySlug ||
            rawList[0]?.slug ||
            car?.familySlug ||
            car?.slug ||
            slug ||
            ""
        );

      const list = filterComparableVariants(
        rawList,
        compareFamilySlug
      );

      trackVariantEvent(
        BUYER_EVENTS.COMPARE_STARTED,
        {
          ...getVariantAnalyticsContext(),
          extra: {
            compareScope: cleanSession
              ? "family_variants_isolated"
              : "family_variants",
            count: list.length,
          },
        }
      );

      const compareList = cleanSession
        ? replaceCompareCars(list)
        : mergeCompareCars(list);

      navigate("/compare", {
        state: {
          cars: compareList,
          variantCompareSession: cleanSession,
        },
      });
    },
    [car, navigate, getVariantAnalyticsContext, slug]
  );

  const scrollToEmiCalculator = useCallback(() => {
    trackPricingInteraction("emi_scroll_cta");
    scrollToDetailSection("emi");
  }, [trackPricingInteraction]);

  const scrollToDealer = useCallback(() => {
    trackLaunchDealerAssistance({
      sourcePage: "car_details",
      surface: "scroll_to_dealer",
    });
    scrollToDetailSection("assistance");
  }, []);

  const scrollToChargingDetails = useCallback(() => {
    if (!scrollToDetailSection("charging")) {
      scrollToDetailSection("variants");
    }
  }, []);

  const handleFinanceHelp = useCallback((source = "action_bar") => {
    const ctx = getVariantAnalyticsContext();

    trackFinanceHelpCta({
      sourcePage: "car_details",
      source,
      familySlug: ctx.familySlug,
      variantSlug: ctx.variantSlug,
      carSlug: ctx.familySlug || slug || "",
    });

    setInquiryHeadline("Get EV Finance Help");
    setInquirySubmit("Talk to finance expert");
    setInquirySubtitle(
      "Our finance partners can help you understand EMI, down payment, eligibility, and EV loan options."
    );
    setInquiryLeadMetadata({
      intent: "finance_help",
      source: "finance_help_cta",
      ctaSource: source,
      familySlug: ctx.familySlug,
      variantSlug: ctx.variantSlug,
      brand: ctx.brand,
    });
    setInquiryOpen(true);
  }, [getVariantAnalyticsContext, slug]);

  const openTestDrive = useCallback(() => {
    setTestDriveOpen(true);
    trackVariantEvent(
      BUYER_EVENTS.LEAD_CTA_INITIATED,
      {
        ...getVariantAnalyticsContext(),
        extra: { cta: "test_drive" },
      }
    );
  }, [getVariantAnalyticsContext]);

  /* =========================================================
     ================= INITIAL SELECTORS =====================
     ========================================================= */

  useEffect(() => {
    mediaFallbackRef.current = resolveFamilyMediaFallback(
      family || car,
      familyVariants
    );
  }, [family, familyVariants, car]);

  useEffect(() => {

    if (!car) return;

    const hero =
      car.heroImage ||
      car.image ||
      getHeroImage(car);

    setSelectedImage(hero);

    const galleryUrls = resolveDetailGalleryItems(car)
      .map((item) => item.src)
      .filter(Boolean);

    preloadVariantGallery(
      galleryUrls.map((url) => getSafeImage(url))
    );

    const match = familyVariants.find(
      (v) => v.slug === car.slug
    );
    if (match) {
      setSelectedVariant(match);
    } else if (
      Array.isArray(car.variants) &&
      car.variants.length > 0
    ) {
      setSelectedVariant(car.variants[0]);
    } else {
      setSelectedVariant(car);
    }

    if (
      Array.isArray(car.colors) &&
      car.colors.length > 0
    ) {

      setSelectedColor(
        car.colors[0]
      );
    }

  }, [car, familyVariants]);

  useEffect(() => {
    if (!displayCar || loading) return;

    const vehicleSlug =
      normalizeVehicleSlug(
        displayCar.slug || slug
      ) || slug;

    const ctx = buildVariantEventPayload({
      familySlug:
        family?.familySlug ||
        extractFamilySlug(displayCar.slug || slug),
      variantSlug: displayCar.slug || slug,
      brand: displayCar.brand || "",
      extra: getLastSeoSource()
        ? { seoPageSlug: getLastSeoSource() }
        : {},
    });

    trackLaunchEvViewed({
      familySlug: ctx.familySlug,
      variantSlug: ctx.variantSlug,
      sourcePage: ctx.sourcePage,
      brand: ctx.brand,
    });
  }, [displayCar, loading, slug, family?.familySlug]);

  const detailSectionContext = useMemo(() => {
    if (!displayCar) return null;

    const vehicle = displayCar;
    const famSlug =
      family?.familySlug ||
      extractFamilySlug(vehicle.slug || slug);
    const variantOptions =
      familyVariants.length > 0
        ? familyVariants
        : vehicle.variants || [];
    const comparable = filterComparableVariants(variantOptions, famSlug);
    const fallback =
      family?.defaultVariant ||
      comparable[0] ||
      variantOptions[0] ||
      vehicle;
    const enriched = enrichVariantsWithInsights(comparable, fallback);
    const explicitVariantSlug = normalizeVehicleSlug(
      searchParams.get("variant")
    );
    const familyOverview =
      comparable.length > 0 && !explicitVariantSlug;
    const selectedVarSlug = normalizeVehicleSlug(
      explicitVariantSlug ||
        selectedVariant?.slug ||
        vehicle.slug
    );
    const intelCar =
      enriched.find((v) => v.slug === selectedVarSlug) ||
      selectedVariant ||
      vehicle;
    const intelligence = buildVehicleIntelligence(intelCar);

    return buildDetailPageSectionContext({
      enrichedVariantsCount: enriched.length,
      isFamilyOverviewMode: familyOverview,
      vehicle,
      comparisonVehicle: intelCar,
      hasGoldExperience,
      intelligence,
      familySlug: famSlug,
    });
  }, [
    displayCar,
    family,
    familyVariants,
    slug,
    searchParams,
    selectedVariant,
    hasGoldExperience,
  ]);

  const pageSections = useMemo(() => {
    if (!detailSectionContext) return [];
    return buildVisibleDetailSections(detailSectionContext);
  }, [detailSectionContext]);

  const pageNavTabs = useMemo(() => {
    if (!detailSectionContext) return [];
    return buildVisibleDetailNavTabs(detailSectionContext);
  }, [detailSectionContext]);

  const handleNavSelect = useCallback(
    (tabId) => {
      const tab = pageNavTabs.find((item) => item.id === tabId);
      if (!tab) return;

      if (tab.action === "test-drive") {
        openTestDrive();
        return;
      }

      if (tab.scrollTarget) {
        setActiveTab(tabId);
        scrollToDetailSection(tab.scrollTarget);
      }
    },
    [pageNavTabs, openTestDrive]
  );

  useEffect(() => {
    if (!pageNavTabs.length) return;
    const sectionTabs = pageNavTabs.filter((tab) => !tab.cta);
    if (!sectionTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(sectionTabs[0]?.id ?? "overview");
    }
  }, [pageNavTabs, activeTab]);

  useEffect(() => {
    if (!displayCar || !pageNavTabs.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const topDiff =
              a.boundingClientRect.top - b.boundingClientRect.top;
            if (Math.abs(topDiff) > 8) return topDiff;
            return b.intersectionRatio - a.intersectionRatio;
          });

        for (const entry of visible) {
          const tabId = detailTabIdForSectionElement(
            entry.target?.id,
            pageNavTabs
          );
          if (tabId) {
            setActiveTab(tabId);
            break;
          }
        }
      },
      {
        rootMargin: "-148px 0px -55% 0px",
        threshold: [0, 0.12, 0.25, 0.4],
      }
    );

    getDetailNavObserveIds(pageNavTabs).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [displayCar, slug, pageNavTabs]);

  const evSavariScores = useMemo(() => {
    if (!displayCar || loading || catalogLoading) {
      return null;
    }

    const vehicle = displayCar;
    const familySlug =
      family?.familySlug ||
      extractFamilySlug(vehicle.slug || slug);
    const variantOptions =
      familyVariants.length > 0
        ? familyVariants
        : vehicle.variants || [];
    const comparableVariants = filterComparableVariants(
      variantOptions,
      familySlug
    );
    const familyFallbackVehicle =
      family?.defaultVariant ||
      comparableVariants[0] ||
      variantOptions[0] ||
      vehicle;
    const enrichedVariants = enrichVariantsWithInsights(
      comparableVariants,
      familyFallbackVehicle
    );
    const explicitVariantSlug = normalizeVehicleSlug(
      searchParams.get("variant")
    );
    const isFamilyOverviewMode =
      comparableVariants.length > 0 && !explicitVariantSlug;
    const selectedVariantSlug = normalizeVehicleSlug(
      explicitVariantSlug ||
        selectedVariant?.slug ||
        vehicle.slug
    );
    const intelligenceCar =
      enrichedVariants.find((v) => v.slug === selectedVariantSlug) ||
      selectedVariant ||
      vehicle;
    const familyMetrics = isFamilyOverviewMode
      ? buildFamilyAggregateMetrics(
          comparableVariants,
          familyFallbackVehicle
        )
      : null;

    const scoringSource = isFamilyOverviewMode
      ? {
          ...vehicle,
          variants: comparableVariants,
          maxRange: familyMetrics?.rangeLabel,
        }
      : intelligenceCar || vehicle;

    return scoreVehicle(scoringSource, {
      variants: comparableVariants.length ? comparableVariants : undefined,
    });
  }, [
    displayCar,
    loading,
    catalogLoading,
    family,
    slug,
    familyVariants,
    selectedVariant,
    searchParams,
  ]);

  /* =========================================================
     ======================= LOADING =========================
     ========================================================= */

  if (loading || catalogLoading) {

    return <CarDetailsSkeleton />;
  }

  /* =========================================================
     ======================= NOT FOUND =======================
     ========================================================= */

  if (loadError === "load_failed") {
    return (
      <NetworkErrorPanel
        title="Could not load this vehicle"
        message={detailUnavailableMessage(loadErrorContext || {})}
        onRetry={() => setFetchRetryKey((k) => k + 1)}
      />
    );
  }

  if (!displayCar) {
    return <VehicleDetailNotFound requestedSlug={slug} />;
  }

  /* =========================================================
     ====================== GALLERY ==========================
     ========================================================= */

  const vehicle = displayCar;

  const familySlug =
    family?.familySlug ||
    extractFamilySlug(vehicle.slug || slug);

  const familyTitle =
    family?.familyName ||
    formatFamilyName(familySlug, vehicle.brand);

  const variantOptions =
    familyVariants.length > 0
      ? familyVariants
      : vehicle.variants || [];

  const comparableVariants = filterComparableVariants(
    variantOptions,
    familySlug
  );

  const familyFallbackVehicle =
    family?.defaultVariant ||
    comparableVariants[0] ||
    variantOptions[0] ||
    vehicle;

  const enrichedVariants =
    enrichVariantsWithInsights(
      comparableVariants,
      familyFallbackVehicle
    );

  const activeVariantLabel = getActiveVariantLabel(
    selectedVariant || vehicle,
    familyTitle
  );

  const explicitVariantSlug = normalizeVehicleSlug(
    searchParams.get("variant")
  );
  const isFamilyOverviewMode =
    comparableVariants.length > 0 && !explicitVariantSlug;

  const selectedVariantSlug =
    normalizeVehicleSlug(
      explicitVariantSlug ||
        selectedVariant?.slug ||
        vehicle.slug
    );

  const familyMetrics = isFamilyOverviewMode
    ? buildFamilyAggregateMetrics(
        comparableVariants,
        familyFallbackVehicle
      )
    : null;

  const heroSummary = buildHeroSummary({
    ...vehicle,
    variants: comparableVariants.length ? comparableVariants : undefined,
    defaultVariant: familyFallbackVehicle,
  });

  const heroIntelligenceVehicle = {
    ...vehicle,
    variants: comparableVariants.length ? comparableVariants : undefined,
    defaultVariant: familyFallbackVehicle,
  };

  const evSavariVerdict = buildEvSavariVerdict(heroIntelligenceVehicle);

  const intelligenceCar =
    enrichedVariants.find((v) => v.slug === selectedVariantSlug) ||
    selectedVariant ||
    vehicle;

  const detailMetrics = !isFamilyOverviewMode
    ? buildVariantDetailMetrics(
        selectedVariant || vehicle,
        familyFallbackVehicle
      )
    : null;

  const galleryItems = resolveDetailGalleryItems(vehicle);
  const galleryImages = resolveRequestableGalleryImages(vehicle);

  const displayImage =
    selectedColor?.image ||
    selectedImage ||
    vehicle.heroImage ||
    getHeroImage(vehicle);

  const safeDisplayImage =
    getSafeImage(displayImage) || getHeroImage(vehicle);

  /* =========================================================
     ====================== VARIANT DATA =====================
     ========================================================= */

  const activeSpecs = resolveVariantSpecs(
    selectedVariant || vehicle,
    familyFallbackVehicle
  );

  const activePrice = isFamilyOverviewMode
    ? familyMetrics?.minPrice || activeSpecs.price
    : activeSpecs.price;

  const features =
    Array.isArray(vehicle.features)

      ? vehicle.features

      : [];

  const safety =
    Array.isArray(vehicle.safety)

      ? vehicle.safety

      : [];

  const expertSummary = String(
    vehicle.catalogMeta?.expertSummary || ""
  ).trim();
  const vehicleOverviewText = String(
    vehicle.overview || ""
  ).trim();
  const overviewFallback =
    "Experience next-generation electric mobility.";

  const overview =
    expertSummary ||
    vehicleOverviewText ||
    overviewFallback;

  const overviewSupplement =
    expertSummary &&
    vehicleOverviewText &&
    expertSummary !== vehicleOverviewText
      ? vehicleOverviewText
      : null;

  const pageMeta = buildVehiclePageMeta({
    name: vehicle.name,
    brand: vehicle.brand,
    overview,
    familySlug,
    image: getOgImage(vehicle),
    metaTitle: vehicle.seo?.metaTitle,
    metaDescription: vehicle.seo?.metaDescription,
  });

  const faqSchema = buildFaqSchema(
    [
      ...(vehicle.catalogMeta?.faq || []),
      ...(vehicle.catalogMeta?.chargingFaq || []),
    ],
    canonicalVehicleUrl(slug)
  );

  const familyMaxRange =
    Number(family?.maxRange) ||
    Math.max(
      0,
      ...enrichedVariants.map((v) =>
        Number(v.range ?? v.specifications?.range ?? 0)
      )
    );

  /* =========================================================
     ====================== JSON-LD SEO ======================
     ========================================================= */

  const batteryKwh =
    vehicle.batteryCapacity ||
    vehicle.specifications?.batteryCapacity ||
    vehicle.catalogMeta?.battery?.capacityKwh;

  const productSchema = buildProductSchema({
    name: vehicle.name,
    brand: vehicle.brand,
    description: overview,
    images: galleryImages,
    priceInr: activePrice,
    slug: familySlug,
    rangeKm: familyMaxRange || vehicle.range,
    batteryKwh,
  });

  const brandLabel =
    vehicle.brand || "EVs";

  const brandHubPath = resolveBrandHubPath(brandLabel);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    {
      name: brandLabel,
      url: brandHubPath || "/cars",
    },
    {
      name: familyTitle,
      url: canonicalVehicleUrl(familySlug),
    },
    ...(explicitVariantSlug && activeVariantLabel
      ? [
          {
            name: activeVariantLabel,
            url: canonicalVehicleUrl(familySlug),
          },
        ]
      : []),
  ]);

  const handleCompareEv = () => {
    navigateVariantCompare(
      comparableVariants.length > 0
        ? comparableVariants
        : [vehicle]
    );
  };

  const detailPage = {
    vehicle,
    intelligenceCar,
    slug,
    familySlug,
    overview,
    overviewSupplement,
    features,
    evSavariScores,
    isFamilyOverviewMode,
    detailMetrics,
    enrichedVariants,
    selectedVariantSlug,
    comparableVariants,
    activePrice,
    safety,
    comparisonRef,
    emiSectionRef,
    handleSelectVariant,
    navigateVariantCompare,
    handleFinanceHelp,
    trackPricingInteraction,
    openInquiry,
    navigate,
    peopleAlsoCompare: detailSectionContext?.peopleAlsoCompare ?? {
      comparisons: [],
    },
    similarEvs: detailSectionContext?.similarEvs ?? {
      similarVehicles: [],
    },
    popularAmongSimilarBuyers: detailSectionContext?.popularAmongSimilarBuyers ?? {
      vehicles: [],
    },
  };

  /* =========================================================
     ========================= RENDER ========================
     ========================================================= */

  return (

    <>
      <SeoHead meta={pageMeta} />

      <JsonLd data={productSchema} />

      <JsonLd
        data={breadcrumbSchema}
      />

      {faqSchema && (
        <JsonLd data={faqSchema} />
      )}

      <div className="cd-page">
        <div className="cd-shell">
          <div style={topBar}>
            <button
              onClick={() => navigate(-1)}
              style={backButton}
              aria-label="Go back"
            >
              ← Back
            </button>
          </div>

          <DetailBreadcrumbs
            brand={brandLabel}
            familySlug={familySlug}
            familyTitle={familyTitle}
            variantLabel={
              explicitVariantSlug ? activeVariantLabel : null
            }
          />

          <DetailHero
            vehicle={vehicle}
            familyTitle={familyTitle}
            activeVariantLabel={
              explicitVariantSlug ? activeVariantLabel : null
            }
            variantCount={comparableVariants.length}
            heroSummary={heroSummary}
            evSavariVerdict={evSavariVerdict}
            intelligenceVehicle={heroIntelligenceVehicle}
            category={vehicle.category}
            galleryItems={galleryItems}
            galleryImages={galleryImages}
            selectedImage={selectedImage}
            selectedVariantSlug={selectedVariantSlug}
            safeDisplayImage={safeDisplayImage}
            onSelectImage={setSelectedImage}
            onScrollEmi={scrollToEmiCalculator}
            onScrollDealer={scrollToDealer}
            onBookTestDrive={openTestDrive}
            onGetBestDeal={() => {
              trackLaunchDealerAssistance({
                sourcePage: "car_details",
                surface: "hero_get_best_deal",
              });
              openInquiry("Get the best deal", "Get best deal");
            }}
            onRequestCallback={() => {
              trackLaunchDealerAssistance({
                sourcePage: "car_details",
                surface: "hero_request_callback",
              });
              openInquiry("Request a callback", "Request callback");
            }}
            onGetDealerAssistance={() => {
              trackLaunchDealerAssistance({
                sourcePage: "car_details",
                surface: "hero_dealer_assistance",
              });
              scrollToDealer();
            }}
          />

          <DetailActionBar
            onEmi={scrollToEmiCalculator}
            onDealer={scrollToDealer}
            onRequestCallback={() => {
              trackLaunchDealerAssistance({
                sourcePage: "car_details",
                surface: "request_callback",
              });
              openInquiry(
                "Request a callback",
                "Request callback"
              );
            }}
            onGetBestDeal={() => {
              trackLaunchDealerAssistance({
                sourcePage: "car_details",
                surface: "get_best_deal",
              });
              openInquiry("Get the best deal", "Get best deal");
            }}
            onTestDrive={openTestDrive}
            onFinanceHelp={() => handleFinanceHelp("action_bar")}
            onCompare={handleCompareEv}
          />

          <DetailTabs
            activeId={activeTab}
            onSelect={handleNavSelect}
            tabs={pageNavTabs}
          />

          {pageSections.map((section) => {
            const SectionComponent = section.Component;
            return (
              <section
                key={section.id}
                id={section.id}
                className={section.shellClassName}
              >
                <SectionComponent page={detailPage} />
              </section>
            );
          })}

          {safety.length > 0 && (
            <section className="cd-section cd-card cd-content-card">
              <h2 className="cd-section__title">Safety</h2>
              <div className="cd-features-grid">
                {safety.map((item) => (
                  <div
                    key={typeof item === "string" ? item : String(item)}
                    className="cd-feature-chip"
                  >
                    🛡 {item}
                  </div>
                ))}
              </div>
            </section>
          )}

          <CompareInternalLinks
            contextSlugs={[familySlug]}
            className="compare-internal-links--detail"
          />

          <LeadInquiryModal
            isOpen={inquiryOpen}
            onClose={() => setInquiryOpen(false)}
            sourcePage="car_details"
            modelName={familyTitle}
            vehicleName={vehicle.name}
            vehicleId={String(vehicle.slug || vehicle._id || "")}
            mongoCarId={String(vehicle._id || "")}
            headline={inquiryHeadline}
            subtitle={inquirySubtitle}
            submitLabel={inquirySubmit}
            leadMetadata={inquiryLeadMetadata}
          />

          <LeadInquiryModal
            isOpen={testDriveOpen}
            onClose={() => setTestDriveOpen(false)}
            sourcePage="car_details_test_drive"
            formMode="test_drive"
            modelName={familyTitle}
            vehicleId={String(
              selectedVariant?.slug || vehicle.slug || ""
            )}
            mongoCarId={String(vehicle._id || "")}
            headline="Book a test drive"
            submitLabel="Request test drive"
            defaultVariantSlug={selectedVariantSlug}
            variantOptions={enrichedVariants.map((v) => ({
              slug: v.slug,
              label: v.variantLabel || v.name,
            }))}
            leadMetadata={{
              familySlug,
              variantSlug: selectedVariantSlug,
              brand: vehicle.brand || "",
            }}
          />
        </div>
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

const familyMetaLine = {
  fontSize: "15px",
  color: "#64748b",
  margin: "0 0 12px",
  lineHeight: 1.5,
};

const variantPriceHint = {
  fontSize: "0.55em",
  fontWeight: "600",
  color: "#64748b",
};

const variantRangeHint = {
  display: "block",
  fontSize: "13px",
  color: "#64748b",
  marginTop: "4px",
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