import { Link } from "react-router-dom";

import SeoTradeoffs from "../SEO/SeoTradeoffs";
import SeoFaqBlock from "../SEO/SeoFaqBlock";
import SeoRelatedLinks from "../SEO/SeoRelatedLinks";
import EditorialTransparency from "../trust/EditorialTransparency";
import ConfidenceExplainer from "../trust/ConfidenceExplainer";

/**
 * Below-the-fold SEO / editorial blocks for /compare/:slug (crawlable, not above-fold).
 * Intro + methodology at top of compare UI live in CompareUtilityRail / hero only.
 */
export default function CompareGuideEditorialSections({
  seoPage,
  linkSections = [],
  discoveryPath = "",
  typeLabel = "Compare",
}) {
  if (!seoPage) return null;

  return (
    <article className="compare-guide-editorial" aria-label="Comparison guide details">
      <nav className="compare-guide-editorial__breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span> / </span>
        <Link to="/guides">Guides</Link>
        <span> / </span>
        <span>{typeLabel}</span>
      </nav>

      <h2 className="compare-guide-editorial__heading">About this comparison</h2>

      {seoPage.intro ? (
        <p className="compare-guide-editorial__intro">{seoPage.intro}</p>
      ) : null}

      <ConfidenceExplainer />

      <SeoTradeoffs tradeoffs={seoPage.tradeoffs} />

      <SeoFaqBlock faq={seoPage.faq} />

      <SeoRelatedLinks sections={linkSections} />

      <EditorialTransparency compact />

      <p className="compare-guide-editorial__disclaimer">
        Rankings use catalog intelligence composites — not paid placements. Verify
        prices, charging access, and on-road costs locally before buying.
      </p>
    </article>
  );
}
