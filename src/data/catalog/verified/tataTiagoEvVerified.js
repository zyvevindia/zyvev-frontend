/**
 * Tata Tiago EV — verified dossier productionization (v1.0).
 * Source: Verified Dossier — FAMILY_MASTER, VARIANTS_MASTER,
 * CHARGING_INTELLIGENCE, SAFETY_INTELLIGENCE, SOURCES, FEATURE_TAGS.
 */

import { resolveTiagoDossierSlug } from "./tiagoSlugAliases.js";

export const VERIFICATION_SOURCE = "Verified Dossier";
export const VERIFICATION_OWNER = "Nitin Sharma";
export const DOSSIER_VERSION = "v1.0";
export const TATA_TIAGO_FAMILY_SLUG = "tata-tiago-ev";

export const TATA_TIAGO_FAMILY_MEDIA = Object.freeze({
  heroImage:
    "https://res.cloudinary.com/dznvmumze/image/upload/f_auto,q_auto,c_limit/evsavari/catalog/families/tata-tiago-ev/hero",
  compareImage:
    "https://res.cloudinary.com/dznvmumze/image/upload/f_auto,q_auto,c_limit/evsavari/catalog/families/tata-tiago-ev/compare-thumb",
  listingImage:
    "https://res.cloudinary.com/dznvmumze/image/upload/f_auto,q_auto,c_limit/evsavari/catalog/families/tata-tiago-ev/listing-thumb",
  compareThumbnail:
    "https://res.cloudinary.com/dznvmumze/image/upload/f_auto,q_auto,c_limit/evsavari/catalog/families/tata-tiago-ev/compare-thumb",
  listingThumbnail:
    "https://res.cloudinary.com/dznvmumze/image/upload/f_auto,q_auto,c_limit/evsavari/catalog/families/tata-tiago-ev/listing-thumb",
  verificationStatus: "verified",
  source: "dossier",
});

export const TATA_TIAGO_VERIFIED_SAFETY = Object.freeze({
  bharatNcap: {
    status: "not_tested",
    verified: true,
  },
  globalNcap: {
    status: "not_tested",
    verified: true,
  },
  airbags: {
    count: 6,
    status: "verified",
    verified: true,
  },
  abs: {
    value: true,
    verified: true,
  },
  esc: {
    value: true,
    verified: true,
  },
  traction_control: {
    value: true,
    verified: true,
  },
  tpms: {
    value: true,
    verified: true,
  },
  isofix: {
    value: true,
    verified: true,
  },
  hillAssist: {
    value: true,
    verified: true,
  },
  adas: {
    level: 0,
    supported: false,
    status: "verified",
    verified: true,
  },
});

