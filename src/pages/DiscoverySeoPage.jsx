import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import SEO from "../components/SEO/SEO";
import JsonLd from "../components/SEO/JsonLd";
import SeoPageIntro from "../components/SEO/SeoPageIntro";
import SeoRecommendationList from "../components/SEO/SeoRecommendationList";
import SeoTradeoffs from "../components/SEO/SeoTradeoffs";
import SeoFaqBlock from "../components/SEO/SeoFaqBlock";
import SeoRelatedLinks from "../components/SEO/SeoRelatedLinks";

import useDiscoveryPage from "../hooks/useDiscoveryPage";
import { resolveDiscoveryRoute, PAGE_TYPES } from "../seo/registry";
import { buildGuidePageMeta, stripBrandSuffix } from "../seo/meta";
import { buildDiscoveryPageSchemas } from "../seo/schema";
import { getDiscoveryLinkSections } from "../seo/internalLinks";
import { replaceCompareCars } from "../utils/compareCarsStorage";
import {
  trackDiscoveryPageView,
  trackSeoCtaClicked,
  trackCompareGuideClicked,
} from "../content/tracking/discoveryAnalytics";

const PAGE_TYPE_LABELS = {
  [PAGE_TYPES.BEST_EVS]: "Best EVs",
  [PAGE_TYPES.CHARGING_GUIDE]: "Charging",
  [PAGE_TYPES.OWNERSHIP_GUIDE]: "Ownership",
  [PAGE_TYPES.COMPARE_GUIDE]: "Compare",
  [PAGE_TYPES.BRAND]: "Brands",
  [PAGE_TYPES.CITY_EVS]: "Cities",
  [PAGE_TYPES.CITY_CHARGING]: "Charging",
};

export default function DiscoverySeoPage({ pageType }) {
  const params = useParams();
  const navigate = useNavigate();

  const routeContext = useMemo(
    () => resolveDiscoveryRoute(pageType, params),
    [pageType, params]
  );

  const { seoPage, loading, error, retry } =
    useDiscoveryPage(routeContext);

  useEffect(() => {
    if (!seoPage || !routeContext || loading || error) return;
    trackDiscoveryPageView(routeContext, seoPage);
  }, [seoPage, routeContext, loading, error]);

  if (!routeContext) {
    return (
      <div style={styles.page}>
        <Helmet>
          <title>Page not found | EVSavari</title>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <div style={styles.notFound}>
          <h1>Invalid discovery URL</h1>
          <p>
            <Link to="/guides">Browse EV guides</Link>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loader}>Loading guide…</div>
      </div>
    );
  }

  if (error || !seoPage) {
    return (
      <div style={styles.page}>
        <Helmet>
          <title>Guide unavailable | EVSavari</title>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <div style={styles.notFound}>
          <h1>Guide not found</h1>
          <p>
            <Link to="/guides">All EV guides</Link> ·{" "}
            <Link to="/cars">Browse EVs</Link>
          </p>
          <button type="button" style={styles.retryBtn} onClick={retry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const canonical =
    routeContext.canonicalUrl || seoPage.canonicalUrl;
  const meta = buildGuidePageMeta(seoPage, canonical);
  const isCompare = seoPage.category === "compare";
  const typeLabel = PAGE_TYPE_LABELS[pageType] || "Guides";

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: typeLabel, url: "/guides" },
    {
      name: stripBrandSuffix(seoPage.title),
      url: canonical,
    },
  ];

  const schemas = buildDiscoveryPageSchemas({
    seoPage,
    canonicalUrl: canonical,
    breadcrumbs,
  });

  const linkSections = getDiscoveryLinkSections(seoPage);
  const discoveryPath = routeContext.path || "";

  const openCompareTool = () => {
    const ranked = seoPage.rankedVehicles || [];
    if (ranked.length < 2) return;
    const cars = ranked.map((v) => ({
      slug: v.slug,
      name: v.displayName || v.slug,
      startingPrice: v.exShowroom,
      specifications: { range: v.claimedRangeKm },
    }));
    const list = replaceCompareCars(cars);
    trackCompareGuideClicked(routeContext, seoPage, {
      action: "open_compare_tool",
      vehicleSlugs: ranked.map((v) => v.slug),
    });
    navigate("/compare", {
      state: { cars: list, variantCompareSession: true },
    });
  };

  return (
    <div style={styles.page}>
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        type="article"
      />

      {schemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}

      <article style={styles.article}>
        <nav style={styles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/guides">Guides</Link>
          <span> / </span>
          <span>{typeLabel}</span>
        </nav>

        <h1 style={styles.h1}>{meta.h1}</h1>

        <SeoPageIntro
          intro={seoPage.intro}
          recommendationLogic={seoPage.recommendationLogic}
        />

        <SeoRecommendationList
          rankedVehicles={seoPage.rankedVehicles}
          isCompare={isCompare}
          seoPageSlug={seoPage.slug}
          sourcePage={discoveryPath}
        />

        <SeoTradeoffs tradeoffs={seoPage.tradeoffs} />

        {isCompare && seoPage.rankedVehicles?.length >= 2 && (
          <section style={styles.compareCta}>
            <button
              type="button"
              style={styles.compareBtn}
              onClick={openCompareTool}
            >
              Open full compare tool →
            </button>
          </section>
        )}

        <SeoFaqBlock faq={seoPage.faq} />

        <SeoRelatedLinks sections={linkSections} />

        <p style={styles.disclaimer}>
          Rankings use catalog intelligence composites — not paid placements.
          Verify prices, charging access, and on-road costs locally before buying.
        </p>
      </article>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "60vh",
    background: "#f8fafc",
    padding: "2rem 1rem 4rem",
  },
  article: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  breadcrumb: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: "1rem",
  },
  h1: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "1.5rem",
    lineHeight: 1.25,
  },
  loader: {
    textAlign: "center",
    color: "#64748b",
    padding: "4rem",
  },
  notFound: {
    maxWidth: "480px",
    margin: "4rem auto",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: "1rem",
    padding: "0.65rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  compareCta: { marginBottom: "2rem" },
  compareBtn: {
    display: "inline-block",
    padding: "0.75rem 1.25rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
  },
  disclaimer: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    lineHeight: 1.5,
    marginTop: "2rem",
  },
};
