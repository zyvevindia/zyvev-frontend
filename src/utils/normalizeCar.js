import { sanitizeCarImageFields, sanitizeImageUrl } from "./imageUrl";
import { getListingImage } from "./vehicleMedia";
import { normalizeVehicleSlug } from "./vehicleRoutes";
import { logProduction } from "./productionLog";
import { applyVerifiedCatalogOverlay } from "../data/catalog/verified/applyVerifiedCatalogOverlay.js";

export default function normalizeCar(car) {
  const cleaned = sanitizeCarImageFields(car);
  const listingImage =
    sanitizeImageUrl(getListingImage(cleaned)) || null;
  const slug = normalizeVehicleSlug(cleaned.slug);

  if (!slug && cleaned.name) {
    logProduction(
      "catalog",
      "missing_vehicle_slug",
      { name: cleaned.name, id: cleaned._id },
      "warn"
    );
  }

  const normalized = {
    ...cleaned,

    _id: cleaned._id || "",

    name: cleaned.name || "Unknown EV",

    brand: cleaned.brand || "EV Brand",

    heroImage: cleaned.heroImage || cleaned.image || null,

    listingThumbnail: cleaned.listingThumbnail || listingImage || null,

    compareThumbnail: cleaned.compareThumbnail || null,

    ogImage: cleaned.ogImage || cleaned.heroImage || listingImage || null,

    image: listingImage || null,

    price:
      cleaned.startingPrice ||
      cleaned.price ||
      0,

    range:
      cleaned.specifications?.range ||
      cleaned.range ||
      0,

    battery:
      cleaned.specifications?.batteryPack ||
      cleaned.battery ||
      "EV Battery",

    chargingTime:
      cleaned.specifications?.chargingTime ||
      "N/A",

    topSpeed:
      cleaned.specifications?.topSpeed ||
      "N/A",

    slug,

    isFeatured: cleaned.isFeatured || false,

    catalogSource: cleaned.catalogSource || "legacy",

    catalogMeta: cleaned.catalogMeta || null,
  };

  return applyVerifiedCatalogOverlay(normalized);
}