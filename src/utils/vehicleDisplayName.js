import { normalizeVehicleSlug } from "./vehicleRoutes";

const OEM_WORDS = {
  mg: "MG",
  byd: "BYD",
  bmw: "BMW",
  ev: "EV",
  kia: "Kia",
  tata: "Tata",
  mahindra: "Mahindra",
  hyundai: "Hyundai",
  citroen: "Citroën",
  mercedes: "Mercedes",
  volvo: "Volvo",
};

/**
 * Preserve OEM tokens (MG, BYD, EV) — avoid naive title-case on acronyms.
 */
export function preserveOemCasing(name) {
  return String(name || "").replace(
    /\b(mg|byd|bmw|ev|kia|tata|mahindra|hyundai|citroen|mercedes|volvo)\b/gi,
    (match) => OEM_WORDS[match.toLowerCase()] || match
  );
}

function isFullVehicleName(name) {
  const n = String(name || "").trim();
  if (!n || n.length < 8) return false;
  if (/\bEV\b/i.test(n)) return true;
  return n.split(/\s+/).filter(Boolean).length >= 3;
}

function pickBestName(candidates) {
  const list = [...new Set(candidates.map((s) => String(s || "").trim()).filter(Boolean))];
  if (!list.length) return "";

  const full = list.filter(isFullVehicleName);
  const pool = full.length ? full : list;
  return pool.sort((a, b) => b.length - a.length)[0];
}

/**
 * If catalog name is a short trim (e.g. "Mg Play"), append trim to SEO family label.
 */
function combineSeoBaseWithCatalogName(seoBase, catalogName) {
  const base = String(seoBase || "").trim();
  const catalog = String(catalogName || "").trim();
  if (!base) return catalog;
  if (!catalog) return base;
  if (isFullVehicleName(catalog)) return catalog;

  const baseLower = base.toLowerCase();
  const catalogLower = catalog.toLowerCase();
  if (baseLower.includes(catalogLower) || catalogLower.includes(baseLower)) {
    return base;
  }

  const catalogWords = catalog.split(/\s+/).filter(Boolean);
  const trimWord =
    catalogWords.length <= 2
      ? catalogWords[catalogWords.length - 1]
      : catalog.replace(new RegExp(base, "i"), "").trim();

  if (!trimWord) return base;
  if (baseLower.includes(trimWord.toLowerCase())) return base;
  return `${base} ${trimWord}`.trim();
}

/**
 * Canonical full display name for compare cards, specs, FAQ-adjacent UI.
 * Never returns variant-only trims like "Play" when a family label is available.
 */
export function resolveFullDisplayName(car, options = {}) {
  if (!car) return options.seoDisplayName || "Electric vehicle";

  const seoDisplayName = options.seoDisplayName?.trim();
  const explicit = pickBestName([
    car.fullDisplayName,
    car.displayName,
    car.catalogMeta?.fullDisplayName,
    car.catalogMeta?.displayName,
    car.catalogMeta?.marketplaceDisplayName,
    car.name,
  ]);

  if (explicit && isFullVehicleName(explicit)) {
    return preserveOemCasing(explicit);
  }

  if (seoDisplayName) {
    const merged = combineSeoBaseWithCatalogName(
      seoDisplayName,
      explicit || car.name
    );
    if (merged) return preserveOemCasing(merged);
  }

  if (explicit) return preserveOemCasing(explicit);

  const slug = normalizeVehicleSlug(car.slug || car.familySlug);
  if (slug) {
    return preserveOemCasing(
      seoDisplayName || slug.replace(/-/g, " ")
    );
  }

  return preserveOemCasing(seoDisplayName || "Electric vehicle");
}

/**
 * Ranked SEO row display name helper (family-level guides).
 */
export function resolveRankedVehicleDisplayName(ranked, catalogCar = null) {
  const seoName = ranked?.displayName?.trim();
  if (catalogCar) {
    return resolveFullDisplayName(catalogCar, { seoDisplayName: seoName });
  }
  return preserveOemCasing(seoName || ranked?.slug || "");
}
