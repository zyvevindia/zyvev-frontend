/**
 * AUTO-GENERATED — do not edit manually.
 * Source: public/catalog/golden-dataset/vehicles/kia-ev6.json
 * Regenerate: npm run catalog:generate-verified
 */

export const FAMILY_SLUG = "kia-ev6";

export const FAMILY_MEDIA = Object.freeze({
  "heroImage": "/images/cars/kia-ev6/front.webp",
  "compareImage": "/images/cars/kia-ev6/compare.webp",
  "listingImage": "/images/cars/kia-ev6/listing.webp",
  "compareThumbnail": "/images/cars/kia-ev6/compare.webp",
  "listingThumbnail": "/images/cars/kia-ev6/listing.webp",
  "source": "local-cars",
  "verificationStatus": "present"
});

export const VERIFIED_VARIANTS = Object.freeze([
  {
    "slug": "kia-ev6-gt-line",
    "variantSlug": "gt-line",
    "name": "GT Line",
    "trimLabel": "GT Line",
    "priceInr": 6590000,
    "batteryKwh": 77.4,
    "rangeKmClaimed": 528,
    "rangeStandard": "ARAI",
    "rangeKmRealWorldMin": null,
    "rangeKmRealWorldMax": null,
    "powerBhp": 321,
    "powerKw": 239.37,
    "torqueNm": null,
    "charging": {
      "port": "CCS2",
      "acKw": 11,
      "dcKw": 240,
      "acTime0to100Hours": null,
      "dcTime10to80Minutes": 18,
      "fastChargingSupported": true,
      "portableChargerIncluded": true
    },
    "featureTags": [],
    "catalogMeta": {
      "familySlug": "kia-ev6",
      "slug": "kia-ev6-gt-line",
      "claimedRangeKm": 528,
      "claimedRangeStandard": "ARAI",
      "chargingIntelligence": {
        "acKw": 11,
        "dcKw": 240,
        "acTime0to100Hours": null,
        "dcTime10to80Minutes": 18
      },
      "performance": {
        "powerKw": 239.37,
        "powerBhp": 321,
        "torqueNm": null
      }
    }
  },
  {
    "slug": "kia-ev6-gt-line-awd",
    "variantSlug": "gt-line-awd",
    "name": "GT Line AWD",
    "trimLabel": "GT Line AWD",
    "priceInr": 7590000,
    "batteryKwh": 77.4,
    "rangeKmClaimed": 490,
    "rangeStandard": "ARAI",
    "rangeKmRealWorldMin": null,
    "rangeKmRealWorldMax": null,
    "powerBhp": 321,
    "powerKw": 239.37,
    "torqueNm": null,
    "charging": {
      "port": "CCS2",
      "acKw": 11,
      "dcKw": 240,
      "acTime0to100Hours": null,
      "dcTime10to80Minutes": 18,
      "fastChargingSupported": true,
      "portableChargerIncluded": true
    },
    "featureTags": [],
    "catalogMeta": {
      "familySlug": "kia-ev6",
      "slug": "kia-ev6-gt-line-awd",
      "claimedRangeKm": 490,
      "claimedRangeStandard": "ARAI",
      "chargingIntelligence": {
        "acKw": 11,
        "dcKw": 240,
        "acTime0to100Hours": null,
        "dcTime10to80Minutes": 18
      },
      "performance": {
        "powerKw": 239.37,
        "powerBhp": 321,
        "torqueNm": null
      }
    }
  }
]);

export const DOSSIER_META = Object.freeze({
  "brand": "Kia",
  "familyName": "EV6",
  "category": "SUV",
  "displayName": "Kia EV6",
  "verificationLevel": "manual_review",
  "verificationSource": "Golden Dataset",
  "verificationOwner": "EVSavari Catalog Generator",
  "dossierVersion": "generated-v1",
  "sources": [
    "https://www.kia.com/in/our-vehicles/ev6/showroom.html",
    "https://www.cardekho.com/kia/ev6"
  ],
  "verifiedAt": "2026-06-10"
});
