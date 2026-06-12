import normalizeCar from "../../../utils/normalizeCar.js";
import {
  hasGeneratedVerifiedDossier,
  loadGeneratedVerifiedDossier,
} from "../generated/index.js";
import { chargingSummary } from "../generated/overlays/chargingSummary.js";

function buildMarketplaceVariantsFromDossier(familySlug, dossier) {
  const {
    brand,
    familyName,
    category,
    variants,
    media,
    verificationSource,
    verificationOwner,
    dossierVersion,
  } = dossier;

  return variants.map((variant) => {
    const charging = variant.charging || {};
    const base = {
      _id: `verified-dossier:${variant.slug}`,
      slug: variant.slug,
      name: `${brand} ${familyName} ${variant.trimLabel || variant.name}`,
      brand,
      category,
      familySlug,
      price: variant.priceInr,
      startingPrice: variant.priceInr,
      range: variant.rangeKmClaimed,
      battery: `${variant.batteryKwh} kWh`,
      chargingTime: chargingSummary(charging),
      heroImage: media.heroImage,
      compareThumbnail: media.compareImage,
      listingThumbnail: media.listingImage,
      image: media.listingImage,
      catalogSource: "verified-dossier",
      verified: true,
      verificationSource: verificationSource || "Verified Dossier",
      verificationOwner: verificationOwner || "EVSavari Catalog",
      dossierVersion: dossierVersion || "generated-v1",
      specifications: {
        range: variant.rangeKmClaimed,
        batteryPack: `${variant.batteryKwh} kWh`,
        chargingTime: chargingSummary(charging),
        powerKw: variant.powerKw,
        powerBhp: variant.powerBhp,
        torqueNm: variant.torqueNm,
        acceleration: variant.accel0To100Sec
          ? `${variant.accel0To100Sec}s (0–100 km/h)`
          : undefined,
        bootSpaceL: variant.bootSpaceL,
        bootSpace: variant.bootSpaceL ? `${variant.bootSpaceL} L` : undefined,
      },
    };

    return normalizeCar({
      ...base,
      slug: variant.slug,
      variantLabel: variant.trimLabel || variant.name,
      variantSlug: variant.variantSlug,
      featureTags: variant.featureTags,
      catalogMeta: variant.catalogMeta || {},
    });
  });
}

export function hasVerifiedDossier(familySlug = "") {
  const key = String(familySlug || "").trim().toLowerCase();
  return Boolean(key && hasGeneratedVerifiedDossier(key));
}

/**
 * Build normalized marketplace vehicles from generated verified dossiers.
 * @param {string} familySlug
 * @returns {object[]}
 */
export function buildVerifiedDossierMarketplaceVariants(familySlug = "") {
  const key = String(familySlug || "").trim().toLowerCase();
  if (!key) return [];

  const dossier = loadGeneratedVerifiedDossier(key);
  if (!dossier) return [];

  return buildMarketplaceVariantsFromDossier(key, dossier);
}

export function getVerifiedDossierVariantCount(familySlug = "") {
  return buildVerifiedDossierMarketplaceVariants(familySlug).length;
}
