import { loadGeneratedVerifiedDossier } from "../index.js";
import { resolveNexonDossierSlug } from "../../verified/nexonSlugAliases.js";
import { resolvePunchDossierSlug } from "../../verified/punchSlugAliases.js";
import { resolveTiagoDossierSlug } from "../../verified/tiagoSlugAliases.js";
import { chargingSummary } from "./chargingSummary.js";
import {
  TATA_NEXON_FAMILY_SLUG,
  TATA_PUNCH_FAMILY_SLUG,
  TATA_TIAGO_FAMILY_SLUG,
  TATA_VERIFIED_OVERLAY_FAMILIES,
} from "./familySlugs.js";
import { TATA_VERIFIED_SAFETY_BY_FAMILY } from "./tataVerifiedSafety.js";

function findVariant(dossier, slug, familySlug, resolveSlug) {
  const variants = dossier?.variants || [];
  const normalized = resolveSlug(String(slug || "").toLowerCase());

  if (familySlug === TATA_TIAGO_FAMILY_SLUG) {
    if (!normalized || normalized === familySlug) return null;
  } else if (normalized === familySlug) {
    return variants[0] || null;
  }

  return (
    variants.find(
      (variant) =>
        variant.slug === normalized ||
        normalized.endsWith(`-${variant.variantSlug}`) ||
        normalized === variant.variantSlug
    ) ||
    (String(slug || "").toLowerCase().startsWith(familySlug)
      ? variants[0] || null
      : null)
  );
}

function buildChargingIntelligence(charging, familySlug) {
  const base = {
    acKw: charging.acKw,
    dcKw: charging.dcKw,
    connectorType: charging.port,
    acTime0to100Hours: charging.acTime0to100Hours,
    portableChargerIncluded: charging.portableChargerIncluded,
    homeChargingSupported: true,
    fastChargingSupported: charging.fastChargingSupported,
  };

  if (familySlug === TATA_NEXON_FAMILY_SLUG) {
    return {
      ...base,
      acKw33: charging.acKw33,
      acKw72: charging.acKw72,
      acTime0to100Hours33: charging.acTime0to100Hours33,
      acTime0to100Hours72: charging.acTime0to100Hours72,
      dcTime10to80Minutes: charging.dcTime10to80Minutes,
    };
  }

  if (familySlug === TATA_PUNCH_FAMILY_SLUG) {
    return {
      ...base,
      acKw15A: charging.acKw15A,
      acKw72: charging.acKw72,
      acTime0to100Hours15A: charging.acTime0to100Hours15A,
      acTime0to100Hours72: charging.acTime0to100Hours72,
      dcTime20to80Minutes: charging.dcTime20to80Minutes,
    };
  }

  return {
    ...base,
    dcTime10to80Minutes: charging.dcTime10to80Minutes,
  };
}

function buildChargingPracticality(charging, familySlug) {
  if (familySlug === TATA_PUNCH_FAMILY_SLUG) {
    return {
      acFullChargeHours: charging.acTime0to100Hours,
      dcTime20to80Minutes: charging.dcTime20to80Minutes,
      connectorType: charging.port,
      homeChargingSupported: true,
      portableChargerIncluded: charging.portableChargerIncluded,
      fastChargingSupported: charging.fastChargingSupported,
    };
  }

  return {
    acFullChargeHours: charging.acTime0to100Hours,
    dcTime10to80Minutes: charging.dcTime10to80Minutes,
    connectorType: charging.port,
    homeChargingSupported: true,
    portableChargerIncluded: charging.portableChargerIncluded,
    fastChargingSupported: charging.fastChargingSupported,
  };
}

function buildChargingEcosystem(charging, familySlug) {
  if (familySlug === TATA_PUNCH_FAMILY_SLUG) {
    return {
      homeCharging: {
        supported: true,
        recommendedKw: charging.acKw,
        wallboxRecommended: true,
      },
      fastChargeCurve: {
        peakKw: charging.dcKw,
        time20to80Min: charging.dcTime20to80Minutes,
      },
    };
  }

  return {
    homeCharging: {
      supported: true,
      recommendedKw: charging.acKw,
      wallboxRecommended: true,
    },
    fastChargeCurve: {
      peakKw: charging.dcKw,
      time10to80Min: charging.dcTime10to80Minutes,
    },
  };
}

function resolveMedia(car, dossier, familySlug) {
  const media = dossier.media || {};
  const mediaVerified =
    media.verificationStatus === "verified" ||
    media.verificationStatus === "present";

  if (familySlug === TATA_PUNCH_FAMILY_SLUG) {
    return {
      heroImage:
        (mediaVerified && media.heroImage) || car.heroImage || null,
      compareThumbnail:
        (mediaVerified && media.compareImage) || car.compareThumbnail || null,
      listingThumbnail:
        (mediaVerified && media.listingImage) || car.listingThumbnail || null,
    };
  }

  if (familySlug === TATA_TIAGO_FAMILY_SLUG) {
    return {
      heroImage: media.heroImage || null,
      compareThumbnail: media.compareImage || null,
      listingThumbnail: media.listingImage || null,
    };
  }

  return {
    heroImage: media.heroImage || null,
    compareThumbnail: media.compareImage || null,
    listingThumbnail: media.listingImage || null,
  };
}

