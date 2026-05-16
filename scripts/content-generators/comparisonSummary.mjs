import { slugToDisplay } from "./utils.mjs";

export function buildComparisonSummary(leftSlug, rightSlug) {
  const left = slugToDisplay(leftSlug);
  const right = slugToDisplay(rightSlug);

  return {
    summary: `Compare ${left} and ${right} on range, charging speed, cabin space, and on-road budget. Neither is positioned as a universal winner — weigh tradeoffs for your commute and parking setup.`,
    considerations: [
      {
        slug: leftSlug,
        tradeoff: `${left} may suit buyers prioritising brand familiarity and service access in their city — verify DC charging speed and boot space for your routine.`,
      },
      {
        slug: rightSlug,
        tradeoff: `${right} may suit buyers wanting different packaging or charging flexibility — confirm on-road price and nearest service centre before deciding.`,
      },
    ],
  };
}
