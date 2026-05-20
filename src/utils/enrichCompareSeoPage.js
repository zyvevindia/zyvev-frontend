import { extractFamilySlug } from "./modelFamily";
import { normalizeVehicleSlug } from "./vehicleRoutes";
import { resolveFullDisplayName } from "./vehicleDisplayName";

function buildNameMap(guideCars) {
  const map = new Map();
  for (const car of guideCars || []) {
    const family = normalizeVehicleSlug(extractFamilySlug(car.slug));
    if (!family) continue;
    map.set(family, car.fullDisplayName || resolveFullDisplayName(car));
  }
  return map;
}

function replaceLegacyNames(text, seoPage, nameByFamily) {
  let out = String(text || "");
  for (const rv of seoPage?.rankedVehicles || []) {
    const legacy = String(rv.displayName || "").trim();
    const family = normalizeVehicleSlug(rv.slug);
    const full = nameByFamily.get(family);
    if (legacy && full && legacy !== full) {
      out = out.split(legacy).join(full);
    }
  }
  return out;
}

/**
 * Align SEO copy with catalog full names (e.g. "MG Comet EV Play", not "Mg Play").
 */
export function enrichCompareSeoPage(seoPage, guideCars) {
  if (!seoPage) return seoPage;
  const nameByFamily = buildNameMap(guideCars);

  const rankedVehicles = (seoPage.rankedVehicles || []).map((rv) => {
    const family = normalizeVehicleSlug(rv.slug);
    const displayName =
      nameByFamily.get(family) ||
      resolveFullDisplayName(
        { name: rv.displayName, slug: rv.slug },
        { seoDisplayName: rv.displayName }
      );
    return { ...rv, displayName };
  });

  const tradeoffs = seoPage.tradeoffs
    ? {
        ...seoPage.tradeoffs,
        summary: replaceLegacyNames(
          seoPage.tradeoffs.summary,
          seoPage,
          nameByFamily
        ),
        considerations: (seoPage.tradeoffs.considerations || []).map(
          (row) => ({
            ...row,
            tradeoff: replaceLegacyNames(
              row.tradeoff,
              seoPage,
              nameByFamily
            ),
          })
        ),
      }
    : seoPage.tradeoffs;

  const faq = (seoPage.faq || []).map((item) => ({
    ...item,
    question: replaceLegacyNames(item.question, seoPage, nameByFamily),
    answer: replaceLegacyNames(item.answer, seoPage, nameByFamily),
  }));

  return {
    ...seoPage,
    rankedVehicles,
    intro: replaceLegacyNames(seoPage.intro, seoPage, nameByFamily),
    tradeoffs,
    faq,
  };
}
