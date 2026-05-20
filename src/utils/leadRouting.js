/**
 * Lightweight deterministic lead routing — pilot-ready, no dealer portal.
 * Backend may override assignment; this prepares metadata for ingestion logs.
 */

const PILOT_DEALERS_BY_CITY = Object.freeze({
  delhi: { dealerId: "pilot-delhi-01", label: "Delhi pilot desk" },
  "new delhi": { dealerId: "pilot-delhi-01", label: "Delhi pilot desk" },
  gurgaon: { dealerId: "pilot-ncr-01", label: "NCR pilot desk" },
  gurugram: { dealerId: "pilot-ncr-01", label: "NCR pilot desk" },
  noida: { dealerId: "pilot-ncr-01", label: "NCR pilot desk" },
  mumbai: { dealerId: "pilot-mumbai-01", label: "Mumbai pilot desk" },
  bengaluru: { dealerId: "pilot-blore-01", label: "Bengaluru pilot desk" },
  bangalore: { dealerId: "pilot-blore-01", label: "Bengaluru pilot desk" },
  hyderabad: { dealerId: "pilot-hyd-01", label: "Hyderabad pilot desk" },
  pune: { dealerId: "pilot-pune-01", label: "Pune pilot desk" },
  chennai: { dealerId: "pilot-chennai-01", label: "Chennai pilot desk" },
});

const BRAND_HINTS = Object.freeze({
  tata: "pilot-tata-desk",
  mg: "pilot-mg-desk",
  mahindra: "pilot-mahindra-desk",
});

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * @param {object} input
 * @returns {{ plan: object, log: object[] }}
 */
export function buildLeadRoutingPlan({
  city = "",
  state = "",
  familySlug = "",
  brand = "",
  vehicleName = "",
} = {}) {
  const log = [];
  const cityKey = normalizeKey(city);
  const brandKey = normalizeKey(brand);
  const slug = normalizeKey(familySlug);

  let dealerId = null;
  let dealerLabel = null;
  let routingReason = "fallback_unassigned";
  let leadStatusTag = "new_unrouted";

  if (cityKey && PILOT_DEALERS_BY_CITY[cityKey]) {
    const match = PILOT_DEALERS_BY_CITY[cityKey];
    dealerId = match.dealerId;
    dealerLabel = match.label;
    routingReason = "city_match";
    leadStatusTag = "routed_city";
    log.push({ step: "city_match", city: cityKey, dealerId });
  } else if (brandKey && BRAND_HINTS[brandKey]) {
    dealerId = BRAND_HINTS[brandKey];
    dealerLabel = `${brand} brand desk (pilot)`;
    routingReason = "brand_hint";
    leadStatusTag = "routed_brand";
    log.push({ step: "brand_hint", brand: brandKey, dealerId });
  } else if (slug) {
    const slugBrand = slug.split("-")[0];
    if (BRAND_HINTS[slugBrand]) {
      dealerId = BRAND_HINTS[slugBrand];
      dealerLabel = `${slugBrand} brand desk (from EV slug)`;
      routingReason = "ev_slug_brand";
      leadStatusTag = "routed_ev";
      log.push({ step: "ev_slug", slug, dealerId });
    }
  }

  if (!dealerId) {
    dealerId = "fallback-ops-queue";
    dealerLabel = "EVSavari ops queue";
    routingReason = "fallback_queue";
    leadStatusTag = "queued_fallback";
    log.push({ step: "fallback", note: "No city/brand match" });
  }

  const assignedAt = new Date().toISOString();

  return {
    plan: {
      dealerId,
      dealerLabel,
      routingReason,
      leadStatusTag,
      assignedAt,
      city: city || null,
      state: state || null,
      familySlug: familySlug || null,
      brand: brand || null,
      vehicleName: vehicleName || null,
      deliveryChannel: "pilot_v1",
    },
    log,
  };
}
