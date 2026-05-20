import SeoTradeoffs from "../SEO/SeoTradeoffs";
import SeoFaqBlock from "../SEO/SeoFaqBlock";

/**
 * Compact SEO block for /compare/:slug — below real-world comparison only.
 * Methodology + usefulness live in CompareUtilityRail (no duplication here).
 */
export default function CompareGuideEditorialSections({ seoPage }) {
  if (!seoPage) return null;

  return (
    <article
      className="compare-guide-editorial"
      aria-label="Comparison guide details"
    >
      <h2 className="compare-guide-editorial__heading">About this comparison</h2>

      {seoPage.intro ? (
        <p className="compare-guide-editorial__intro">{seoPage.intro}</p>
      ) : null}

      <div className="compare-guide-editorial__tradeoffs">
        <SeoTradeoffs tradeoffs={seoPage.tradeoffs} />
      </div>

      <div className="compare-guide-editorial__faq">
        <SeoFaqBlock faq={seoPage.faq} />
      </div>
    </article>
  );
}
