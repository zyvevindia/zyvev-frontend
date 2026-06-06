/**
 * Tier-1 Indian EV catalog definitions — operational seed data.
 * Indicative specs for persistence + compare readiness; verify against OEM before campaigns.
 */

import { buildTataNexonTier1Definition } from "../../data/catalog/verified/tataNexonEvVerified.js";
import { buildTataPunchTier1Definition } from "../../data/catalog/verified/tataPunchEvVerified.js";
import { buildTataTiagoTier1Definition } from "../../data/catalog/verified/tataTiagoEvVerified.js";

/** Safety skeleton — no fabricated star ratings. */
const PRODUCTIONIZATION_SAFETY_SKELETON = {
  bharatNcap: { status: "not_tested" },
  globalNcap: { status: "unknown" },
  airbags: { status: "unknown" },
  abs: { status: "unknown" },
  esc: { status: "unknown" },
  traction_control: { status: "unknown" },
  adas: { status: "unknown" },
};

function productionizationSeo(brand, name) {
  return {
    metaTitle: `${brand} ${name} — Price, Range & Charging | EVSavari`,
    metaDescription: `Compare ${brand} ${name} variants, range, charging, and ownership costs on EVSavari. Indicative data — verify with dealer.`,
  };
}

export const TIER1_CATALOG_DEFINITIONS = [
  buildTataNexonTier1Definition(),
  buildTataPunchTier1Definition(),
  buildTataTiagoTier1Definition(),
  {
    slug: "tata-curvv-ev",
    brand: "Tata",
    name: "Curvv EV",
    category: "SUV",
    compareReady: true,
    safetyMeta: PRODUCTIONIZATION_SAFETY_SKELETON,
    seoMeta: productionizationSeo("Tata", "Curvv EV"),
    ownershipMeta: { apartmentFriendly: true, highwaySuitable: true, familyPractical: true },
    chargingMeta: { acKw: 7.2, dcKw: 150, port: "CCS2" },
    variants: [
      {
        slug: "smart",
        name: "Smart",
        priceInr: 1799000,
        rangeKmClaimed: 502,
        rangeKmRealWorld: 300,
        batteryKwh: 45,
      },
      {
        slug: "empowered",
        name: "Empowered",
        priceInr: 1999000,
        rangeKmClaimed: 502,
        rangeKmRealWorld: 305,
        batteryKwh: 45,
      },
    ],
  },
  {
    slug: "mg-comet-ev",
    brand: "MG",
    name: "Comet EV",
    category: "Hatchback",
    compareReady: true,
    ownershipMeta: { apartmentFriendly: true, compactParking: true, cityPrimary: true },
    chargingMeta: { acKw: 3.3, dcKw: 0, port: "Type2" },
    variants: [
      {
        slug: "play",
        name: "Play",
        priceInr: 699000,
        rangeKmClaimed: 230,
        rangeKmRealWorld: 155,
        batteryKwh: 17.3,
      },
      {
        slug: "play-plus",
        name: "Play Plus",
        priceInr: 849000,
        rangeKmClaimed: 230,
        rangeKmRealWorld: 160,
        batteryKwh: 17.3,
      },
    ],
  },
  {
    slug: "mg-zs-ev",
    brand: "MG",
    name: "ZS EV",
    category: "SUV",
    compareReady: true,
    safetyMeta: PRODUCTIONIZATION_SAFETY_SKELETON,
    seoMeta: productionizationSeo("MG", "ZS EV"),
    ownershipMeta: { apartmentFriendly: true, highwaySuitable: true, familyPractical: true },
    chargingMeta: { acKw: 7.4, dcKw: 50, port: "CCS2" },
    variants: [
      {
        slug: "excite",
        name: "Excite",
        priceInr: 1799000,
        rangeKmClaimed: 461,
        rangeKmRealWorld: 275,
        batteryKwh: 50.3,
      },
      {
        slug: "exclusive-plus",
        name: "Exclusive Plus",
        priceInr: 1999000,
        rangeKmClaimed: 461,
        rangeKmRealWorld: 280,
        batteryKwh: 50.3,
      },
    ],
  },
  {
    slug: "mahindra-be-6",
    brand: "Mahindra",
    name: "BE 6",
    category: "SUV",
    compareReady: true,
    ownershipMeta: { apartmentFriendly: true, performanceOriented: true, highwaySuitable: true },
    chargingMeta: { acKw: 11, dcKw: 150, port: "CCS2" },
    variants: [
      {
        slug: "pack-one",
        name: "Pack One",
        priceInr: 1899000,
        rangeKmClaimed: 682,
        rangeKmRealWorld: 380,
        batteryKwh: 59,
      },
      {
        slug: "pack-three",
        name: "Pack Three",
        priceInr: 2299000,
        rangeKmClaimed: 682,
        rangeKmRealWorld: 395,
        batteryKwh: 79,
      },
    ],
  },
  {
    slug: "mahindra-xev-9e",
    brand: "Mahindra",
    name: "XEV 9e",
    category: "SUV",
    compareReady: true,
    ownershipMeta: { apartmentFriendly: true, familyPractical: true, highwaySuitable: true },
    chargingMeta: { acKw: 11, dcKw: 175, port: "CCS2" },
    variants: [
      {
        slug: "pack-one",
        name: "Pack One",
        priceInr: 2199000,
        rangeKmClaimed: 542,
        rangeKmRealWorld: 320,
        batteryKwh: 59,
      },
      {
        slug: "pack-three",
        name: "Pack Three",
        priceInr: 2699000,
        rangeKmClaimed: 542,
        rangeKmRealWorld: 335,
        batteryKwh: 79,
      },
    ],
  },
  {
    slug: "mahindra-xuv400",
    brand: "Mahindra",
    name: "XUV400",
    category: "SUV",
    compareReady: true,
    ownershipMeta: { apartmentFriendly: true, familyPractical: true, highwaySuitable: true },
    chargingMeta: { acKw: 3.3, dcKw: 50, port: "CCS2" },
    variants: [
      {
        slug: "el-pro",
        name: "EL Pro",
        priceInr: 1599000,
        rangeKmClaimed: 456,
        rangeKmRealWorld: 270,
        batteryKwh: 39.4,
      },
      {
        slug: "el-8-5",
        name: "EL 8.5",
        priceInr: 1749000,
        rangeKmClaimed: 456,
        rangeKmRealWorld: 275,
        batteryKwh: 39.4,
      },
    ],
  },
  {
    slug: "byd-atto-3",
    brand: "BYD",
    name: "Atto 3",
    category: "SUV",
    compareReady: true,
    safetyMeta: PRODUCTIONIZATION_SAFETY_SKELETON,
    seoMeta: productionizationSeo("BYD", "Atto 3"),
    ownershipMeta: { apartmentFriendly: true, familyPractical: true, highwaySuitable: true },
    chargingMeta: { acKw: 7, dcKw: 80, port: "CCS2" },
    variants: [
      {
        slug: "dynamic",
        name: "Dynamic",
        priceInr: 2499000,
        rangeKmClaimed: 480,
        rangeKmRealWorld: 300,
        batteryKwh: 60.48,
      },
      {
        slug: "superior",
        name: "Superior",
        priceInr: 3399000,
        rangeKmClaimed: 480,
        rangeKmRealWorld: 305,
        batteryKwh: 60.48,
      },
    ],
  },
  {
    slug: "hyundai-kona-electric",
    brand: "Hyundai",
    name: "Kona Electric",
    category: "SUV",
    compareReady: true,
    ownershipMeta: { apartmentFriendly: true, highwaySuitable: true, serviceNetwork: "hyundai" },
    chargingMeta: { acKw: 7.2, dcKw: 100, port: "CCS2" },
    variants: [
      {
        slug: "premium",
        name: "Premium",
        priceInr: 2399000,
        rangeKmClaimed: 484,
        rangeKmRealWorld: 310,
        batteryKwh: 64,
      },
    ],
  },
];

export function getTier1Definition(slug) {
  return TIER1_CATALOG_DEFINITIONS.find((d) => d.slug === slug) || null;
}

export function listTier1Slugs() {
  return TIER1_CATALOG_DEFINITIONS.map((d) => d.slug);
}
