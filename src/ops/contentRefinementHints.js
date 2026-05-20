/**
 * Human-readable refinement hints for editorial flag types (metadata-driven ops).
 */

export const CONTENT_REFINEMENT_HINTS = Object.freeze({
  needs_better_explanation: "Tighten the primary explanation block — lead with one decisive sentence, then evidence.",
  missing_faq: "Add 2–4 FAQs that address price, charging, and service reality for this audience.",
  review_needed: "Schedule a short editorial review — check specs vs OEM and trust labels.",
  quality_concern: "Cross-check numbers and remove any ambiguous claims; prefer bands where data is thin.",
  trust_copy_review: "Align trust copy with methodology pages — confidence vs estimate wording.",
  weak_faq: "Expand thin FAQ answers with concrete India-specific examples (no filler).",
  thin_compare_copy: "Strengthen compare rationale: decision criteria, not feature dumps.",
  weak_charging_guidance: "Clarify AC vs DC, apartment vs landed, and typical session times.",
  unclear_ownership_copy: "Spell out assumptions (tariff, km/year) in one visible line.",
  weak_recommendation_rationale: "Tie ranking to explicit score inputs readers can verify.",
});

/**
 * @param {string} flagType
 */
export function getContentRefinementHint(flagType) {
  return (
    CONTENT_REFINEMENT_HINTS[flagType] ||
    "Review content for clarity, accuracy, and trust alignment."
  );
}
