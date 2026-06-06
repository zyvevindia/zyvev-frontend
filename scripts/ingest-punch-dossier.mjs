#!/usr/bin/env node
/**
 * Ingest Tata Punch EV verified dossier workbook into catalog verified module.
 * Source: Tata_Punch_EV_Dossier_v1.xlsx (or Tata_Punch_EV_Dossier_v1(3).xlsx)
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  readXlsxSheets,
  sheetToKeyValue,
  sheetToTable,
} from "./lib/parseXlsxMinimal.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKBOOK_CANDIDATES = [
  process.env.PUNCH_DOSSIER_PATH,
  "C:/Users/Nitin/OneDrive/Desktop/Zyvev/Tata_Punch_EV_Dossier_v1(3).xlsx",
  "C:/Users/Nitin/OneDrive/Desktop/Zyvev/Tata_Punch_EV_Dossier_v1.xlsx",
].filter(Boolean);

export const VERIFICATION_SOURCE = "Verified Dossier";
export const VERIFICATION_OWNER = "Nitin Sharma";
export const TATA_PUNCH_FAMILY_SLUG = "tata-punch-ev";

function resolveWorkbookPath() {
  for (const candidate of WORKBOOK_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `Punch dossier workbook not found. Tried: ${WORKBOOK_CANDIDATES.join(", ")}`
  );
}

function trimName(value) {
  return String(value ?? "").trim();
}

function stripPunchPrefix(name) {
  return trimName(name).replace(/^punch\s+ev\s+/i, "");
}

function variantNameToSlug(name) {
  return stripPunchPrefix(name)
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/-+$/g, "");
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

function parseMidcRange(value) {
  const s = String(value || "");
  const band = /([\d.]+)\s*-\s*([\d.]+)\s*km/i.exec(s);
  if (band) {
    const min = Math.round(Number(band[1]));
    const max = Math.round(Number(band[2]));
    return {
      min,
      max,
      claimed: Math.round((min + max) / 2),
    };
  }
  const single = parseKm(s);
  return { min: single, max: single, claimed: single };
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
  const blindSpot = yn(row["Blind Spot Monitor (ADAS)"]);

  return {
    bharatNcap: {
      stars: parseNcapStars(row["Bharat NCAP Safety Rating"]),
      status: "verified",
      verified: true,
    },
    globalNcap: {
      stars: parseNcapStars(row["Global NCAP Safety Rating"]),
      status: "verified",
      verified: true,
    },
    childSafety: {
      stars: parseNcapStars(row["Bharat NCAP Child Safety Rating"]),
      status: "verified",
      verified: true,
    },
    globalChildSafety: {
      stars: parseNcapStars(row["Global NCAP Child Safety Rating"]),
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
    hillDescentControl: {
      value: yn(row["Hill Descent Control"]),
      verified: true,
    },
    camera360: {
      value: yn(row["360 View Camera"]),
      verified: true,
    },
    blindSpotMonitor: {
      value: blindSpot,
      verified: true,
    },
    adas: {
      level: blindSpot ? 1 : 0,
      supported: blindSpot,
      status: "verified",
      verified: true,
      features: {
        blindSpotMonitor: blindSpot,
      },
    },
  };
}

function buildChargingFromRow(row) {
  const ac15Text = row["Charging Time 15 A Plug Point"];
  const ac72Text = row["Charging Time 7.2 kW"];
  const dcText = row["Charging time"] || row["Charging Time"];
  const dcKw = parseDcKw(dcText);
  const portableRaw = String(row["Portable Charging Cable"] || "").trim();

  return {
    port: trimName(row["Charging Standard"]) || "CCS2",
    portableChargerIncluded:
      yn(portableRaw) || portableRaw.toLowerCase() === "yes",
    acKw15A: 3.3,
    acKw72: 7.2,
    acTime0to100Hours15A: parseDurationHours(ac15Text),
    acTime0to100Hours72: parseDurationHours(ac72Text),
    acKw: 7.2,
    acTime0to100Hours: parseDurationHours(ac72Text),
    dcKw,
    dcTime20to80Minutes: parseDcMinutes(dcText),
    dcTime10to80Minutes: parseDcMinutes(dcText),
    fastChargingSupported: yn(row["Fast Charging"]),
    dcChargeWindow: "20–80%",
  };
}

async function resolveFallbackMedia() {
  try {
    const url = pathToFileURL(
      join(ROOT, "src/media/familyMediaManifest.js")
    ).href;
    const mod = await import(url);
    return mod.getProductionFamilyMedia(TATA_PUNCH_FAMILY_SLUG) || null;
  } catch {
    return null;
  }
}

function resolveFamilyMedia(family, fallbackMedia) {
  const heroImage = trimName(family.heroImage);
  const compareImage = trimName(family.compareImage);
  const listingImage = trimName(family.listingImage);
  const hasDossierMedia = Boolean(heroImage || compareImage || listingImage);

  if (hasDossierMedia) {
    return {
      heroImage: heroImage || fallbackMedia?.heroImage || null,
      compareImage: compareImage || fallbackMedia?.compareThumbnail || null,
      listingImage: listingImage || fallbackMedia?.listingThumbnail || null,
      compareThumbnail: compareImage || fallbackMedia?.compareThumbnail || null,
      listingThumbnail: listingImage || fallbackMedia?.listingThumbnail || null,
      verificationStatus: "verified",
      source: "dossier",
    };
  }

  return {
    heroImage: fallbackMedia?.heroImage || null,
    compareImage: fallbackMedia?.compareThumbnail || null,
    listingImage: fallbackMedia?.listingThumbnail || null,
    compareThumbnail: fallbackMedia?.compareThumbnail || null,
    listingThumbnail: fallbackMedia?.listingThumbnail || null,
    verificationStatus: "pending_verification",
    source: "existing_catalog",
  };
}

async function mergeDossier(workbookPath) {
  const sheets = readXlsxSheets(workbookPath);
  const family = sheetToKeyValue(sheets.FAMILY_MASTER);
  const variants = sheetToTable(sheets.VARIANTS_MASTER);
  const chargingRows = sheetToTable(sheets.CHARGING_INTELLIGENCE);
  const safetyRows = sheetToTable(sheets.SAFETY_INTELLIGENCE);
  const fallbackMedia = await resolveFallbackMedia();

  const chargingByVariant = Object.fromEntries(
    chargingRows.map((r) => [
      trimName(r.Variant || r["Car Model"]),
      r,
    ])
  );
  const safetyByVariant = Object.fromEntries(
    safetyRows.map((r) => [trimName(r.Model), r])
  );

  const familyMedia = resolveFamilyMedia(family, fallbackMedia);
  const dossierVersion =
    trimName(family.dossierVersion) || "v1";

  const familySafety = buildSafetyFromRow(
    safetyRows[0] || {
      "Bharat NCAP Safety Rating": family["Bharat NCAP"],
      "Global NCAP Safety Rating": family["Global NCAP"],
      "No. of Airbags": family.airbags,
      "Electronic Stability Control (ESC)": family.ESC,
    }
  );

  const mergedVariants = variants.map((v) => {
    const name = trimName(v.Variant);
    const displayName = stripPunchPrefix(name);
    const variantSlug = variantNameToSlug(name);
    const midc = parseMidcRange(v["MIDC Range"]);
    const c75 = parseC75Range(v["Real Range (C75)"]);
    const bhp = parseBhp(v.Power);
    const chargingRow = chargingByVariant[name];
    const safetyRow = safetyByVariant[name];

    return {
      slug: `${TATA_PUNCH_FAMILY_SLUG}-${variantSlug}`,
      variantSlug,
      name: displayName,
      trimLabel: displayName,
      priceInr: parseLakhPrice(v.Price),
      batteryKwh: parseKwh(v.Battery),
      rangeKmClaimed: midc.claimed,
      rangeKmClaimedMin: midc.min,
      rangeKmClaimedMax: midc.max,
      rangeKmRealWorldMin: c75.min,
      rangeKmRealWorldMax: c75.max,
      rangeStandard: "MIDC",
      powerBhp: bhp,
      powerKw: bhpToKw(bhp),
      torqueNm: parseTorque(v.Torque),
      accel0To100Sec: parseAccelSec(v["Acceleration (0-100)"]),
      charging: chargingRow ? buildChargingFromRow(chargingRow) : null,
      safety: safetyRow ? buildSafetyFromRow(safetyRow) : familySafety,
    };
  });

  return {
    workbookPath,
    dossierVersion,
    family: {
      familySlug: trimName(family.familySlug) || TATA_PUNCH_FAMILY_SLUG,
      brand: trimName(family.brand),
      model: trimName(family.model),
      vehicleType: trimName(family.vehicleType),
      bodyType: trimName(family.bodyType),
      seats: Number(family.seats) || 5,
      drivetrain: trimName(family.drivetrain) || "FWD",
      launchStatus: trimName(family.launchStatus),
    },
    familyMedia,
    variants: mergedVariants,
    familySafety,
  };
}

function emitVerifiedModule(data) {
  const { family, variants, familySafety, familyMedia, dossierVersion } = data;

  return `/**
 * Tata Punch EV — verified dossier ingestion (${dossierVersion}).
 * Generated by scripts/ingest-punch-dossier.mjs — do not hand-edit variant rows.
 */

