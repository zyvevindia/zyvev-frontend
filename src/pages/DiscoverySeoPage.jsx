import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import SEO from "../components/SEO/SEO";
import JsonLd from "../components/SEO/JsonLd";
import SeoPageIntro from "../components/SEO/SeoPageIntro";
import SeoRecommendationList from "../components/SEO/SeoRecommendationList";
import SeoTradeoffs from "../components/SEO/SeoTradeoffs";
import SeoFaqBlock from "../components/SEO/SeoFaqBlock";
import SeoRelatedLinks from "../components/SEO/SeoRelatedLinks";

import CompareHeroExperience from "../components/compare/CompareHeroExperience";
import CompareGuideEditorialSections from "../components/compare/CompareGuideEditorialSections";
import CompareGuideLoading from "../components/compare/CompareGuideLoading";

import useDiscoveryPage from "../hooks/useDiscoveryPage";
import useCompareGuideCars from "../hooks/useCompareGuideCars";
import { resolveDiscoveryRoute, PAGE_TYPES } from "../seo/registry";
import { buildGuidePageMeta, stripBrandSuffix } from "../seo/meta";
import { buildCompareGuidePageMeta } from "../seo/pageMetadata";
import { buildDiscoveryPageSchemas } from "../seo/schema";
import { getDiscoveryLinkSections } from "../seo/internalLinks";
import {
  trackDiscoveryPageView,
  trackCompareGuideClicked,
} from "../content/tracking/discoveryAnalytics";
import WhatsAppLeadCta from "../components/leads/WhatsAppLeadCta";
import MethodologyPanel from "../components/trust/MethodologyPanel";
import EditorialTransparency from "../components/trust/EditorialTransparency";
import OwnershipPracticality from "../components/trust/OwnershipPracticality";
import ConfidenceExplainer from "../components/trust/ConfidenceExplainer";

import "../styles/compare-page.css";

const PAGE_TYPE_LABELS = {
  [PAGE_TYPES.BEST_EVS]: "Best EVs",
  [PAGE_TYPES.CHARGING_GUIDE]: "Charging",
  [PAGE_TYPES.OWNERSHIP_GUIDE]: "Ownership",
  [PAGE_TYPES.COMPARE_GUIDE]: "Compare",
  [PAGE_TYPES.BRAND]: "Brands",
  [PAGE_TYPES.CITY_EVS]: "Cities",
  [PAGE_TYPES.CITY_CHARGING]: "Charging",
};

const editorialPageStyles = {
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
  disclaimer: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    lineHeight: 1.5,
    marginTop: "2rem",
  },
};

