/**
 * EVSavari buyer archetype types.
 *
 * Archetypes describe buyer contexts — not vehicle rankings or scores.
 */

/**
 * @typedef {"low"|"moderate"|"high"} NeedLevel
 */

/**
 * Daily driving distance band in kilometres.
 *
 * @typedef {{
 *   min: number,
 *   max: number,
 *   unit?: string,
 * }} DailyKmRange
 */

/**
 * Purchase budget band in Indian lakh rupees.
 *
 * @typedef {{
 *   minLakh: number,
 *   maxLakh: number,
 *   openEnded?: boolean,
 * }} BudgetRange
 */

/**
 * Reusable buyer context used by fit engines and recommendation narratives.
 *
 * @typedef {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   dailyKmRange: DailyKmRange|null,
 *   budgetRange: BudgetRange|null,
 *   familyNeed: NeedLevel|null,
 *   highwayFrequency: NeedLevel|null,
 *   chargingSituation: string|null,
 *   priority: string,
 * }} BuyerArchetype
 */

/**
 * Deterministic fit output for one archetype ↔ vehicle pairing.
 *
 * @typedef {{
 *   fitTier: import("../score2/constants.js").ScoreTier,
 *   reasons: string[],
 *   cautions: string[],
 *   confidence: "high"|"medium"|"low",
 * }} ArchetypeFitResult
 */

/**
 * Human-readable recommendation narrative for one archetype ↔ vehicle pairing.
 *
 * @typedef {{
 *   headline: string,
 *   summary: string,
 *   whyItFits: string[],
 *   considerations: string[],
 * }} RecommendationNarrative
 */

/**
 * Normalized recommendation profile for one archetype ↔ vehicle pairing.
 *
 * @typedef {{
 *   archetypeId: string,
 *   fitTier: import("../score2/constants.js").ScoreTier,
 *   headline: string,
 *   summary: string,
 *   whyItFits: string[],
 *   considerations: string[],
 *   confidence: "high"|"medium"|"low",
 * }} BuyerRecommendationProfile
 */

/**
 * @typedef {{
 *   primaryRecommendation: string,
 *   supportingReasons: string[],
 *   tradeOffs: string[],
 *   confidenceStatement: string,
 * }} RecommendationExplanation
 */

export {};
