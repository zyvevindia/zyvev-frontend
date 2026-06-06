#!/usr/bin/env node
/**
 * Ingest Tata Nexon EV verified dossier workbook into catalog verified module.
 * Source: Tata_Nexon_EV_Dossier_v1.xlsx
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readXlsxSheets,
  sheetToKeyValue,
  sheetToTable,
} from "./lib/parseXlsxMinimal.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_WORKBOOK =
  process.env.NEXON_DOSSIER_PATH ||
  "C:/Users/Nitin/OneDrive/Desktop/Zyvev/Tata_Nexon_EV_Dossier_v1.xlsx";

export const VERIFICATION_SOURCE = "Verified Dossier";
export const VERIFICATION_OWNER = "Nitin Sharma";
export const DOSSIER_VERSION = "v1";
export const TATA_NEXON_FAMILY_SLUG = "tata-nexon-ev";

function trimName(value) {
  return String(value ?? "").trim();
}

function variantNameToSlug(name) {
  return trimName(name)
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function parseLakhPrice(value) {
  const m = /([\d.]+)\s*lakh/i.exec(String(value || ""));
  if (!m) return null;
  return Math.round(Number(m[1]) * 100000);
}

function parseKwh(value) {
  const m = /([\d.]+)\s*kwh/i.exec(String(value || ""));
  return m ? Number(m[1]) : null;
}

function parseKm(value) {
  const m = /([\d.]+)\s*km/i.exec(String(value || ""));
  return m ? Math.round(Number(m[1])) : null;
}

function parseC75Range(value) {
  const m = /([\d.]+)\s*-\s*([\d.]+)/.exec(String(value || ""));
  if (!m) return { min: null, max: null };
  return { min: Math.round(Number(m[1])), max: Math.round(Number(m[2])) };
}

function parseBhp(value) {
  const m = /([\d.]+)\s*bhp/i.exec(String(value || ""));
  return m ? Number(m[1]) : null;
}

function bhpToKw(bhp) {
  if (bhp == null) return null;
  return Math.round(bhp * 0.745699872 * 10) / 10;
}

function parseTorque(value) {
  const m = /([\d.]+)\s*nm/i.exec(String(value || ""));
  return m ? Math.round(Number(m[1])) : null;
}

function parseAccelSec(value) {
  const m = /([\d.]+)\s*sec/i.exec(String(value || ""));
  return m ? Number(m[1]) : null;
}

function parseDurationHours(text) {
  const s = String(text || "");
  const hrMatch = /([\d.]+)\s*hrs?/i.exec(s);
  const minMatch = /([\d.]+)\s*min/i.exec(s);
  let hours = hrMatch ? Number(hrMatch[1]) : 0;
  if (minMatch) hours += Number(minMatch[1]) / 60;
  return hours || null;
}

function parseDcMinutes(text) {
  const m = /([\d.]+)\s*min/i.exec(String(text || ""));
  return m ? Math.round(Number(m[1])) : null;
}

function parseDcKw(text) {
  const m = /([\d.]+)\s*kw/i.exec(String(text || ""));
  return m ? Number(m[1]) : null;
}

function yn(value) {
  return String(value || "").trim().toUpperCase() === "Y";
}

function parseNcapStars(value) {
  const m = /([\d.]+)\s*star/i.exec(String(value || ""));
  return m ? Number(m[1]) : null;
}

function buildSafetyFromRow(row) {
  const adasFeatures = {
    forwardCollisionWarning: yn(row["Forward Collision Warning (ADAS)"]),
    automaticEmergencyBraking: yn(row["Automatic Emergency Braking (ADAS)"]),
    trafficSignRecognition: yn(row["Traffic Sign Recognition (ADAS)"]),
    laneDepartureWarning: yn(row["Lane Departure Warning (ADAS)"]),
    laneKeepAssist: yn(row["Lane Keep Assist (ADAS)"]),
    driverAttentionWarning: yn(row["Driver Attention Warning (ADAS)"]),
    adaptiveHighBeamAssist: yn(row["Adaptive High Beam Assist (ADAS)"]),
    blindSpotMonitor: yn(row["Blind Spot Monitor (ADAS)"]),
  };
  const adasSupported = Object.values(adasFeatures).some(Boolean);

  return {
    bharatNcap: {
      stars: parseNcapStars(row["Bharat NCAP Safety Rating"]),
      status: "verified",
      verified: true,
    },
    childSafety: {
      stars: parseNcapStars(row["Bharat NCAP Child Safety Rating"]),
      status: "verified",
      verified: true,
    },
    airbags: {
      count: Number(row["No. of Airbags"]) || 6,
      status: "verified",
      verified: true,
    },
    abs: { value: yn(row["Anti-lock Braking System (ABS)"]), verified: true },
    esc: {
      value: yn(row["Electronic Stability Control (ESC)"]),
      verified: true,
    },
    tpms: {
      value: yn(row["Tyre Pressure Monitoring System (TPMS)"]),
      verified: true,
    },
    isofix: {
      value: yn(row["ISOFIX Child Seat Mounts"]),
      verified: true,
    },
    hillAssist: {
      value: yn(row["Hill Assist"]),
      verified: true,
    },
    camera360: {
      value: yn(row["360 View Camera"]),
      verified: true,
    },
    adas: {
      level: adasSupported ? 2 : 0,
      supported: adasSupported,
      status: "verified",
      verified: true,
      features: adasFeatures,
    },
  };
}

function buildChargingFromRow(row) {
  const ac33Text = row["Charging Time 3.3 kW"];
  const ac72Text = row["Charging Time 7.2 kW"];
  const dcText = row["Charging time"] || row["Charging Time"];
  const dcKw = parseDcKw(dcText);
  return {
    port: trimName(row["Charging Standard"]) || "CCS2",
    portableChargerIncluded:
      String(row["Portable Charging Cable"] || "")
        .trim()
        .toLowerCase() === "yes",
    acKw33: 3.3,
    acKw72: 7.2,
    acTime0to100Hours33: parseDurationHours(ac33Text),
    acTime0to100Hours72: parseDurationHours(ac72Text),
    acKw: 7.2,
    acTime0to100Hours: parseDurationHours(ac72Text),
    dcKw,
    dcTime10to80Minutes: parseDcMinutes(dcText),
    fastChargingSupported: yn(row["Fast Charging"]),
  };
}

function mergeDossier(workbookPath) {
  const sheets = readXlsxSheets(workbookPath);
  const family = sheetToKeyValue(sheets.FAMILY_MASTER);
  const variants = sheetToTable(sheets.VARIANTS_MASTER);
  const chargingRows = sheetToTable(sheets.CHARGING_INTELLIGENCE);
  const safetyRows = sheetToTable(sheets.SAFETY_INTELLIGENCE);

  const chargingByVariant = Object.fromEntries(
    chargingRows.map((r) => [trimName(r["Car Model"]), r])
  );
  const safetyByVariant = Object.fromEntries(
    safetyRows.map((r) => [trimName(r.Model), r])
  );

  const familySafety = buildSafetyFromRow(
    safetyRows[0] || {
      "Bharat NCAP Safety Rating": family.BharatNCAP,
      "Bharat NCAP Child Safety Rating": family.childSafety,
      "No. of Airbags": family.airbags,
      "Electronic Stability Control (ESC)": family.ESC,
    }
  );

  const mergedVariants = variants.map((v) => {
    const name = trimName(v.Variant);
    const variantSlug = variantNameToSlug(name);
    const c75 = parseC75Range(v["C75 Real World Range"]);
    const bhp = parseBhp(v.Power);
    const chargingRow = chargingByVariant[name];
    const safetyRow = safetyByVariant[name];

    return {
      slug: `${TATA_NEXON_FAMILY_SLUG}-${variantSlug}`,
      variantSlug,
      name,
      trimLabel: name,
      priceInr: parseLakhPrice(v.Price),
      batteryKwh: parseKwh(v.Battery),
      rangeKmClaimed: parseKm(v.Range),
      rangeKmRealWorldMin: c75.min,
      rangeKmRealWorldMax: c75.max,
      rangeStandard: "MIDC",
      powerBhp: bhp,
      powerKw: bhpToKw(bhp),
      torqueNm: parseTorque(v.Torque),
      accel0To100Sec: parseAccelSec(v["0-100"]),
      charging: chargingRow ? buildChargingFromRow(chargingRow) : null,
      safety: safetyRow ? buildSafetyFromRow(safetyRow) : familySafety,
    };
  });

  return {
    family: {
      familySlug: trimName(family.familySlug) || TATA_NEXON_FAMILY_SLUG,
      brand: trimName(family.brand),
      model: trimName(family.model),
      vehicleType: trimName(family.vehicleType),
      bodyType: trimName(family.bodyType),
      seats: Number(family.seats) || 5,
      batteryOptions: trimName(family.batteryOptions),
      launchStatus: trimName(family.launchStatus),
      heroImage: trimName(family.heroImage),
      compareImage: trimName(family.compareImage),
      listingImage: trimName(family.listingImage),
    },
    variants: mergedVariants,
    familySafety,
  };
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

function emitVerifiedModule(data) {
  const { family, variants, familySafety } = data;
  const primaryCharging = variants[0]?.charging;

  return `/**
 * Tata Nexon EV — verified dossier ingestion (${DOSSIER_VERSION}).
 * Source workbook: Tata_Nexon_EV_Dossier_v1.xlsx
 * Generated by scripts/ingest-nexon-dossier.mjs — do not hand-edit variant rows.
 */

