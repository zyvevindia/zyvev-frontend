/**
 * Lightweight decision signals for listing/compare cards.
 */

import { formatPsychologyTag } from "./catalogExperience";

const DISPLAY_SIGNALS = [
  {
    id: "city",
    label: "Best for City Driving",
    tag: "best_for_city",
    scoreKey: "best_for_city",
    minScore: 78,
  },
  {
    id: "family",
    label: "Family Friendly",
    tag: "best_for_family",
    scoreKey: "best_for_family",
    minScore: 75,
  },
  {
    id: "long_range",
    label: "Long Range",
    derive: (ctx) =>
      (ctx.claimedRangeKm ?? ctx.range ?? 0) >= 400,
  },
  {
    id: "premium",
    label: "Premium Experience",
    tag: "premium_feel",
    scoreKey: "premium_feel",
    minScore: 78,
    altTags: ["wow_factor", "tech_appeal"],
  },
  {
    id: "value",
    label: "Value for Money",
    derive: (ctx) =>
      (ctx.compareValueScore ?? 0) >= 82,
  },
  {
    id: "fast_charge",
    label: "Fast Charging",
    derive: (ctx) => {
      const dc = ctx.dcMinutes;
      if (dc != null && dc <= 45) return true;
      const summary = String(ctx.chargingSummary || "").toLowerCase();
      return (
        summary.includes("dc") &&
        (summary.includes("kw") || summary.includes("min"))
      );
    },
  },
];

function parseDcMinutes(chargingSummary) {
  const m = String(chargingSummary || "").match(
    /(\d+)\s*min/i
  );
  return m ? Number(m[1]) : null;
}

/**
 * Pick up to `max` signals for card display.
 */
export function pickListingSignals(car, max = 2) {
  const meta = car?.catalogMeta;
  if (!meta && !car?.specifications) return [];

  const tags = new Set(meta?.psychologyTags || []);
  const scores = meta?.psychologyScores || {};
  const ctx = {
    claimedRangeKm: meta?.claimedRangeKm,
    range: car?.range ?? car?.specifications?.range,
    compareValueScore: meta?.compareValueScore,
    chargingSummary: meta?.chargingSummary,
    dcMinutes: parseDcMinutes(meta?.chargingSummary),
  };

  const picked = [];

  for (const rule of DISPLAY_SIGNALS) {
    if (picked.length >= max) break;

    let match = false;

    if (rule.tag && tags.has(rule.tag)) {
      match = true;
    } else if (
      rule.scoreKey &&
      (scores[rule.scoreKey] ?? 0) >= (rule.minScore ?? 75)
    ) {
      match = true;
    } else if (rule.altTags?.some((t) => tags.has(t))) {
      match = true;
    } else if (rule.derive?.(ctx)) {
      match = true;
    }

    if (match) {
      picked.push({
        id: rule.id,
        label: rule.label,
      });
    }
  }

  if (picked.length < max && tags.size > 0) {
    for (const tag of tags) {
      if (picked.length >= max) break;
      if (picked.some((p) => p.id === tag)) continue;
      const label = formatPsychologyTag(tag);
      if (
        DISPLAY_SIGNALS.some((r) => r.label === label)
      ) {
        continue;
      }
      picked.push({ id: tag, label });
    }
  }

  return picked.slice(0, max);
}