export default function DiscoverySeoPage({ pageType }) {
  const params = useParams();

  const routeContext = useMemo(
    () => resolveDiscoveryRoute(pageType, params),
    [pageType, params]
  );

  const { seoPage, loading, error, retry } =
    useDiscoveryPage(routeContext);

  const isCompareGuide =
    pageType === PAGE_TYPES.COMPARE_GUIDE ||
    seoPage?.category === "compare";

  const {
    cars: guideCars,
    loading: guideCarsLoading,
  } = useCompareGuideCars(isCompareGuide ? seoPage : null);

  useEffect(() => {
    if (!seoPage || !routeContext || loading || error) return;
    trackDiscoveryPageView(routeContext, seoPage);
  }, [seoPage, routeContext, loading, error]);

  useEffect(() => {
    if (
      !isCompareGuide ||
      !seoPage ||
      !routeContext ||
      guideCarsLoading ||
      guideCars.length < 2
    ) {
      return;
    }
    trackCompareGuideClicked(routeContext, seoPage, {
      action: "inline_compare_experience",
      vehicleSlugs: guideCars.map((c) => c.slug).filter(Boolean),
    });
  }, [
    isCompareGuide,
    seoPage,
    routeContext,
    guideCarsLoading,
    guideCars,
  ]);

  if (!routeContext) {
    return (
      <div style={editorialPageStyles.page}>
        <Helmet>
          <title>Page not found | EVSavari</title>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <div style={editorialPageStyles.notFound}>
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
      <div className={isCompareGuide ? "compare-guide-page" : undefined} style={!isCompareGuide ? editorialPageStyles.page : undefined}>
        {isCompareGuide ? (
          <CompareGuideLoading />
        ) : (
          <div style={editorialPageStyles.loader}>Loading guide…</div>
        )}
      </div>
    );
  }

  if (error || !seoPage) {
    return (
      <div style={editorialPageStyles.page}>
        <Helmet>
          <title>Guide unavailable | EVSavari</title>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <div style={editorialPageStyles.notFound}>
          <h1>Guide not found</h1>
          <p>
            <Link to="/guides">All EV guides</Link> ·{" "}
            <Link to="/cars">Browse EVs</Link>
          </p>
          <button type="button" style={editorialPageStyles.retryBtn} onClick={retry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const canonical =
    routeContext.canonicalUrl || seoPage.canonicalUrl;
  const meta = isCompareGuide
    ? buildCompareGuidePageMeta(seoPage, canonical)
    : buildGuidePageMeta(seoPage, canonical);
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

  /* —— Compare guide: premium compare engine above the fold —— */
  if (isCompareGuide) {
    const introLine =
      typeof seoPage.intro === "string"
        ? seoPage.intro.split(/(?<=[.!?])\s+/)[0]
        : "";

    return (
      <div className="compare-guide-page">
        <SEO
          title={meta.title}
          description={meta.description}
          canonical={meta.canonical}
          type="article"
        />

        {schemas.map((schema, i) => (
          <JsonLd key={i} data={schema} />
        ))}

        <div className="compare-guide-page__breadcrumb-bar">
          <nav aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span> / </span>
            <Link to="/guides">Guides</Link>
            <span> / </span>
            <Link to="/compare">Compare</Link>
          </nav>
        </div>

        {guideCarsLoading ? (
          <CompareGuideLoading />
        ) : guideCars.length >= 2 ? (
          <CompareHeroExperience
            cars={guideCars}
            sourcePage={discoveryPath}
            variant="guide"
            heroTitle={meta.h1}
            heroSubtitle={introLine || meta.description}
            heroBadge="EV comparison"
            showClearComparison={false}
            enableFab
          />
        ) : (
          <div style={{ padding: "2rem 20px", textAlign: "center", color: "#64748b" }}>
            <p>
              Catalog data for this pair is temporarily unavailable.{" "}
              <Link to="/compare">Try the compare hub</Link> or{" "}
              <Link to="/cars">browse EVs</Link>.
            </p>
          </div>
        )}

        <CompareGuideEditorialSections
          seoPage={seoPage}
          linkSections={linkSections}
          discoveryPath={discoveryPath}
          typeLabel={typeLabel}
        />
      </div>
    );
  }

  /* —— Non-compare discovery pages (unchanged editorial layout) —— */
  return (
    <div style={editorialPageStyles.page}>
      <SEO
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        type="article"
      />

      {schemas.map((schema, i) => (
        <JsonLd key={i} data={schema} />
      ))}

      <article style={editorialPageStyles.article}>
        <nav style={editorialPageStyles.breadcrumb} aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/guides">Guides</Link>
          <span> / </span>
          <span>{typeLabel}</span>
        </nav>

        <h1 style={editorialPageStyles.h1}>{meta.h1}</h1>

        <SeoPageIntro
          intro={seoPage.intro}
          recommendationLogic={seoPage.recommendationLogic}
        />

        <MethodologyPanel
          recommendationLogic={seoPage.recommendationLogic}
          category={seoPage.category}
        />

        {(seoPage.category === "ownership" ||
          seoPage.category === "city") && (
          <OwnershipPracticality
            bullets={
              Array.isArray(seoPage.tradeoffs)
                ? seoPage.tradeoffs
                : undefined
            }
          />
        )}

        <SeoRecommendationList
          rankedVehicles={seoPage.rankedVehicles}
          isCompare={false}
          seoPageSlug={seoPage.slug}
          sourcePage={discoveryPath}
        />

        <ConfidenceExplainer />

        <div style={{ margin: "1.5rem 0", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <WhatsAppLeadCta
            sourcePage={discoveryPath}
            seoPageSlug={seoPage.slug}
            city={routeContext.params?.city || ""}
            vehicleName={
              seoPage.rankedVehicles?.[0]
                ? seoPage.rankedVehicles[0].displayName
                : ""
            }
            vehicleSlug={
              seoPage.rankedVehicles?.[0]
                ? seoPage.rankedVehicles[0].slug
                : ""
            }
            intent="guide"
            variant="secondary"
          />
        </div>

        <SeoTradeoffs tradeoffs={seoPage.tradeoffs} />

        <SeoFaqBlock faq={seoPage.faq} />

        <SeoRelatedLinks sections={linkSections} />

        <EditorialTransparency compact />

        <p style={editorialPageStyles.disclaimer}>
          Rankings use catalog intelligence composites — not paid placements.
          Verify prices, charging access, and on-road costs locally before buying.
        </p>
      </article>
    </div>
  );
}
