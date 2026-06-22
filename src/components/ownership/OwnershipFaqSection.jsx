import { Link } from "react-router-dom";

import { buildOwnershipFaqs } from "../../ownership/buildOwnershipFaqs.js";
import { OWNERSHIP_FAQ_CATEGORIES } from "../../ownership/ownershipFaqConstants.js";
import { isEditorialReviewAvailable } from "../../reviews/reviewRoutes.js";

import "./ownership-faq.css";

/**
 * @param {import("../../ownership/buildOwnershipFaqs.js").OwnershipFaqSegment} segment
 * @returns {import("react").ReactNode}
 */
function renderFaqSegment(segment) {
  if (segment.type === "link") {
    return (
      <Link key={`${segment.href}-${segment.label}`} to={segment.href}>
        {segment.label}
      </Link>
    );
  }
  return segment.value;
}

/**
 * @param {{
 *   pageType: import("../../pages/ownership/ownershipRoutes.js").OwnershipPageType,
 *   vehicleSlug: string,
 *   vehicleName: string,
 *   summaryText?: string,
 * }} props
 */
export default function OwnershipFaqSection({
  pageType,
  vehicleSlug,
  vehicleName,
  summaryText = "",
}) {
  const items = buildOwnershipFaqs({
    pageType,
    vehicleSlug,
    vehicleName,
    summaryText,
    hasReview: isEditorialReviewAvailable(vehicleSlug),
  });

  if (!items.length) return null;

  const categoryLabel = OWNERSHIP_FAQ_CATEGORIES[pageType]?.label;

  return (
    <section
      className="ownership-faq"
      aria-labelledby="ownership-faq-title"
    >
      <h2 id="ownership-faq-title" className="ownership-faq__title">
        {categoryLabel ? `${categoryLabel} FAQs` : "Frequently asked questions"}
      </h2>

      <div className="ownership-faq__list">
        {items.map((item) => (
          <details key={item.id} className="ownership-faq__item">
            <summary className="ownership-faq__question">{item.question}</summary>
            <div className="ownership-faq__answer">
              {item.answerSegments.map((segment, index) => (
                <span key={`${item.id}-${index}`}>
                  {renderFaqSegment(segment)}
                </span>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
