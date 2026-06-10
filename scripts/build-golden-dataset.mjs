/**
 * Build golden dataset JSON from verified dossiers (Nexon, Punch) + static benchmarks.
 * Writes to docs/catalog/golden-dataset/vehicles/
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  TATA_NEXON_FAMILY_SLUG,
  TATA_NEXON_VERIFIED_VARIANTS,
} from "../src/data/catalog/verified/tataNexonEvVerified.js";
import {
  TATA_PUNCH_FAMILY_SLUG,
  TATA_PUNCH_VERIFIED_VARIANTS,
} from "../src/data/catalog/verified/tataPunchEvVerified.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../docs/catalog/golden-dataset/vehicles");

function variantToGolden(v) {
  return {
    variantName: v.name,
    priceInr: v.priceInr,
    batteryKwh: v.batteryKwh,
    rangeKm: v.rangeKmClaimed,
    acChargingKw: v.charging?.acKw ?? null,
    dcChargingKw: v.charging?.dcKw ?? null,
    features: {
      adas: Boolean(v.safety?.adas?.supported),
      camera360: Boolean(v.safety?.camera360?.value),
    },
  };
}

function buildFromVerified({
  id,
  displayName,
  familySlug,
  brand,
  model,
  bodyType,
  variants,
  verificationLevel = "verified_dossier",
}) {
  const prices = variants.map((v) => v.priceInr).filter(Number.isFinite);
  const batteries = [...new Set(variants.map((v) => v.batteryKwh).filter(Number.isFinite))];
  const ranges = variants.map((v) => v.rangeKmClaimed).filter(Number.isFinite);
  const sample = variants[0];

  return {
    id,
    displayName,
    familySlug,
    verifiedAt: new Date().toISOString().slice(0, 10),
    verificationLevel,
    sources: ["EVSavari Verified Dossier"],
    vehicle: { brand, model, bodyType, familySlug },
    fields: {
      brand,
      model,
      bodyType,
      familySlug,
      startingPrice: Math.min(...prices),
      topVariantPrice: Math.max(...prices),
      exShowroomPrice: Math.min(...prices),
      batteryCapacityKwh: batteries.length === 1 ? batteries[0] : null,
      claimedRangeKm: Math.max(...ranges),
      rangeTestStandard: sample?.rangeStandard || "MIDC",
      acChargingKw: sample?.charging?.acKw ?? null,
      dcChargingKw: sample?.charging?.dcKw ?? null,
      acChargingTimeHours: sample?.charging?.acTime0to100Hours ?? null,
      dcChargingTimeMinutes: sample?.charging?.dcTime10to80Minutes ?? null,
      powerPs: sample?.powerBhp ?? null,
      torqueNm: sample?.torqueNm ?? null,
      airbags: sample?.safety?.airbags?.count ?? null,
      adas: Boolean(sample?.safety?.adas?.supported),
      ncapRating: sample?.safety?.bharatNcap?.stars ?? null,
    },
    features: {
      sunroof: false,
      ventilatedSeats: false,
      camera360: Boolean(sample?.safety?.camera360?.value),
      connectedCar: true,
      v2l: false,
      v2v: false,
    },
    variants: variants.map(variantToGolden),
  };
}

const STATIC_BENCHMARKS = [
  {
    id: "tata-curvv-ev",
    displayName: "Tata Curvv EV",
    familySlug: "tata-curvv-ev",
    vehicle: { brand: "Tata", model: "Curvv EV", bodyType: "SUV", familySlug: "tata-curvv-ev" },
    fields: {
      brand: "Tata", model: "Curvv EV", bodyType: "SUV", familySlug: "tata-curvv-ev",
      startingPrice: 1799000, topVariantPrice: 2099000, exShowroomPrice: 1799000,
      batteryCapacityKwh: 45, claimedRangeKm: 502, rangeTestStandard: "MIDC",
      acChargingKw: 7.2, dcChargingKw: 150,
      acChargingTimeHours: 6.3, dcChargingTimeMinutes: 30,
      airbags: 6, adas: true, ncapRating: 5,
    },
    features: { sunroof: true, ventilatedSeats: true, camera360: true, connectedCar: true, v2l: true, v2v: false },
    variants: [
      { variantName: "Creative 45", priceInr: 1799000, batteryKwh: 45, rangeKm: 502, acChargingKw: 7.2, dcChargingKw: 150 },
      { variantName: "Accomplished 45", priceInr: 1949000, batteryKwh: 45, rangeKm: 502, acChargingKw: 7.2, dcChargingKw: 150 },
      { variantName: "Empowered 55", priceInr: 2099000, batteryKwh: 55, rangeKm: 585, acChargingKw: 7.2, dcChargingKw: 150 },
    ],
    verificationLevel: "manual_review",
    sources: ["OEM brochure + CarDekho cross-check (Jun 2026)"],
  },
  {
    id: "mg-windsor-ev",
    displayName: "MG Windsor EV",
    familySlug: "mg-windsor-ev",
    vehicle: { brand: "MG", model: "Windsor EV", bodyType: "SUV", familySlug: "mg-windsor-ev" },
    fields: {
      brand: "MG", model: "Windsor EV", bodyType: "SUV", familySlug: "mg-windsor-ev",
      startingPrice: 999000, topVariantPrice: 1689000, exShowroomPrice: 999000,
      batteryCapacityKwh: 38, claimedRangeKm: 331, rangeTestStandard: "ARAI",
      acChargingKw: 7.4, dcChargingKw: 45,
      airbags: 6, adas: false,
    },
    features: { sunroof: true, ventilatedSeats: true, camera360: true, connectedCar: true, v2l: false, v2v: false },
    variants: [
      { variantName: "Excite", priceInr: 999000, batteryKwh: 38, rangeKm: 331, acChargingKw: 7.4, dcChargingKw: 45 },
      { variantName: "Exclusive", priceInr: 1249000, batteryKwh: 38, rangeKm: 331, acChargingKw: 7.4, dcChargingKw: 45 },
      { variantName: "Essence", priceInr: 1689000, batteryKwh: 38, rangeKm: 331, acChargingKw: 7.4, dcChargingKw: 45 },
    ],
    verificationLevel: "manual_review",
    sources: ["MG India specs + CarWale (Jun 2026)"],
  },
  {
    id: "mahindra-be-6",
    displayName: "Mahindra BE 6",
    familySlug: "mahindra-be-6",
    vehicle: { brand: "Mahindra", model: "BE 6", bodyType: "SUV", familySlug: "mahindra-be-6" },
    fields: {
      brand: "Mahindra", model: "BE 6", bodyType: "SUV", familySlug: "mahindra-be-6",
      startingPrice: 1890000, topVariantPrice: 2690000, exShowroomPrice: 1890000,
      batteryCapacityKwh: 59, claimedRangeKm: 500, rangeTestStandard: "MIDC",
      acChargingKw: 11, dcChargingKw: 150,
      airbags: 6, adas: true,
    },
    features: { sunroof: true, ventilatedSeats: true, camera360: true, connectedCar: true, v2l: true, v2v: false },
    variants: [
      { variantName: "Pack One 59", priceInr: 1890000, batteryKwh: 59, rangeKm: 500, acChargingKw: 11, dcChargingKw: 150 },
      { variantName: "Pack Three 79", priceInr: 2290000, batteryKwh: 79, rangeKm: 683, acChargingKw: 11, dcChargingKw: 150 },
      { variantName: "Pack Three 79 Select", priceInr: 2690000, batteryKwh: 79, rangeKm: 683, acChargingKw: 11, dcChargingKw: 150 },
    ],
    verificationLevel: "manual_review",
    sources: ["Mahindra OEM + ZigWheels (Jun 2026)"],
  },
  {
    id: "mahindra-xev-9e",
    displayName: "Mahindra XEV 9e",
    familySlug: "mahindra-xev-9e",
    vehicle: { brand: "Mahindra", model: "XEV 9e", bodyType: "SUV", familySlug: "mahindra-xev-9e" },
    fields: {
      brand: "Mahindra", model: "XEV 9e", bodyType: "SUV", familySlug: "mahindra-xev-9e",
      startingPrice: 2190000, topVariantPrice: 3090000, exShowroomPrice: 2190000,
      batteryCapacityKwh: 79, claimedRangeKm: 656, rangeTestStandard: "MIDC",
      acChargingKw: 11, dcChargingKw: 175,
      airbags: 6, adas: true,
    },
    features: { sunroof: true, ventilatedSeats: true, camera360: true, connectedCar: true, v2l: true, v2v: false },
    variants: [
      { variantName: "Pack One 79", priceInr: 2190000, batteryKwh: 79, rangeKm: 656, acChargingKw: 11, dcChargingKw: 175 },
      { variantName: "Pack Three 79", priceInr: 2690000, batteryKwh: 79, rangeKm: 656, acChargingKw: 11, dcChargingKw: 175 },
      { variantName: "Pack Three 79 Select AWD", priceInr: 3090000, batteryKwh: 79, rangeKm: 600, acChargingKw: 11, dcChargingKw: 175 },
    ],
    verificationLevel: "manual_review",
    sources: ["Mahindra OEM + CarDekho (Jun 2026)"],
  },
  {
    id: "byd-atto-3",
    displayName: "BYD Atto 3",
    familySlug: "byd-atto-3",
    vehicle: { brand: "BYD", model: "Atto 3", bodyType: "SUV", familySlug: "byd-atto-3" },
    fields: {
      brand: "BYD", model: "Atto 3", bodyType: "SUV", familySlug: "byd-atto-3",
      startingPrice: 2499000, topVariantPrice: 3399000, exShowroomPrice: 2499000,
      batteryCapacityKwh: 60.48, claimedRangeKm: 521, rangeTestStandard: "ARAI",
      acChargingKw: 7, dcChargingKw: 80,
      acChargingTimeHours: 9.5, dcChargingTimeMinutes: 30,
      airbags: 6, adas: true,
    },
    features: { sunroof: true, ventilatedSeats: true, camera360: true, connectedCar: true, v2l: true, v2v: false },
    variants: [
      { variantName: "Dynamic", priceInr: 2499000, batteryKwh: 60.48, rangeKm: 521, acChargingKw: 7, dcChargingKw: 80 },
      { variantName: "Superior", priceInr: 2999000, batteryKwh: 60.48, rangeKm: 521, acChargingKw: 7, dcChargingKw: 80 },
      { variantName: "Special Edition", priceInr: 3399000, batteryKwh: 60.48, rangeKm: 521, acChargingKw: 7, dcChargingKw: 80 },
    ],
    verificationLevel: "manual_review",
    sources: ["BYD India + CarWale (Jun 2026)"],
  },
  {
    id: "hyundai-creta-electric",
    displayName: "Hyundai Creta Electric",
    familySlug: "hyundai-creta-electric",
    vehicle: { brand: "Hyundai", model: "Creta Electric", bodyType: "SUV", familySlug: "hyundai-creta-electric" },
    fields: {
      brand: "Hyundai", model: "Creta Electric", bodyType: "SUV", familySlug: "hyundai-creta-electric",
      startingPrice: 1799000, topVariantPrice: 2499000, exShowroomPrice: 1799000,
      batteryCapacityKwh: 42, claimedRangeKm: 390, rangeTestStandard: "ARAI",
      acChargingKw: 11, dcChargingKw: 150,
      airbags: 6, adas: true,
    },
    features: { sunroof: true, ventilatedSeats: true, camera360: true, connectedCar: true, v2l: false, v2v: false },
    variants: [
      { variantName: "Executive", priceInr: 1799000, batteryKwh: 42, rangeKm: 390, acChargingKw: 11, dcChargingKw: 150 },
      { variantName: "Premium", priceInr: 2099000, batteryKwh: 42, rangeKm: 390, acChargingKw: 11, dcChargingKw: 150 },
      { variantName: "Signature", priceInr: 2499000, batteryKwh: 51, rangeKm: 473, acChargingKw: 11, dcChargingKw: 150 },
    ],
    verificationLevel: "ops_benchmark",
    sources: ["Hyundai India launch specs estimate (Jun 2026) — review quarterly"],
  },
];

function wrapStatic(b) {
  return {
    ...b,
    verifiedAt: new Date().toISOString().slice(0, 10),
  };
}

const dossiers = [
  buildFromVerified({
    id: "tata-nexon-ev",
    displayName: "Tata Nexon EV",
    familySlug: TATA_NEXON_FAMILY_SLUG,
    brand: "Tata",
    model: "Nexon EV",
    bodyType: "SUV",
    variants: TATA_NEXON_VERIFIED_VARIANTS,
  }),
  buildFromVerified({
    id: "tata-punch-ev",
    displayName: "Tata Punch EV",
    familySlug: TATA_PUNCH_FAMILY_SLUG,
    brand: "Tata",
    model: "Punch EV",
    bodyType: "SUV",
    variants: TATA_PUNCH_VERIFIED_VARIANTS,
  }),
  ...STATIC_BENCHMARKS.map(wrapStatic),
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const d of dossiers) {
  const file = path.join(OUT_DIR, `${d.id}.json`);
  fs.writeFileSync(file, JSON.stringify(d, null, 2));
  console.log("Wrote", file);
}

const manifest = {
  version: "golden-v1",
  generatedAt: new Date().toISOString(),
  count: dossiers.length,
  vehicles: dossiers.map((d) => ({
    id: d.id,
    displayName: d.displayName,
    familySlug: d.familySlug,
    verificationLevel: d.verificationLevel,
    variantCount: d.variants.length,
  })),
};

fs.writeFileSync(
  path.resolve(__dirname, "../docs/catalog/golden-dataset/manifest.json"),
  JSON.stringify(manifest, null, 2)
);

// Mirror to public for browser fetch in benchmark dashboard
const publicDir = path.resolve(__dirname, "../public/catalog/golden-dataset");
fs.mkdirSync(path.join(publicDir, "vehicles"), { recursive: true });
fs.copyFileSync(
  path.resolve(__dirname, "../docs/catalog/golden-dataset/manifest.json"),
  path.join(publicDir, "manifest.json")
);
for (const d of dossiers) {
  fs.copyFileSync(
    path.join(OUT_DIR, `${d.id}.json`),
    path.join(publicDir, "vehicles", `${d.id}.json`)
  );
}

console.log(`\nGolden dataset: ${dossiers.length} vehicles`);
