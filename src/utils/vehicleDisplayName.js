import { normalizeVehicleSlug } from "./vehicleRoutes";
import {
  extractFamilySlug,
  formatFamilyName,
} from "./modelFamily.js";

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
  const raw = name;
  if (raw == null || typeof raw === "object") return "";
  return String(raw).replace(
    /\b(mg|byd|bmw|ev|kia|tata|mahindra|hyundai|citroen|mercedes|volvo)\b/gi,
    (match) => OEM_WORDS[match.toLowerCase()] || match
  );
}

const UNKNOWN_EV_LABEL = "Unknown EV";

function coerceDisplayString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
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

function resolveFamilyDisplayName(car) {
  const fromFields = pickBestName([
    car.displayName,
    car.familyName,
    car.catalogMeta?.displayName,
    car.catalogMeta?.marketplaceDisplayName,
  ]);

  if (fromFields && isFullVehicleName(fromFields)) {
    return fromFields;
  }

  const familySlug = extractFamilySlug(
    car.familySlug || car.slug || ""
  );
  if (familySlug) {
    return formatFamilyName(familySlug, car.brand);
  }

  return fromFields;
}

function resolveVariantTrim(car, catalogName = "") {
  const explicit = coerceDisplayString(
    car.variantName ||
      car.trimLabel ||
      car.variantLabel ||
      car.catalogMeta?.variantName ||
      car.catalogMeta?.trimLabel
  );
  if (explicit) return explicit;

  const catalog = coerceDisplayString(catalogName || car.name);
  const family = resolveFamilyDisplayName(car);
  if (!catalog || !family) return "";

  const familyLower = family.toLowerCase();
  const catalogLower = catalog.toLowerCase();
  if (catalogLower.startsWith(familyLower)) {
    return catalog.slice(family.length).trim();
  }

  const brand = coerceDisplayString(car.brand);
  if (brand && catalogLower.startsWith(brand.toLowerCase())) {
    return catalog.slice(brand.length).trim();
  }

  if (catalog.split(/\s+/).length <= 2) {
    const words = catalog.split(/\s+/).filter(Boolean);
    return words[words.length - 1] || "";
  }

  return "";
}

function composeFamilyAndVariantName(familyName, variantTrim) {
  const family = String(familyName || "").trim();
  const trim = String(variantTrim || "").trim();
  if (!family) return trim;
  if (!trim) return family;
  if (family.toLowerCase().includes(trim.toLowerCase())) return family;
  return `${family} ${trim}`.trim();
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

  const familyName = resolveFamilyDisplayName(car);
  const variantTrim = resolveVariantTrim(car, explicit || car.name);
  if (familyName && variantTrim) {
    return preserveOemCasing(
      composeFamilyAndVariantName(familyName, variantTrim)
    );
  }

  if (seoDisplayName) {
    const merged = combineSeoBaseWithCatalogName(
      seoDisplayName,
      explicit || car.name
    );
    if (merged) return preserveOemCasing(merged);
  }

  if (explicit) {
    if (familyName) {
      return preserveOemCasing(
        composeFamilyAndVariantName(
          familyName,
          variantTrim || explicit
        )
      );
    }
    return preserveOemCasing(explicit);
  }

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
  const seoName = coerceDisplayString(ranked?.displayName);
  if (catalogCar) {
    return resolveFullDisplayName(catalogCar, { seoDisplayName: seoName });
  }
  const out = preserveOemCasing(seoName || coerceDisplayString(ranked?.slug));
  return out || UNKNOWN_EV_LABEL;
}
