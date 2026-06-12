/**
 * AUTO-GENERATED — do not edit manually.
 * Source: public/catalog/golden-dataset/vehicles/hyundai-kona-electric.json
 * Regenerate: npm run catalog:generate-verified
 */

export const FAMILY_SLUG = "hyundai-kona-electric";

export const FAMILY_MEDIA = Object.freeze({
  "heroImage": null,
  "compareImage": null,
  "listingImage": null,
  "compareThumbnail": null,
  "listingThumbnail": null,
  "source": "local-cars",
  "verificationStatus": "partial"
});

export const VERIFIED_VARIANTS = Object.freeze([
  {
    "slug": "hyundai-kona-electric-premium",
    "variantSlug": "premium",
    "name": "Premium",
    "trimLabel": "Premium",
    "priceInr": 2384000,
    "batteryKwh": 39.2,
    "rangeKmClaimed": 452,
    "rangeStandard": "ARAI",
    "rangeKmRealWorldMin": null,
    "rangeKmRealWorldMax": null,
    "powerBhp": 136,
    "powerKw": 100,
    "torqueNm": 395,
    "charging": {
      "port": "CCS2",
      "acKw": 7.2,
      "dcKw": 100,
      "acTime0to100Hours": null,
      "dcTime10to80Minutes": null,
      "fastChargingSupported": true,
      "portableChargerIncluded": true
    },
    "featureTags": [],
    "catalogMeta": {
      "familySlug": "hyundai-kona-electric",
      "slug": "hyundai-kona-electric-premium",
      "claimedRangeKm": 452,
      "claimedRangeStandard": "ARAI",
      "chargingIntelligence": {
        "acKw": 7.2,
        "dcKw": 100,
        "acTime0to100Hours": null,
        "dcTime10to80Minutes": null
      },
      "performance": {
        "powerKw": 100,
        "powerBhp": 136,
        "torqueNm": 395
      }
    }
  }
]);

export const DOSSIER_META = Object.freeze({
  "brand": "Hyundai",
  "familyName": "Kona Electric",
  "category": "SUV",
  "displayName": "Hyundai Kona Electric",
  "verificationLevel": "manual_review",
  "verificationSource": "Golden Dataset",
  "verificationOwner": "EVSavari Catalog Generator",
  "dossierVersion": "generated-v1",
  "sources": [
    "https://www.hyundai.com/in/en/find-a-car/kona-electric/highlights",
    "https://www.cardekho.com/hyundai/kona-electric"
  ],
  "verifiedAt": "2026-06-10"
});
