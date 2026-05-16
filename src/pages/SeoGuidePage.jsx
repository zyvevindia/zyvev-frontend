import { Link, useParams } from "react-router-dom";

import { Helmet } from "react-helmet-async";

import SEO from "../components/SEO/SEO";
import JsonLd from "../components/SEO/JsonLd";

import SeoPageIntro from "../components/SEO/SeoPageIntro";
import SeoRecommendationList from "../components/SEO/SeoRecommendationList";
import SeoTradeoffs from "../components/SEO/SeoTradeoffs";
import SeoFaqBlock from "../components/SEO/SeoFaqBlock";

import useSeoPage from "../hooks/useSeoPage";

import { canonicalSeoPageUrl } from "../utils/seoRoutes";

import {
  buildSeoGuideBreadcrumbs,
  buildFaqPageSchema,
} from "../utils/structuredData";

export default function SeoGuidePage() {
  const { slug } = useParams();
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
  const canonical = seoPage.canonicalUrl || canonicalSeoPageUrl(seoPage.slug);

  const breadcrumbSchema = buildSeoGuideBreadcrumbs(seoPage);
  const faqPageSchema = buildFaqPageSchema(seoPage.faq, canonical);

  return (
    <div style={styles.page}>
      <SEO
        title={seoPage.title}
        description={seoPage.metaDescription}
        canonical={canonical}
        type="article"
      />

      <JsonLd data={breadcrumbSchema} />
      {faqPageSchema && <JsonLd data={faqPageSchema} />}

      <article style={styles.article}>
        <nav style={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/cars">EVs</Link>
          <span> / </span>
          <span>Guide</span>
        </nav>

        <h1 style={styles.h1}>{seoPage.title.replace(/ \| EVSavari$/, "")}</h1>

        <SeoPageIntro
          intro={seoPage.intro}
          recommendationLogic={seoPage.recommendationLogic}
        />

        <SeoRecommendationList
          rankedVehicles={seoPage.rankedVehicles}
          isCompare={isCompare}
          seoPageSlug={seoPage.slug}
        />

        <SeoTradeoffs tradeoffs={seoPage.tradeoffs} />

        {isCompare && seoPage.rankedVehicles.length >= 2 && (
          <section style={styles.compareCta}>
            <Link
              to={`/compare?cars=${seoPage.rankedVehicles.map((v) => v.slug).join(",")}`}
              style={styles.compareLink}
            >
              Open full compare tool →
            </Link>
          </section>
        )}

        <SeoFaqBlock faq={seoPage.faq} />

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
    textDecoration: "none",
    fontWeight: 600,
  },
  disclaimer: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    lineHeight: 1.5,
    marginTop: "2rem",
  },
};
