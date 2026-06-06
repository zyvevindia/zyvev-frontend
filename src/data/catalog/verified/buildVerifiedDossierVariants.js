import normalizeCar from "../../../utils/normalizeCar.js";
import {
  TATA_NEXON_FAMILY_SLUG,
  TATA_NEXON_FAMILY_MEDIA,
  TATA_NEXON_VERIFIED_VARIANTS,
  VERIFICATION_OWNER,
  VERIFICATION_SOURCE,
  DOSSIER_VERSION,
  buildTataNexonVerifiedOverlay,
} from "./tataNexonEvVerified.js";

const DOSSIER_FAMILIES = Object.freeze({
  [TATA_NEXON_FAMILY_SLUG]: {
    brand: "Tata",
    familyName: "Nexon EV",
    category: "SUV",
    variants: TATA_NEXON_VERIFIED_VARIANTS,
    media: TATA_NEXON_FAMILY_MEDIA,
    buildOverlay: buildTataNexonVerifiedOverlay,
  },
});

export function hasVerifiedDossier(familySlug = "") {
  const key = String(familySlug || "").trim().toLowerCase();
  return Boolean(key && DOSSIER_FAMILIES[key]);
}

function chargingSummary(charging) {
  if (!charging) return "";
  const parts = [];
  if (charging.acKw) parts.push(`${charging.acKw} kW AC`);
  if (charging.dcKw) parts.push(`${charging.dcKw} kW DC`);
  if (charging.port) parts.push(charging.port);
  if (charging.dcTime10to80Minutes) {
    parts.push(`10–80% in ~${charging.dcTime10to80Minutes} min`);
  }
  if (charging.acTime0to100Hours) {
    parts.push(`AC 10–100% in ~${charging.acTime0to100Hours} hrs`);
  }
  return parts.join(" · ");
}

/**
 * Build normalized marketplace vehicles from verified dossier (detail + compare).
 * @param {string} familySlug
 * @returns {object[]}
 */
export function buildVerifiedDossierMarketplaceVariants(familySlug = "") {
  const config = DOSSIER_FAMILIES[String(familySlug || "").trim().toLowerCase()];
  if (!config) return [];

  return config.variants.map((variant) => {
    const charging = variant.charging || {};
    const base = {
      _id: `verified-dossier:${variant.slug}`,
      slug: variant.slug,
      name: `${config.brand} ${config.familyName} ${variant.trimLabel || variant.name}`,
      brand: config.brand,
      category: config.category,
      familySlug,
      price: variant.priceInr,
      startingPrice: variant.priceInr,
      range: variant.rangeKmClaimed,
      battery: `${variant.batteryKwh} kWh`,
      chargingTime: chargingSummary(charging),
      heroImage: config.media.heroImage,
      compareThumbnail: config.media.compareImage,
      listingThumbnail: config.media.listingImage,
      image: config.media.listingImage,
      catalogSource: "verified-dossier",
      verified: true,
      verificationSource: VERIFICATION_SOURCE,
      verificationOwner: VERIFICATION_OWNER,
      dossierVersion: DOSSIER_VERSION,
      specifications: {
        range: variant.rangeKmClaimed,
        batteryPack: `${variant.batteryKwh} kWh`,
        chargingTime: chargingSummary(charging),
        powerKw: variant.powerKw,
        torqueNm: variant.torqueNm,
        acceleration: `${variant.accel0To100Sec}s (0–100 km/h)`,
      },
    };

    const overlay = config.buildOverlay({
      slug: variant.slug,
      catalogMeta: { slug: variant.slug, familySlug },
    });

    return normalizeCar({
      ...base,
      ...overlay,
      slug: variant.slug,
      variantLabel: variant.trimLabel || variant.name,
      variantSlug: variant.variantSlug,
    });
  });
}

export function getVerifiedDossierVariantCount(familySlug = "") {
  return buildVerifiedDossierMarketplaceVariants(familySlug).length;
}
