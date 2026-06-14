import { extractFamilySlug } from "./modelFamily";
import { normalizeVehicleSlug } from "./vehicleRoutes";
import { buildVehicleVariantDisplayName } from "./vehicleDisplayName";
import { ensureArray, safeMap } from "./compareArrayUtils.js";

function buildNameMap(guideCars) {
  const map = new Map();
  for (const car of ensureArray(guideCars, { subsystem: "compare-seo" })) {
    const family = normalizeVehicleSlug(extractFamilySlug(car.slug));
    if (!family) continue;
    map.set(family, car.fullDisplayName || buildVehicleVariantDisplayName(car));
  }
  return map;
}

function replaceLegacyNames(text, seoPage, nameByFamily) {
  let out = String(text || "");
  for (const rv of ensureArray(seoPage?.rankedVehicles, { subsystem: "compare-seo" })) {
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

  const rankedVehicles = ensureArray(seoPage.rankedVehicles).map((rv) => {
    const family = normalizeVehicleSlug(rv.slug);
    const displayName =
      nameByFamily.get(family) ||
      buildVehicleVariantDisplayName(
        { name: rv.displayName, slug: rv.slug },
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
        considerations: safeMap(
          seoPage.tradeoffs?.considerations,
          (row) => ({
            ...row,
            tradeoff: replaceLegacyNames(
              row.tradeoff,
              seoPage,
              nameByFamily
            ),
          }),
          { label: "tradeoffs.considerations", subsystem: "compare-seo" }
        ),
      }
    : seoPage.tradeoffs;

  const faq = safeMap(seoPage.faq, (item) => item, {
    label: "faq",
    subsystem: "compare-seo",
  }).map((item) => ({
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
