/**
 * AUTO-GENERATED — do not edit manually.
 * Source: public/catalog/golden-dataset/vehicles/volvo-ex40.json
 * Regenerate: npm run catalog:generate-verified
 */

export const FAMILY_SLUG = "volvo-ex40";

export const FAMILY_MEDIA = Object.freeze({
  "heroImage": "/images/cars/volvo-ex40/front.webp",
  "compareImage": "/images/cars/volvo-ex40/compare.webp",
  "listingImage": "/images/cars/volvo-ex40/listing.webp",
  "compareThumbnail": "/images/cars/volvo-ex40/compare.webp",
  "listingThumbnail": "/images/cars/volvo-ex40/listing.webp",
  "source": "local-cars",
  "verificationStatus": "present"
});

export const VERIFIED_VARIANTS = Object.freeze([
  {
    "slug": "volvo-ex40-single-motor-extended-range",
    "variantSlug": "single-motor-extended-range",
    "name": "Single Motor Extended Range",
    "trimLabel": "Single Motor Extended Range",
    "priceInr": 5990000,
    "batteryKwh": 69,
    "rangeKmClaimed": 568,
    "rangeStandard": "592",
    "rangeKmRealWorldMin": null,
    "rangeKmRealWorldMax": null,
    "powerBhp": 238,
    "powerKw": 177.48,
    "torqueNm": null,
    "charging": {
      "port": "CCS2",
      "acKw": 11,
      "dcKw": 150,
      "acTime0to100Hours": null,
      "dcTime10to80Minutes": 40,
      "fastChargingSupported": true,
      "portableChargerIncluded": true
    },
    "featureTags": [],
    "catalogMeta": {
      "familySlug": "volvo-ex40",
      "slug": "volvo-ex40-single-motor-extended-range",
      "claimedRangeKm": 568,
      "claimedRangeStandard": "592",
      "chargingIntelligence": {
        "acKw": 11,
        "dcKw": 150,
        "acTime0to100Hours": null,
        "dcTime10to80Minutes": 40
      },
      "performance": {
        "powerKw": 177.48,
        "powerBhp": 238,
        "torqueNm": null
      }
    }
  },
  {
    "slug": "volvo-ex40-twin-motor",
    "variantSlug": "twin-motor",
    "name": "Twin Motor",
    "trimLabel": "Twin Motor",
    "priceInr": 6490000,
    "batteryKwh": 69,
    "rangeKmClaimed": 549,
    "rangeStandard": "592",
    "rangeKmRealWorldMin": null,
    "rangeKmRealWorldMax": null,
    "powerBhp": 238,
    "powerKw": 177.48,
    "torqueNm": null,
    "charging": {
      "port": "CCS2",
      "acKw": 11,
      "dcKw": 150,
      "acTime0to100Hours": null,
      "dcTime10to80Minutes": 40,
      "fastChargingSupported": true,
      "portableChargerIncluded": true
    },
    "featureTags": [],
    "catalogMeta": {
      "familySlug": "volvo-ex40",
      "slug": "volvo-ex40-twin-motor",
      "claimedRangeKm": 549,
      "claimedRangeStandard": "592",
      "chargingIntelligence": {
        "acKw": 11,
        "dcKw": 150,
        "acTime0to100Hours": null,
        "dcTime10to80Minutes": 40
      },
      "performance": {
        "powerKw": 177.48,
        "powerBhp": 238,
        "torqueNm": null
      }
    }
  }
]);

export const DOSSIER_META = Object.freeze({
  "brand": "Volvo",
  "familyName": "EX40",
  "category": "SUV",
  "displayName": "Volvo EX40",
  "verificationLevel": "manual_review",
  "verificationSource": "Golden Dataset",
  "verificationOwner": "EVSavari Catalog Generator",
  "dossierVersion": "generated-v1",
  "sources": [
    "https://www.volvocars.com/in/cars/ex40-electric/",
    "https://www.cardekho.com/volvo/ex40"
  ],
  "verifiedAt": "2026-06-10"
});
