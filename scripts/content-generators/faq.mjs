export function buildCityEvsFaq(cityName) {
  return [
    {
      question: `Is an EV practical in ${cityName}?`,
      answer: `For most daily commuters under 80–100 km/day with home or workplace charging, yes — traffic patterns in ${cityName} often suit EV efficiency.`,
    },
    {
      question: `What should I check before buying an EV in ${cityName}?`,
      answer: "Confirm apartment or workplace charging access, realistic commute distance, and on-road price with a local dealer.",
    },
    {
      question: `Where can I compare charging guides?`,
      answer: "Browse our charging guides hub for home charging, commute, and lower charging-stress picks.",
    },
    {
      question: "Are rankings paid placements?",
      answer: "No — picks use catalog intelligence composites, not sponsored ordering.",
    },
  ];
}

export function buildCityChargingFaq(cityName) {
  return [
    {
      question: `How easy is home charging in ${cityName}?`,
      answer: "Depends on parking type — apartments may need society approval; independent homes are often simpler for AC wallbox installs.",
    },
    {
      question: `Are public chargers available in ${cityName}?`,
      answer: "Metro networks are expanding, but daily reliability still improves when you can charge at home or work.",
    },
    {
      question: "Which EVs reduce charging stress?",
      answer: "See our lower charging-stress guide for models with practical range bands and charging flexibility.",
    },
    {
      question: "Should I buy a portable charger first?",
      answer: "Many owners start with a 3-pin or Type-2 AC setup; confirm load limits with your electrician before install.",
    },
  ];
}

export function buildCompareFaq(leftName, rightName) {
  return [
    {
      question: `Which is better — ${leftName} or ${rightName}?`,
      answer: "Neither is a universal winner. Compare range, charging, space, and on-road budget for your use case.",
    },
    {
      question: "Should I test drive both?",
      answer: "Yes — seat comfort, visibility, and charging access at home/work matter beyond spec sheets.",
    },
    {
      question: "Can I open the full compare tool?",
      answer: "Use the compare button on this page to load both variants in EVSavari's interactive compare view.",
    },
    {
      question: "Are prices final?",
      answer: "Ex-showroom figures are indicative — confirm on-road price and offers with a dealer in your city.",
    },
  ];
}

export function buildOwnershipFaq(topicLabel) {
  return [
    {
      question: `What should I know about ${topicLabel} before buying an EV?`,
      answer: "Use this guide to weigh tradeoffs against your parking, commute, and budget — then shortlist models on EVSavari.",
    },
    {
      question: "Do all EVs behave the same here?",
      answer: "No — battery chemistry, charging speed, and service networks vary by brand and model family.",
    },
    {
      question: "Where can I compare models?",
      answer: "Browse best-EV guides by use case or open side-by-side comparisons from the guides hub.",
    },
    {
      question: "Is this financial advice?",
      answer: "No — ownership notes are educational; confirm insurance, warranty, and tax benefits locally.",
    },
  ];
}

export function buildBestEvsFaq(useCaseLabel) {
  return [
    {
      question: `Which EVs are well suited for ${useCaseLabel}?`,
      answer: "Picks on this page combine catalog scores for the stated use case — review tradeoffs before you decide.",
    },
    {
      question: "Why isn't there a single best EV?",
      answer: "Charging access, budget, and driving mix differ — we show well-suited options, not one-size-fits-all winners.",
    },
    {
      question: "How often is this list updated?",
      answer: "Rankings refresh as catalog intelligence and on-sale variants change.",
    },
    {
      question: "Can I compare two shortlisted models?",
      answer: "Yes — use compare guides or the compare tool after opening a model family page.",
    },
  ];
}
