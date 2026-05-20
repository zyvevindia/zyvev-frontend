/**
 * Trust & methodology page content — SEO-friendly, human-readable.
 */

export const HOW_EVSAVARI_WORKS = {
  pageTitle: "How EVSavari Works | India's EV Intelligence Layer",
  title: "How EVSavari works",
  subtitle:
    "Transparent EV intelligence for India — compare, understand running costs, and connect with dealers without hype.",
  sections: [
    {
      id: "intelligence",
      heading: "Deterministic intelligence",
      text:
        "We build structured EV intelligence from catalog specifications and clearly labelled estimates. We do not invent missing OEM data or present guesses as facts.",
    },
    {
      id: "compare",
      heading: "Compare with context",
      text:
        "Side-by-side compare highlights range bands, charging practicality, and ownership estimates — with confidence labels where data is estimated.",
    },
    {
      id: "leads",
      heading: "Dealer connection",
      text:
        "Enquiry forms route to pilot partners or our ops queue. We do not guarantee availability or on-road price — always confirm with the dealer.",
    },
    {
      id: "beta",
      heading: "Early access",
      text:
        "During soft launch, some models may show partial data or need editorial review. Freshness indicators explain how recently information was verified.",
    },
  ],
  links: [
    { label: "Scoring methodology", href: "/trust/scoring" },
    { label: "Data freshness", href: "/trust/freshness" },
    { label: "Ownership estimates", href: "/trust/ownership" },
    { label: "Browse EVs", href: "/cars" },
  ],
};

export const TRUST_SCORING_PAGE = {
  pageTitle: "EVSavari Scoring Methodology",
  title: "EVSavari scoring",
  subtitle: "Rule-based scores — not paid placements or black-box AI.",
  sections: [
    {
      heading: "Composite score",
      text:
        "Family-level scores combine range confidence, charging convenience, ownership value, and suitability tags. Weights are fixed in our scoring engine and applied consistently.",
    },
    {
      heading: "Sub-scores",
      text:
        "City, highway, family, and budget suitability use taxonomy bands and catalog signals. A high city score does not mean the EV wins every compare.",
    },
    {
      heading: "What scores are not",
      text:
        "Scores are planning guidance, not safety ratings or professional advice. Always test-drive and verify specs locally.",
    },
  ],
};

export const TRUST_FRESHNESS_PAGE = {
  pageTitle: "Data Freshness & Verification | EVSavari",
  title: "Data freshness",
  subtitle: "How we label stale, reviewed, and recently updated catalog data.",
  sections: [
    {
      heading: "Freshness states",
      text:
        "Fresh — verified within ~30 days. Recently verified — within ~90 days. Needs review — unreviewed or aging catalog. Potentially stale — review older than ~180 days.",
    },
    {
      heading: "Change detection",
      text:
        "When OEM price or specs change, we record structured diffs for human review. We do not auto-publish unverified overrides.",
    },
    {
      heading: "Your responsibility",
      text:
        "ARAI range, charging access, and on-road price vary by city. Use our bands and notes as a starting point, not a contract.",
    },
  ],
};

export const TRUST_OWNERSHIP_PAGE = {
  pageTitle: "Ownership & Running Cost Estimates | EVSavari",
  title: "Ownership estimates",
  subtitle: "Transparent assumptions for charging cost and savings vs petrol.",
  sections: [
    {
      heading: "Assumptions",
      text:
        "Monthly km, blended electricity tariff, and km/kWh efficiency (from battery and range when available). Petrol comparison uses indicative ₹/km — not your exact fuel bill.",
    },
    {
      heading: "Battery degradation",
      text:
        "Capacity reduces over time; OEM warranties cover defined thresholds. We surface warranty summaries when catalog data exists.",
    },
    {
      heading: "Disclaimer",
      text:
        "Figures are planning estimates only. Insurance, finance, and society charging costs are excluded unless stated.",
    },
  ],
};