export const VERIFICATION_SOURCE = ${JSON.stringify(VERIFICATION_SOURCE)};
export const VERIFICATION_OWNER = ${JSON.stringify(VERIFICATION_OWNER)};
export const DOSSIER_VERSION = ${JSON.stringify(DOSSIER_VERSION)};
export const TATA_NEXON_FAMILY_SLUG = ${JSON.stringify(TATA_NEXON_FAMILY_SLUG)};

export const TATA_NEXON_FAMILY_MEDIA = Object.freeze(${JSON.stringify(
    {
      heroImage: family.heroImage,
      compareImage: family.compareImage,
      listingImage: family.listingImage,
      compareThumbnail: family.compareImage,
      listingThumbnail: family.listingImage,
    },
    null,
    2
  )});

export const TATA_NEXON_VERIFIED_SAFETY = Object.freeze(${JSON.stringify(
    familySafety,
    null,
    2
  )});

export const TATA_NEXON_VERIFIED_VARIANTS = Object.freeze(${JSON.stringify(
    variants,
    null,
    2
  )});

function chargingSummary(charging) {
  if (!charging) return "";
  const parts = [];
  if (charging.acKw) parts.push(\`\${charging.acKw} kW AC\`);
  if (charging.dcKw) parts.push(\`\${charging.dcKw} kW DC\`);
  if (charging.port) parts.push(charging.port);
  if (charging.dcTime10to80Minutes) {
    parts.push(\`10–80% in ~\${charging.dcTime10to80Minutes} min\`);
  }
  if (charging.acTime0to100Hours) {
    parts.push(\`AC 10–100% in ~\${charging.acTime0to100Hours} hrs\`);
  }
  return parts.join(" · ");
}

export function buildTataNexonTier1Definition() {
  const variants = TATA_NEXON_VERIFIED_VARIANTS.map((v) => ({
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
    accel0To100: \`\${v.accel0To100Sec}s (0–100 km/h)\`,
    specs: {
      drivetrain: "FWD",
      seats: ${family.seats},
      torqueNm: v.torqueNm,
      powerKw: v.powerKw,
      powerBhp: v.powerBhp,
    },
    compareSpecs: {
      claimedRangeKm: v.rangeKmClaimed,
      batteryKwh: v.batteryKwh,
      powerKw: v.powerKw,
      torqueNm: v.torqueNm,
    },
    chargingMeta: v.charging,
    safetyMeta: v.safety,
  }));

  const primary = TATA_NEXON_VERIFIED_VARIANTS[0];
  const charging = primary?.charging || {};

  return {
    slug: TATA_NEXON_FAMILY_SLUG,
    brand: ${JSON.stringify(family.brand)},
    name: ${JSON.stringify(family.model)},
    category: "SUV",
    compareReady: true,
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    governanceStatus: "verified",
    safetyMeta: TATA_NEXON_VERIFIED_SAFETY,
    mediaMeta: TATA_NEXON_FAMILY_MEDIA,
    heroImage: TATA_NEXON_FAMILY_MEDIA.heroImage,
    compareThumbnail: TATA_NEXON_FAMILY_MEDIA.compareImage,
    listingThumbnail: TATA_NEXON_FAMILY_MEDIA.listingImage,
    seoMeta: {
      metaTitle: "Tata Nexon EV — Price, Range & Charging | EVSavari",
      metaDescription:
        "Compare all Tata Nexon EV variants with verified MIDC range, charging times, safety, and ADAS on EVSavari.",
    },
    ownershipMeta: {
      apartmentFriendly: true,
      highwaySuitable: true,
      cityPrimary: true,
    },
    chargingMeta: {
      acKw: charging.acKw,
      dcKw: charging.dcKw,
      port: charging.port,
      acTime0to100Hours: charging.acTime0to100Hours,
      dcTime10to80Minutes: charging.dcTime10to80Minutes,
      portableChargerIncluded: charging.portableChargerIncluded,
      fastChargingSupported: charging.fastChargingSupported,
    },
    variants,
  };
}

export function getTataNexonVerifiedVariant(slug = "") {
  const normalized = String(slug || "").toLowerCase();
  if (normalized === TATA_NEXON_FAMILY_SLUG) {
    return TATA_NEXON_VERIFIED_VARIANTS[0];
  }
  return (
    TATA_NEXON_VERIFIED_VARIANTS.find(
      (v) =>
        v.slug === normalized ||
        normalized.endsWith(\`-\${v.variantSlug}\`) ||
        normalized === v.variantSlug
    ) || null
  );
}

export function buildTataNexonVerifiedOverlay(car) {
  const slug = String(car?.slug || car?.catalogMeta?.slug || "").toLowerCase();
  const variant =
    getTataNexonVerifiedVariant(slug) ||
    (slug.startsWith(TATA_NEXON_FAMILY_SLUG)
      ? TATA_NEXON_VERIFIED_VARIANTS[0]
      : null);

  if (!variant) return null;

  const charging = variant.charging || {};
  const safety = variant.safety || TATA_NEXON_VERIFIED_SAFETY;

  return {
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    governanceStatus: "verified",
    heroImage: TATA_NEXON_FAMILY_MEDIA.heroImage,
    compareThumbnail: TATA_NEXON_FAMILY_MEDIA.compareImage,
    listingThumbnail: TATA_NEXON_FAMILY_MEDIA.listingImage,
    price: variant.priceInr,
    startingPrice: variant.priceInr,
    range: variant.rangeKmClaimed,
    specifications: {
      range: variant.rangeKmClaimed,
      batteryPack: \`\${variant.batteryKwh} kWh\`,
      chargingTime: chargingSummary(charging),
      powerKw: variant.powerKw,
      torqueNm: variant.torqueNm,
      acceleration: \`\${variant.accel0To100Sec}s (0–100 km/h)\`,
    },
    battery: \`\${variant.batteryKwh} kWh\`,
    chargingTime: chargingSummary(charging),
    catalogMeta: {
      verified: true,
      verificationSource: VERIFICATION_SOURCE,
      verificationOwner: VERIFICATION_OWNER,
      dossierVersion: DOSSIER_VERSION,
      familySlug: TATA_NEXON_FAMILY_SLUG,
      slug: variant.slug,
      safety,
      media: TATA_NEXON_FAMILY_MEDIA,
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
        acKw33: charging.acKw33,
        acKw72: charging.acKw72,
        dcKw: charging.dcKw,
        connectorType: charging.port,
        acTime0to100Hours: charging.acTime0to100Hours,
        acTime0to100Hours33: charging.acTime0to100Hours33,
        acTime0to100Hours72: charging.acTime0to100Hours72,
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
`;
}

function writeIngestionSummary(data, validation = {}) {
  const reportDir = join(ROOT, "reports", "ingestion");
  mkdirSync(reportDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const summary = {
    generatedAt: new Date().toISOString(),
    workbook: DEFAULT_WORKBOOK,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    familySlug: TATA_NEXON_FAMILY_SLUG,
    variantsIngested: data.variants.length,
    variantNames: data.variants.map((v) => v.name),
    chargingRecordsIngested: data.variants.filter((v) => v.charging).length,
    safetyRecordsIngested: data.variants.filter((v) => v.safety).length,
    mediaRecordsIngested: [
      data.family.heroImage,
      data.family.compareImage,
      data.family.listingImage,
    ].filter(Boolean).length,
    media: {
      heroImage: data.family.heroImage,
      compareImage: data.family.compareImage,
      listingImage: data.family.listingImage,
    },
    validation,
  };
  const jsonPath = join(reportDir, `nexon-dossier-ingestion-${stamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  return { summary, jsonPath };
}

export function ingestNexonDossier(workbookPath = DEFAULT_WORKBOOK) {
  const data = mergeDossier(workbookPath);
  const outPath = join(
    ROOT,
    "src/data/catalog/verified/tataNexonEvVerified.js"
  );
  writeFileSync(outPath, emitVerifiedModule(data));
  return data;
}

async function main() {
  console.log("\n=== Tata Nexon EV dossier ingestion ===\n");
  const data = ingestNexonDossier(DEFAULT_WORKBOOK);
  const { jsonPath, summary } = writeIngestionSummary(data);
  console.log(`Variants: ${summary.variantsIngested}`);
  console.log(`Charging: ${summary.chargingRecordsIngested}`);
  console.log(`Safety: ${summary.safetyRecordsIngested}`);
  console.log(`Media: ${summary.mediaRecordsIngested}`);
  console.log(`Summary: ${jsonPath}`);
  console.log("\nIngestion module written.\n");
}

if (process.argv[1]?.endsWith("ingest-nexon-dossier.mjs")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
