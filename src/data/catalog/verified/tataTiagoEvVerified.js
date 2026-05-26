/**
 * Tata Tiago EV — verified production sheet (OEM brochure + ops review).
 * Controlled ingestion source for tier-1 definitions and runtime catalog overlay.
 */

export const VERIFICATION_SOURCE =
  "OEM + verified ops review";

export const TATA_TIAGO_FAMILY_SLUG = "tata-tiago-ev";

/** @type {import('../../../intelligence/safetyMetadata.js').SAFETY_FIELD_STATUS} */
const NOT_TESTED = "not_tested";

export const TATA_TIAGO_VERIFIED_SAFETY = Object.freeze({
  bharatNcap: { status: NOT_TESTED, verified: true },
  globalNcap: { status: NOT_TESTED, verified: true },
  airbags: { count: 6, verified: true },
  abs: { value: true, verified: true },
  esc: { value: true, verified: true },
  traction_control: { value: true, verified: true },
  adas: {
    level: 0,
    status: NOT_TESTED,
    supported: false,
    verified: true,
  },
});

/**
 * Variant-level verified records (slug matches live catalog + compare).
 */
export const TATA_TIAGO_VERIFIED_VARIANTS = Object.freeze([
  {
    slug: "tata-tiago-ev-xt",
    variantSlug: "xt",
    name: "XT",
    trimLabel: "XT (Medium Range)",
    priceInr: 799000,
    batteryKwh: 19.2,
    rangeKmClaimed: 223,
    rangeKmRealWorldMin: 168,
    rangeKmRealWorldMax: 205,
    rangeStandard: "MIDC",
    powerKw: 45,
    torqueNm: 110,
    accel0To60Sec: 6.2,
    charging: {
      acKw: 3.3,
      acTime0to100Hours: 6.9,
      dcKw: 25,
      dcTime10to80Minutes: 58,
      port: "CCS2",
      portableChargerIncluded: true,
    },
  },
  {
    slug: "tata-tiago-ev-xz-plus",
    variantSlug: "xz-plus",
    name: "XZ+",
    trimLabel: "XZ+ (Long Range)",
    priceInr: 1199000,
    batteryKwh: 24,
    rangeKmClaimed: 293,
    rangeKmRealWorldMin: 205,
    rangeKmRealWorldMax: 250,
    rangeStandard: "MIDC",
    powerKw: 55,
    torqueNm: 114,
    accel0To60Sec: 5.7,
    charging: {
      acKw: 7.2,
      acTime0to100Hours: 8.7,
      dcKw: 25,
      dcTime10to80Minutes: 58,
      port: "CCS2",
      portableChargerIncluded: true,
    },
  },
]);

function chargingSummary(charging) {
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
 * Tier-1 catalog definition shape for seed + audits.
 */
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
    accel0To100: `${v.accel0To60Sec}s (0–60 km/h)`,
    specs: {
      drivetrain: "FWD",
      seats: 5,
      torqueNm: v.torqueNm,
      powerKw: v.powerKw,
    },
    compareSpecs: {
      claimedRangeKm: v.rangeKmClaimed,
      batteryKwh: v.batteryKwh,
      powerKw: v.powerKw,
      torqueNm: v.torqueNm,
    },
    chargingMeta: v.charging,
  }));

  const primary = TATA_TIAGO_VERIFIED_VARIANTS[0];

  return {
    slug: TATA_TIAGO_FAMILY_SLUG,
    brand: "Tata",
    name: "Tiago EV",
    category: "Hatchback",
    compareReady: true,
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    governanceStatus: "verified",
    safetyMeta: TATA_TIAGO_VERIFIED_SAFETY,
    seoMeta: {
      metaTitle: "Tata Tiago EV — Price, Range & Charging | EVSavari",
      metaDescription:
        "Compare Tata Tiago EV XT and XZ+ variants with verified MIDC range, charging times, and safety fields on EVSavari.",
    },
    ownershipMeta: {
      apartmentFriendly: true,
      beginnerFriendly: true,
      cityPrimary: true,
    },
    chargingMeta: {
      acKw: primary.charging.acKw,
      dcKw: primary.charging.dcKw,
      port: primary.charging.port,
      acTime0to100Hours: primary.charging.acTime0to100Hours,
      dcTime10to80Minutes: primary.charging.dcTime10to80Minutes,
    },
    variants,
  };
}

/**
 * @param {string} slug — family or variant slug
 */
export function getTataTiagoVerifiedVariant(slug = "") {
  const normalized = String(slug || "").toLowerCase();
  if (normalized === TATA_TIAGO_FAMILY_SLUG) {
    return TATA_TIAGO_VERIFIED_VARIANTS[0];
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

/**
 * Build catalogMeta + spec overlay for a normalized vehicle.
 * @param {object} car
 */
export function buildTataTiagoVerifiedOverlay(car) {
  const slug = String(car?.slug || car?.catalogMeta?.slug || "").toLowerCase();
  const variant =
    getTataTiagoVerifiedVariant(slug) ||
    (slug.startsWith("tata-tiago-ev")
      ? TATA_TIAGO_VERIFIED_VARIANTS[0]
      : null);

  if (!variant) return null;

  const charging = variant.charging;

  return {
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    governanceStatus: "verified",
    price: variant.priceInr,
    startingPrice: variant.priceInr,
    range: variant.rangeKmClaimed,
    specifications: {
      range: variant.rangeKmClaimed,
      batteryPack: `${variant.batteryKwh} kWh`,
      chargingTime: chargingSummary(charging),
      topSpeed: "120 km/h",
      powerKw: variant.powerKw,
      torqueNm: variant.torqueNm,
      acceleration: `${variant.accel0To60Sec}s (0–60 km/h)`,
    },
    battery: `${variant.batteryKwh} kWh`,
    chargingTime: chargingSummary(charging),
    catalogMeta: {
      verified: true,
      verificationSource: VERIFICATION_SOURCE,
      familySlug: TATA_TIAGO_FAMILY_SLUG,
      slug: variant.slug,
      safety: TATA_TIAGO_VERIFIED_SAFETY,
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
        dcTime10to80Minutes: charging.dcTime10to80Minutes,
        portableChargerIncluded: charging.portableChargerIncluded,
        homeChargingSupported: true,
        fastChargingSupported: true,
      },
      chargingPracticality: {
        acFullChargeHours: charging.acTime0to100Hours,
        dcTime10to80Minutes: charging.dcTime10to80Minutes,
        connectorType: charging.port,
        homeChargingSupported: true,
        portableChargerIncluded: charging.portableChargerIncluded,
        fastChargingSupported: true,
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
        torqueNm: variant.torqueNm,
        acceleration0to60: variant.accel0To60Sec,
      },
    },
  };
}
