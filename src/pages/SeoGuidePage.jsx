import { Link, useNavigate, useParams } from "react-router-dom";

import { Helmet } from "react-helmet-async";

import SEO from "../components/SEO/SEO";
import JsonLd from "../components/SEO/JsonLd";

import SeoPageIntro from "../components/SEO/SeoPageIntro";
import SeoRecommendationList from "../components/SEO/SeoRecommendationList";
import SeoTradeoffs from "../components/SEO/SeoTradeoffs";
import SeoFaqBlock from "../components/SEO/SeoFaqBlock";
import SeoRelatedLinks from "../components/SEO/SeoRelatedLinks";
import WhatsAppLeadCta from "../components/leads/WhatsAppLeadCta";
import MethodologyPanel from "../components/trust/MethodologyPanel";
import EditorialTransparency from "../components/trust/EditorialTransparency";
import OwnershipPracticality from "../components/trust/OwnershipPracticality";
import ConfidenceExplainer from "../components/trust/ConfidenceExplainer";

import useSeoPage from "../hooks/useSeoPage";

import { buildGuidePageMeta } from "../seo/meta";
import {
  resolveGuideCanonicalUrl,
  resolveGuideCanonicalPath,
} from "../seo/legacyCanonicalMap";
import { buildDiscoveryPageSchemas } from "../seo/schema";
import { getDiscoveryLinkSections } from "../seo/internalLinks";
import { replaceCompareCars } from "../utils/compareCarsStorage";

export default function SeoGuidePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { seoPage, loading, error, retry } = useSeoPage(slug);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loader}>Loading decision guide…</div>
      </div>
    );
  }

  if (error || !seoPage) {
    const isLoadFailed = error === "load_failed";

    return (
      <div style={styles.page}>
        <Helmet>
          <title>Guide unavailable | EVSavari</title>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <div style={styles.notFound}>
          <h1>
            {isLoadFailed
              ? "Could not load this guide"
              : "Guide not found"}
          </h1>
          <p>
            {isLoadFailed
              ? "Please check your connection and try again."
              : "This decision page is unavailable."}{" "}
            <Link to="/cars">Browse all EVs</Link>.
          </p>
          {isLoadFailed && (
            <button type="button" style={styles.retryBtn} onClick={retry}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const isCompare = seoPage.category === "compare";
  const canonical =
    seoPage.canonicalUrl || resolveGuideCanonicalUrl(seoPage.slug);
  const meta = buildGuidePageMeta(seoPage, canonical);

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: meta.h1, url: canonical },
  ];

  const schemas = buildDiscoveryPageSchemas({
    seoPage,
    canonicalUrl: canonical,
    breadcrumbs,
  });

  const linkSections = getDiscoveryLinkSections(seoPage);

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
          <span>Guide</span>
        </nav>

        <h1 style={styles.h1}>{meta.h1}</h1>

        <SeoPageIntro
          intro={seoPage.intro}
          recommendationLogic={seoPage.recommendationLogic}
        />

        <MethodologyPanel
          recommendationLogic={seoPage.recommendationLogic}
          category={seoPage.category}
        />

        {seoPage.category === "ownership" && (
          <OwnershipPracticality
            bullets={
              Array.isArray(seoPage.tradeoffs) ? seoPage.tradeoffs : undefined
            }
          />
        )}

        <SeoRecommendationList
          rankedVehicles={seoPage.rankedVehicles}
          isCompare={isCompare}
          seoPageSlug={seoPage.slug}
          sourcePage={resolveGuideCanonicalPath(seoPage.slug)}
        />

        <ConfidenceExplainer />

        <div style={{ margin: "1.25rem 0" }}>
          <WhatsAppLeadCta
            sourcePage={resolveGuideCanonicalPath(seoPage.slug)}
            seoPageSlug={seoPage.slug}
            vehicleName={seoPage.rankedVehicles?.[0]?.displayName}
            vehicleSlug={seoPage.rankedVehicles?.[0]?.slug}
            compareSlugs={
              isCompare
                ? seoPage.rankedVehicles.slice(0, 2).map((v) => v.slug)
                : []
            }
            intent={isCompare ? "compare" : "guide"}
            variant="secondary"
          />
        </div>

        <SeoTradeoffs tradeoffs={seoPage.tradeoffs} />

        {isCompare && seoPage.rankedVehicles.length >= 2 && (
          <section style={styles.compareCta}>
            <button
              type="button"
              style={styles.compareLink}
              onClick={openCompareTool}
            >
              Open full compare tool →
            </button>
          </section>
        )}

        <SeoFaqBlock faq={seoPage.faq} />

        <SeoRelatedLinks sections={linkSections} />

        <EditorialTransparency compact />

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
  compareCta: {
    marginBottom: "2rem",
  },
  compareLink: {
    display: "inline-block",
    padding: "0.75rem 1.25rem",
    background: "#2563eb",
    color: "#fff",
    borderRadius: "8px",
    border: "none",
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
