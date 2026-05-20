/**
 * Gold-standard EV experience helpers (catalogMeta-aware).
 */

import {
  mergeIntelligenceIntoCatalogMeta,
} from "./catalogIntelligence";
import { sanitizeImageUrl } from "./imageUrl";

const TAG_LABELS = {
  best_for_family: "Family Friendly",
  best_for_city: "Best for City Driving",
  best_first_ev: "Great First EV",
  premium_feel: "Premium Experience",
  wow_factor: "Standout Design",
  silent_comfort: "Silent Comfort",
  tech_appeal: "Tech-Forward",
  family_friendly: "Family Friendly",
  long_range: "Long Range",
  value_for_money: "Value for Money",
  fast_charging: "Fast Charging",
};

const GOLD_SLUG_PREFIXES = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "mg-zs-ev",
  "mahindra-xuv400",
  "byd-atto-3",
];

export function isGoldTierSlug(slug) {
  if (!slug) return false;
  const s = String(slug).toLowerCase();
  return GOLD_SLUG_PREFIXES.some((p) => s.startsWith(p));
}

export function hasCatalogExperience(car) {
  const meta = car?.catalogMeta;
  if (!meta) return false;
  return (
    meta.expertSummary ||
    (meta.pros && meta.pros.length) ||
    (meta.psychologyTags && meta.psychologyTags.length) ||
    meta.compareValueScore != null
  );
}

export function formatPsychologyTag(tag) {
  return TAG_LABELS[tag] || tag.replace(/_/g, " ");
}

export function mergeCatalogIntoVehicle(vehicle, catalogDto) {
  if (!vehicle || !catalogDto?.marketplace) {
    return vehicle;
  }

  const merged = {
    ...catalogDto.marketplace,
    ...vehicle,
    heroImage: sanitizeImageUrl(
      catalogDto.media?.heroImage ?? vehicle.heroImage
    ),
    listingThumbnail: sanitizeImageUrl(
      catalogDto.media?.listingThumbnail ?? vehicle.listingThumbnail
    ),
    compareThumbnail: sanitizeImageUrl(
      catalogDto.media?.compareThumbnail ?? vehicle.compareThumbnail
    ),
    ogImage: sanitizeImageUrl(
      catalogDto.media?.ogImage ?? vehicle.ogImage
    ),
    image: sanitizeImageUrl(
      catalogDto.media?.listingThumbnail ??
        vehicle.image ??
        vehicle.heroImage
    ),
    catalogSource: "master",
    catalogMeta: {
      ...(catalogDto.marketplace?.catalogMeta || {}),
      dataQualityScore:
        catalogDto.governance?.dataQualityScore ??
        catalogDto.verification?.dataQualityScore,
      governanceStatus:
        catalogDto.governance?.status,
      confidence:
        catalogDto.governance?.confidence ??
        catalogDto.verification?.confidence,
      verificationFlags:
        catalogDto.verification?.flags || [],
      expertSummary: catalogDto.seo?.expertSummary,
      pros: catalogDto.seo?.pros || [],
      cons: catalogDto.seo?.cons || [],
      faq: catalogDto.seo?.faq || [],
      chargingFaq: catalogDto.seo?.chargingFaq || [],
      psychologyTags: catalogDto.psychology?.tags || [],
      psychologyScores: catalogDto.psychology?.scores || {},
      psychologyNarrative: catalogDto.psychology?.narrative || "",
      compareValueScore: catalogDto.compare?.valueScore,
      compareRivals: catalogDto.compare?.segmentRivalSlugs || [],
      strongestAdvantages: catalogDto.compare?.strongestAdvantages || [],
      weakestAreas: catalogDto.compare?.weakestAreas || [],
      claimedRangeKm: catalogDto.range?.claimedKm,
      realWorldRangeKm: catalogDto.range?.realWorldKm,
      chargingSummary: buildChargingSummary(catalogDto.charging),
      chargingIntelligence: catalogDto.charging || null,
      chargingPracticality:
        catalogDto.chargingPracticality ?? null,
      ownershipWarranty: catalogDto.ownership || {},
      ownershipCost5yr: catalogDto.pricing?.ownershipCost5yr,
      priceLastUpdated: catalogDto.pricing?.priceLastUpdated,
      suitabilityScores: {
        family: catalogDto.practicality?.familyScore,
        city: catalogDto.practicality?.cityUsabilityScore,
        highway: catalogDto.practicality?.highwayComfortScore,
      },
      media: {
        heroImage: sanitizeImageUrl(catalogDto.media?.heroImage),
        listingThumbnail: sanitizeImageUrl(
          catalogDto.media?.listingThumbnail
        ),
        compareThumbnail: sanitizeImageUrl(
          catalogDto.media?.compareThumbnail
        ),
        ogImage: sanitizeImageUrl(catalogDto.media?.ogImage),
        assets: (catalogDto.media?.assets || [])
          .map((asset) => {
            if (!asset || typeof asset !== "object") return null;
            const url = sanitizeImageUrl(asset.url || asset.src);
            return url ? { ...asset, url } : null;
          })
          .filter(Boolean),
      },
    },
  };

  merged.catalogMeta = mergeIntelligenceIntoCatalogMeta(
    merged.catalogMeta,
    catalogDto
  );

  if (catalogDto.seo?.expertSummary) {
    merged.overview = catalogDto.seo.expertSummary;
  }
  if (catalogDto.seo?.pros?.length) {
    merged.features = catalogDto.seo.pros;
  }

  return merged;
}

function buildChargingSummary(charging) {
  if (!charging) return "";
  const parts = [];
  if (charging.acKw) parts.push(`${charging.acKw} kW AC`);
  if (charging.dcKw) parts.push(`${charging.dcKw} kW DC`);
  if (charging.connectorType) parts.push(charging.connectorType);
  if (charging.dcTime10to80Minutes) {
    parts.push(`10–80% in ~${charging.dcTime10to80Minutes} min`);
  }
  if (charging.homeChargingSupported) parts.push("Home charging supported");
  if (charging.portableChargerIncluded) {
    parts.push("Portable charger included");
  }
  return parts.join(" · ");
}

export function buildFaqSchema(faqList, pageUrl) {
  if (!Array.isArray(faqList) || faqList.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqList.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
    url: pageUrl,
  };
}

export const CATALOG_DETAIL_ENRICH =
  import.meta.env.VITE_CATALOG_DETAIL_ENRICH === "true";