function buildOverlayForFamily(car, familySlug) {
  const dossier = loadGeneratedVerifiedDossier(familySlug);
  if (!dossier) return null;

  const resolveSlug =
    familySlug === TATA_NEXON_FAMILY_SLUG
      ? resolveNexonDossierSlug
      : familySlug === TATA_PUNCH_FAMILY_SLUG
        ? resolvePunchDossierSlug
        : resolveTiagoDossierSlug;

  const slug = String(car?.slug || car?.catalogMeta?.slug || "").toLowerCase();
  const variant = findVariant(dossier, slug, familySlug, resolveSlug);
  if (!variant) return null;

  const charging = variant.charging || {};
  const safety =
    variant.safety || TATA_VERIFIED_SAFETY_BY_FAMILY[familySlug] || null;
  const mediaUrls = resolveMedia(car, dossier, familySlug);
  const verificationSource = dossier.verificationSource || "Verified Dossier";
  const verificationOwner = dossier.verificationOwner || "EVSavari Catalog";
  const dossierVersion = dossier.dossierVersion || "generated-v1";

  const specifications = {
    range: variant.rangeKmClaimed,
    batteryPack: `${variant.batteryKwh} kWh`,
    chargingTime: chargingSummary(charging),
    powerKw: variant.powerKw,
    powerBhp: variant.powerBhp,
    torqueNm: variant.torqueNm,
  };

  if (variant.accel0To100Sec != null) {
    specifications.acceleration = `${variant.accel0To100Sec}s (0–100 km/h)`;
  }
  if (variant.bootSpaceL != null) {
    specifications.bootSpaceL = variant.bootSpaceL;
    specifications.bootSpace = `${variant.bootSpaceL} L`;
  }

  const catalogMeta = {
    verified: true,
    verificationSource,
    verificationOwner,
    dossierVersion,
    familySlug,
    slug: variant.slug,
    safety,
    media: dossier.media,
    claimedRangeKm: variant.rangeKmClaimed,
    claimedRangeStandard: variant.rangeStandard,
    chargingSummary: chargingSummary(charging),
    chargingIntelligence: buildChargingIntelligence(charging, familySlug),
    chargingPracticality: buildChargingPracticality(charging, familySlug),
    chargingEcosystem: buildChargingEcosystem(charging, familySlug),
    performance: {
      powerKw: variant.powerKw,
      powerBhp: variant.powerBhp,
      torqueNm: variant.torqueNm,
      acceleration0to100: variant.accel0To100Sec,
    },
  };

  if (variant.rangeKmRealWorldMin != null || variant.rangeKmRealWorldMax != null) {
    catalogMeta.realWorldRangeKm = {
      min: variant.rangeKmRealWorldMin,
      max: variant.rangeKmRealWorldMax,
      methodology: verificationSource,
    };
  }

  if (variant.featureTags?.length) {
    catalogMeta.featureTags = variant.featureTags;
  }

  if (variant.bootSpaceL != null) {
    catalogMeta.dimensions = {
      bootSpaceL: variant.bootSpaceL,
      bootSpace: `${variant.bootSpaceL} L`,
    };
  }

  return {
    verified: true,
    verificationSource,
    verificationOwner,
    dossierVersion,
    governanceStatus: "verified",
    ...(mediaUrls.heroImage ? { heroImage: mediaUrls.heroImage } : {}),
    ...(mediaUrls.compareThumbnail
      ? { compareThumbnail: mediaUrls.compareThumbnail }
      : {}),
    ...(mediaUrls.listingThumbnail
      ? { listingThumbnail: mediaUrls.listingThumbnail }
      : {}),
    price: variant.priceInr,
    startingPrice: variant.priceInr,
    range: variant.rangeKmClaimed,
    specifications,
    battery: `${variant.batteryKwh} kWh`,
    chargingTime: chargingSummary(charging),
    ...(variant.featureTags?.length ? { featureTags: variant.featureTags } : {}),
    catalogMeta,
  };
}

/**
 * Build Tata verified overlay from generated dossiers (Phase 7A).
 * @param {object} car
 * @param {string} familySlug
 * @returns {object | null}
 */
export function buildGeneratedVerifiedOverlay(car, familySlug) {
  const key = String(familySlug || "").trim().toLowerCase();
  if (!TATA_VERIFIED_OVERLAY_FAMILIES.includes(key)) return null;
  return buildOverlayForFamily(car, key);
}

export const GENERATED_OVERLAY_BUILDERS = Object.freeze({
  [TATA_TIAGO_FAMILY_SLUG]: (car) =>
    buildGeneratedVerifiedOverlay(car, TATA_TIAGO_FAMILY_SLUG),
  [TATA_NEXON_FAMILY_SLUG]: (car) =>
    buildGeneratedVerifiedOverlay(car, TATA_NEXON_FAMILY_SLUG),
  [TATA_PUNCH_FAMILY_SLUG]: (car) =>
    buildGeneratedVerifiedOverlay(car, TATA_PUNCH_FAMILY_SLUG),
});