export const TATA_TIAGO_VERIFIED_VARIANTS = Object.freeze([
  {
    slug: "tata-tiago-ev-smart-19-mr",
    variantSlug: "smart-19-mr",
    name: "Smart 19 MR",
    trimLabel: "Smart 19 MR",
    priceInr: 699000,
    batteryKwh: 19.2,
    rangeKmClaimed: 226,
    rangeKmRealWorldMin: 160,
    rangeKmRealWorldMax: 170,
    rangeStandard: "MIDC",
    powerBhp: 61,
    powerKw: 45,
    torqueNm: 110,
    accel0To100Sec: 6.2,
    bootSpaceL: 240,
    featureTags: ["Best Value", "City EV", "Most Affordable"],
    charging: {
      port: "CCS2",
      portableChargerIncluded: true,
      acKw: 3.3,
      acTime0to100Hours: 6.9,
      dcKw: 25,
      dcTime10to80Minutes: 57,
      fastChargingSupported: true,
    },
    safety: TATA_TIAGO_VERIFIED_SAFETY,
  },
  {
    slug: "tata-tiago-ev-pure-plus-19-mr",
    variantSlug: "pure-plus-19-mr",
    name: "Pure+ 19 MR",
    trimLabel: "Pure+ 19 MR",
    priceInr: 799000,
    batteryKwh: 19.2,
    rangeKmClaimed: 226,
    rangeKmRealWorldMin: 160,
    rangeKmRealWorldMax: 170,
    rangeStandard: "MIDC",
    powerBhp: 61,
    powerKw: 45,
    torqueNm: 110,
    accel0To100Sec: 6.2,
    bootSpaceL: 240,
    featureTags: ["Daily Commuter", "Balanced Choice"],
    charging: {
      port: "CCS2",
      portableChargerIncluded: true,
      acKw: 3.3,
      acTime0to100Hours: 6.9,
      dcKw: 25,
      dcTime10to80Minutes: 57,
      fastChargingSupported: true,
    },
    safety: TATA_TIAGO_VERIFIED_SAFETY,
  },
  {
    slug: "tata-tiago-ev-pure-plus-24-lr",
    variantSlug: "pure-plus-24-lr",
    name: "Pure+ 24 LR",
    trimLabel: "Pure+ 24 LR",
    priceInr: 849000,
    batteryKwh: 24,
    rangeKmClaimed: 285,
    rangeKmRealWorldMin: 205,
    rangeKmRealWorldMax: 215,
    rangeStandard: "MIDC",
    powerBhp: 75,
    powerKw: 55,
    torqueNm: 114,
    accel0To100Sec: 5.7,
    bootSpaceL: 240,
    featureTags: ["Long Range", "Recommended Pick", "Family Friendly"],
    charging: {
      port: "CCS2",
      portableChargerIncluded: true,
      acKw: 7.2,
      acTime0to100Hours: 8.7,
      dcKw: 25,
      dcTime10to80Minutes: 57,
      fastChargingSupported: true,
    },
    safety: TATA_TIAGO_VERIFIED_SAFETY,
  },
  {
    slug: "tata-tiago-ev-creative-plus-24-lr",
    variantSlug: "creative-plus-24-lr",
    name: "Creative+ 24 LR",
    trimLabel: "Creative+ 24 LR",
    priceInr: 899000,
    batteryKwh: 24,
    rangeKmClaimed: 285,
    rangeKmRealWorldMin: 205,
    rangeKmRealWorldMax: 215,
    rangeStandard: "MIDC",
    powerBhp: 75,
    powerKw: 55,
    torqueNm: 114,
    accel0To100Sec: 5.7,
    bootSpaceL: 240,
    featureTags: [
      "Top Variant",
      "Most Feature Rich",
      "Advanced Safety",
    ],
    charging: {
      port: "CCS2",
      portableChargerIncluded: true,
      acKw: 7.2,
      acTime0to100Hours: 8.7,
      dcKw: 25,
      dcTime10to80Minutes: 57,
      fastChargingSupported: true,
    },
    safety: {
      ...TATA_TIAGO_VERIFIED_SAFETY,
      camera360: {
        value: true,
        verified: true,
      },
    },
  },
]);

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

export function buildTataTiagoTier1Definition() {
  const variants = TATA_TIAGO_VERIFIED_VARIANTS.map((v) => ({
    slug: v.variantSlug,
    name: v.name,
    priceInr: v.priceInr,
    rangeKmClaimed: v.rangeKmClaimed,
    rangeKmRealWorld: Math.round(
      (v.rangeKmRealWorldMin + v.rangeKmRealWorldMax) / 2
    ),
    batteryKwh: v.batteryKwh,
    powerKw: v.powerKw,
    torqueNm: v.torqueNm,
    accel0To100: `${v.accel0To100Sec}s (0–100 km/h)`,
    specs: {
      drivetrain: "FWD",
      seats: 5,
      bootSpaceL: v.bootSpaceL,
      torqueNm: v.torqueNm,
      powerKw: v.powerKw,
      powerBhp: v.powerBhp,
    },
    compareSpecs: {
      claimedRangeKm: v.rangeKmClaimed,
      batteryKwh: v.batteryKwh,
      powerKw: v.powerKw,
      powerBhp: v.powerBhp,
      torqueNm: v.torqueNm,
    },
    chargingMeta: v.charging,
    safetyMeta: v.safety || TATA_TIAGO_VERIFIED_SAFETY,
    featureTags: v.featureTags,
  }));

  const primary = TATA_TIAGO_VERIFIED_VARIANTS[0];
  const charging = primary?.charging || {};

  return {
    slug: TATA_TIAGO_FAMILY_SLUG,
    brand: "Tata",
    name: "Tiago EV",
    category: "Hatchback",
    compareReady: true,
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    governanceStatus: "verified",
    safetyMeta: TATA_TIAGO_VERIFIED_SAFETY,
    mediaMeta: TATA_TIAGO_FAMILY_MEDIA,
    seoMeta: {
      metaTitle: "Tata Tiago EV — Price, Range & Charging | EVSavari",
      metaDescription:
        "Compare all Tata Tiago EV variants with verified MIDC range, charging times, and safety on EVSavari.",
    },
    ownershipMeta: {
      apartmentFriendly: true,
      beginnerFriendly: true,
      cityPrimary: true,
      compactParking: true,
    },
    chargingMeta: {
      acKw: charging.acKw,
      dcKw: charging.dcKw,
      port: charging.port,
      acTime0to100Hours: charging.acTime0to100Hours,
      dcTime10to80Minutes: charging.dcTime10to80Minutes,
    },
    variants,
  };
}

