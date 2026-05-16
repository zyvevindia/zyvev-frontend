/**
 * Buyer persona fit — maps catalog intelligence scores to display labels.
 */

export const PERSONA_DEFINITIONS = [
  {
    id: "city_commuter",
    label: "Best for city commuters",
    scoreKey: "cityCommuter",
    minScore: 78,
  },
  {
    id: "family_ev",
    label: "Best family EV",
    scoreKey: "familyEv",
    minScore: 76,
  },
  {
    id: "highway_ev",
    label: "Best highway EV",
    scoreKey: "highwayTourer",
    minScore: 75,
  },
  {
    id: "first_ev",
    label: "Best first EV",
    scoreKey: "firstEv",
    minScore: 80,
  },
  {
    id: "premium_ev",
    label: "Best premium EV",
    scoreKey: "premiumEv",
    minScore: 78,
  },
  {
    id: "value_ev",
    label: "Best value EV",
    scoreKey: "valueEv",
    minScore: 82,
  },
];

/**
 * @param {object} catalogMeta
 * @param {number} max
 * @returns {{ id: string, label: string, score: number }[]}
 */
export function pickPersonaFits(catalogMeta, max = 3) {
  const fit = catalogMeta?.personaFit;
  if (!fit) {
    return pickPersonaFitsFromLegacyScores(
      catalogMeta?.psychologyScores,
      catalogMeta?.suitabilityScores,
      catalogMeta?.compareValueScore,
      max
    );
  }

  const picked = [];
  for (const def of PERSONA_DEFINITIONS) {
    const score = fit[def.scoreKey];
    if (score != null && score >= def.minScore) {
      picked.push({
        id: def.id,
        label: def.label,
        score,
      });
    }
  }

  picked.sort((a, b) => b.score - a.score);
  return picked.slice(0, max);
}

function pickPersonaFitsFromLegacyScores(
  psych = {},
  suit = {},
  valueScore,
  max
) {
  const candidates = [
    {
      id: "city_commuter",
      label: "Best for city commuters",
      score: psych.best_for_city ?? suit.city,
    },
    {
      id: "family_ev",
      label: "Best family EV",
      score: psych.best_for_family ?? suit.family,
    },
    {
      id: "highway_ev",
      label: "Best highway EV",
      score: suit.highway,
    },
    {
      id: "first_ev",
      label: "Best first EV",
      score: psych.best_first_ev,
    },
    {
      id: "premium_ev",
      label: "Best premium EV",
      score: psych.premium_feel,
    },
    {
      id: "value_ev",
      label: "Best value EV",
      score: valueScore,
    },
  ].filter((c) => c.score != null && c.score >= 75);

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, max);
}