export const VERIFICATION_SOURCE = ${JSON.stringify(VERIFICATION_SOURCE)};
export const VERIFICATION_OWNER = ${JSON.stringify(VERIFICATION_OWNER)};
export const DOSSIER_VERSION = ${JSON.stringify(dossierVersion)};
export const TATA_PUNCH_FAMILY_SLUG = ${JSON.stringify(TATA_PUNCH_FAMILY_SLUG)};

export const TATA_PUNCH_FAMILY_MEDIA = Object.freeze(${JSON.stringify(
    familyMedia,
    null,
    2
  )});

export const TATA_PUNCH_VERIFIED_SAFETY = Object.freeze(${JSON.stringify(
    familySafety,
    null,
    2
  )});

export const TATA_PUNCH_VERIFIED_VARIANTS = Object.freeze(${JSON.stringify(
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
  if (charging.dcTime20to80Minutes) {
    parts.push(\`20–80% in ~\${charging.dcTime20to80Minutes} min\`);
  }
  if (charging.acTime0to100Hours) {
    parts.push(\`AC 10–100% in ~\${charging.acTime0to100Hours} hrs\`);
  }
  return parts.join(" · ");
}

export function buildTataPunchTier1Definition() {
  const variants = TATA_PUNCH_VERIFIED_VARIANTS.map((v) => ({
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
      drivetrain: ${JSON.stringify(family.drivetrain || "FWD")},
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

  const primary = TATA_PUNCH_VERIFIED_VARIANTS[0];
  const charging = primary?.charging || {};
  const mediaVerified =
    TATA_PUNCH_FAMILY_MEDIA.verificationStatus === "verified";

  return {
    slug: TATA_PUNCH_FAMILY_SLUG,
    brand: ${JSON.stringify(family.brand)},
    name: ${JSON.stringify(family.model)},
    category: "SUV",
    compareReady: true,
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    governanceStatus: "verified",
    safetyMeta: TATA_PUNCH_VERIFIED_SAFETY,
    mediaMeta: TATA_PUNCH_FAMILY_MEDIA,
    heroImage: mediaVerified ? TATA_PUNCH_FAMILY_MEDIA.heroImage : undefined,
    compareThumbnail: mediaVerified
      ? TATA_PUNCH_FAMILY_MEDIA.compareImage
      : undefined,
    listingThumbnail: mediaVerified
      ? TATA_PUNCH_FAMILY_MEDIA.listingImage
      : undefined,
    seoMeta: {
      metaTitle: "Tata Punch EV — Price, Range & Charging | EVSavari",
      metaDescription:
        "Compare all Tata Punch EV variants with verified MIDC range, charging times, and safety on EVSavari.",
    },
    ownershipMeta: {
      apartmentFriendly: true,
      compactParking: true,
      cityPrimary: true,
    },
    chargingMeta: {
      acKw: charging.acKw,
      dcKw: charging.dcKw,
      port: charging.port,
      acTime0to100Hours: charging.acTime0to100Hours,
      dcTime20to80Minutes: charging.dcTime20to80Minutes,
      portableChargerIncluded: charging.portableChargerIncluded,
      fastChargingSupported: charging.fastChargingSupported,
    },
    variants,
  };
}

export function getTataPunchVerifiedVariant(slug = "") {
  const normalized = String(slug || "").toLowerCase();
  if (normalized === TATA_PUNCH_FAMILY_SLUG) {
    return TATA_PUNCH_VERIFIED_VARIANTS[0];
  }
  return (
    TATA_PUNCH_VERIFIED_VARIANTS.find(
      (v) =>
        v.slug === normalized ||
        normalized.endsWith(\`-\${v.variantSlug}\`) ||
        normalized === v.variantSlug
    ) || null
  );
}

export function buildTataPunchVerifiedOverlay(car) {
  const slug = String(car?.slug || car?.catalogMeta?.slug || "").toLowerCase();
  const variant =
    getTataPunchVerifiedVariant(slug) ||
    (slug.startsWith(TATA_PUNCH_FAMILY_SLUG)
      ? TATA_PUNCH_VERIFIED_VARIANTS[0]
      : null);

  if (!variant) return null;

  const charging = variant.charging || {};
  const safety = variant.safety || TATA_PUNCH_VERIFIED_SAFETY;
  const mediaVerified =
    TATA_PUNCH_FAMILY_MEDIA.verificationStatus === "verified";

  const heroImage =
    (mediaVerified && TATA_PUNCH_FAMILY_MEDIA.heroImage) ||
    car.heroImage ||
    null;
  const compareThumbnail =
    (mediaVerified && TATA_PUNCH_FAMILY_MEDIA.compareImage) ||
    car.compareThumbnail ||
    null;
  const listingThumbnail =
    (mediaVerified && TATA_PUNCH_FAMILY_MEDIA.listingImage) ||
    car.listingThumbnail ||
    null;

  return {
    verified: true,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: DOSSIER_VERSION,
    governanceStatus: "verified",
    ...(heroImage ? { heroImage } : {}),
    ...(compareThumbnail ? { compareThumbnail } : {}),
    ...(listingThumbnail ? { listingThumbnail } : {}),
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
      familySlug: TATA_PUNCH_FAMILY_SLUG,
      slug: variant.slug,
      safety,
      media: TATA_PUNCH_FAMILY_MEDIA,
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
        acKw15A: charging.acKw15A,
        acKw72: charging.acKw72,
        dcKw: charging.dcKw,
        connectorType: charging.port,
        acTime0to100Hours: charging.acTime0to100Hours,
        acTime0to100Hours15A: charging.acTime0to100Hours15A,
        acTime0to100Hours72: charging.acTime0to100Hours72,
        dcTime20to80Minutes: charging.dcTime20to80Minutes,
        portableChargerIncluded: charging.portableChargerIncluded,
        homeChargingSupported: true,
        fastChargingSupported: charging.fastChargingSupported,
      },
      chargingPracticality: {
        acFullChargeHours: charging.acTime0to100Hours,
        dcTime20to80Minutes: charging.dcTime20to80Minutes,
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
          time20to80Min: charging.dcTime20to80Minutes,
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
  const media = data.familyMedia;
  const summary = {
    generatedAt: new Date().toISOString(),
    workbook: data.workbookPath,
    verificationSource: VERIFICATION_SOURCE,
    verificationOwner: VERIFICATION_OWNER,
    dossierVersion: data.dossierVersion,
    familySlug: TATA_PUNCH_FAMILY_SLUG,
    variantsIngested: data.variants.length,
    variantNames: data.variants.map((v) => v.name),
    chargingRecordsIngested: data.variants.filter((v) => v.charging).length,
    safetyRecordsIngested: data.variants.filter((v) => v.safety).length,
    mediaStatus: {
      verificationStatus: media.verificationStatus,
      source: media.source,
      heroImage: media.heroImage || null,
      compareImage: media.compareImage || null,
      listingImage: media.listingImage || null,
      dossierUrlsPresent: media.source === "dossier",
    },
    validation,
  };
  const jsonPath = join(reportDir, `punch-dossier-ingestion-${stamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
  return { summary, jsonPath };
}

export async function ingestPunchDossier(workbookPath = resolveWorkbookPath()) {
  const data = await mergeDossier(workbookPath);
  const outPath = join(
    ROOT,
    "src/data/catalog/verified/tataPunchEvVerified.js"
  );
  writeFileSync(outPath, emitVerifiedModule(data));
  return data;
}

async function main() {
  console.log("\n=== Tata Punch EV dossier ingestion ===\n");
  const workbookPath = resolveWorkbookPath();
  console.log(`Workbook: ${workbookPath}`);
  const data = await ingestPunchDossier(workbookPath);
  const { jsonPath, summary } = writeIngestionSummary(data);
  console.log(`Variants: ${summary.variantsIngested}`);
  console.log(`Charging: ${summary.chargingRecordsIngested}`);
  console.log(`Safety: ${summary.safetyRecordsIngested}`);
  console.log(`Media status: ${summary.mediaStatus.verificationStatus}`);
  console.log(`Summary: ${jsonPath}`);
  console.log("\nIngestion module written.\n");
}

if (process.argv[1]?.endsWith("ingest-punch-dossier.mjs")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