export function getTataTiagoVerifiedVariant(slug = "") {
  const normalized = resolveTiagoDossierSlug(slug);
  if (!normalized || normalized === TATA_TIAGO_FAMILY_SLUG) {
    return null;
  }
  return (
    TATA_TIAGO_VERIFIED_VARIANTS.find(
      (v) =>
        v.slug === normalized ||
        normalized.endsWith(`-${v.variantSlug}`) ||
        normalized === v.variantSlug
    ) || null
  );
}

export function buildTataTiagoVerifiedOverlay(car) {
  const slug = String(car?.slug || car?.catalogMeta?.slug || "").toLowerCase();
  const variant = getTataTiagoVerifiedVariant(slug);

  if (!variant) return null;

  const charging = variant.charging || {};
  const safety = variant.safety || TATA_TIAGO_VERIFIED_SAFETY;
  const media = TATA_TIAGO_FAMILY_MEDIA;

  return {
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    governanceStatus: "verified",
    ...(media.heroImage ? { heroImage: media.heroImage } : {}),
    ...(media.compareImage ? { compareThumbnail: media.compareImage } : {}),
    ...(media.listingImage ? { listingThumbnail: media.listingImage } : {}),
    price: variant.priceInr,
    startingPrice: variant.priceInr,
    range: variant.rangeKmClaimed,
    specifications: {
      range: variant.rangeKmClaimed,
      batteryPack: `${variant.batteryKwh} kWh`,
      chargingTime: chargingSummary(charging),
      powerKw: variant.powerKw,
      powerBhp: variant.powerBhp,
      torqueNm: variant.torqueNm,
      acceleration: `${variant.accel0To100Sec}s (0–100 km/h)`,
      bootSpace: `${variant.bootSpaceL} L`,
      bootSpaceL: variant.bootSpaceL,
    },
    battery: `${variant.batteryKwh} kWh`,
    chargingTime: chargingSummary(charging),
    featureTags: variant.featureTags,
    catalogMeta: {
      verified: true,
      verificationSource: VERIFICATION_SOURCE,
      verificationOwner: VERIFICATION_OWNER,
      dossierVersion: DOSSIER_VERSION,
      familySlug: TATA_TIAGO_FAMILY_SLUG,
      slug: variant.slug,
      featureTags: variant.featureTags,
      safety,
      media,
      dimensions: {
        bootSpaceL: variant.bootSpaceL,
        bootSpace: `${variant.bootSpaceL} L`,
      },
      claimedRangeKm: variant.rangeKmClaimed,
      claimedRangeStandard: variant.rangeStandard,
      realWorldRangeKm: {
        min: variant.rangeKmRealWorldMin,
        max: variant.rangeKmRealWorldMax,
        methodology: VERIFICATION_SOURCE,
      },
      chargingSummary: chargingSummary(charging),
      chargingIntelligence: {
        acKw: charging.acKw,
        dcKw: charging.dcKw,
        connectorType: charging.port,
        acTime0to100Hours: charging.acTime0to100Hours,
        dcTime10to80Minutes: charging.dcTime10to80Minutes,
        portableChargerIncluded: charging.portableChargerIncluded,
        homeChargingSupported: true,
        fastChargingSupported: charging.fastChargingSupported,
      },
      chargingPracticality: {
        acFullChargeHours: charging.acTime0to100Hours,
        dcTime10to80Minutes: charging.dcTime10to80Minutes,
        connectorType: charging.port,
        homeChargingSupported: true,
        portableChargerIncluded: charging.portableChargerIncluded,
        fastChargingSupported: charging.fastChargingSupported,
      },
      chargingEcosystem: {
        homeCharging: {
          supported: true,
          recommendedKw: charging.acKw,
          wallboxRecommended: true,
        },
        fastChargeCurve: {
          peakKw: charging.dcKw,
          time10to80Min: charging.dcTime10to80Minutes,
        },
      },
      performance: {
        powerKw: variant.powerKw,
        powerBhp: variant.powerBhp,
        torqueNm: variant.torqueNm,
        acceleration0to100: variant.accel0To100Sec,
      },
    },
  };
}
