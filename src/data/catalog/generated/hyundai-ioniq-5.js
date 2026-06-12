/**
 * AUTO-GENERATED — do not edit manually.
 * Source: public/catalog/golden-dataset/vehicles/hyundai-ioniq-5.json
 * Regenerate: npm run catalog:generate-verified
 */

export const FAMILY_SLUG = "hyundai-ioniq-5";

export const FAMILY_MEDIA = Object.freeze({
  "heroImage": "/images/cars/hyundai-ioniq-5/front.webp",
  "compareImage": "/images/cars/hyundai-ioniq-5/compare.webp",
  "listingImage": "/images/cars/hyundai-ioniq-5/listing.webp",
  "compareThumbnail": "/images/cars/hyundai-ioniq-5/compare.webp",
  "listingThumbnail": "/images/cars/hyundai-ioniq-5/listing.webp",
  "source": "local-cars",
  "verificationStatus": "present"
});

export const VERIFIED_VARIANTS = Object.freeze([
  {
    "slug": "hyundai-ioniq-5-rwd",
    "variantSlug": "rwd",
    "name": "RWD",
    "trimLabel": "RWD",
    "priceInr": 4495000,
    "batteryKwh": 58,
    "rangeKmClaimed": 631,
    "rangeStandard": "ARAI",
    "rangeKmRealWorldMin": null,
    "rangeKmRealWorldMax": null,
    "powerBhp": 217,
    "powerKw": 160,
    "torqueNm": 350,
    "charging": {
      "port": "CCS2",
      "acKw": 11,
      "dcKw": 175,
      "acTime0to100Hours": null,
      "dcTime10to80Minutes": 35,
      "fastChargingSupported": true,
      "portableChargerIncluded": true
    },
    "featureTags": [],
    "catalogMeta": {
      "familySlug": "hyundai-ioniq-5",
      "slug": "hyundai-ioniq-5-rwd",
      "claimedRangeKm": 631,
      "claimedRangeStandard": "ARAI",
      "chargingIntelligence": {
        "acKw": 11,
        "dcKw": 175,
        "acTime0to100Hours": null,
        "dcTime10to80Minutes": 35
      },
      "performance": {
        "powerKw": 160,
        "powerBhp": 217,
        "torqueNm": 350
      }
    }
  },
  {
    "slug": "hyundai-ioniq-5-awd",
    "variantSlug": "awd",
    "name": "AWD",
    "trimLabel": "AWD",
    "priceInr": 5495000,
    "batteryKwh": 72.6,
    "rangeKmClaimed": 508,
    "rangeStandard": "ARAI",
    "rangeKmRealWorldMin": null,
    "rangeKmRealWorldMax": null,
    "powerBhp": 325,
    "powerKw": 239,
    "torqueNm": 605,
    "charging": {
      "port": "CCS2",
      "acKw": 11,
      "dcKw": 175,
      "acTime0to100Hours": null,
      "dcTime10to80Minutes": 35,
      "fastChargingSupported": true,
      "portableChargerIncluded": true
    },
    "featureTags": [],
    "catalogMeta": {
      "familySlug": "hyundai-ioniq-5",
      "slug": "hyundai-ioniq-5-awd",
      "claimedRangeKm": 508,
      "claimedRangeStandard": "ARAI",
      "chargingIntelligence": {
        "acKw": 11,
        "dcKw": 175,
        "acTime0to100Hours": null,
        "dcTime10to80Minutes": 35
      },
      "performance": {
        "powerKw": 239,
        "powerBhp": 325,
        "torqueNm": 605
      }
    }
  }
]);

export const DOSSIER_META = Object.freeze({
  "brand": "Hyundai",
  "familyName": "Ioniq 5",
  "category": "SUV",
  "displayName": "Hyundai Ioniq 5",
  "verificationLevel": "manual_review",
  "verificationSource": "Golden Dataset",
  "verificationOwner": "EVSavari Catalog Generator",
  "dossierVersion": "generated-v1",
  "sources": [
    "https://www.hyundai.com/in/en/find-a-car/ioniq-5/highlights",
    "https://www.cardekho.com/hyundai/ioniq-5"
  ],
  "verifiedAt": "2026-06-10"
});
