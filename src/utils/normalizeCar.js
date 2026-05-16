import { getListingImage } from "./vehicleMedia";
import { normalizeVehicleSlug } from "./vehicleRoutes";
import { logProduction } from "./productionLog";

export default function normalizeCar(car) {
  const listingImage = getListingImage(car);
  const slug = normalizeVehicleSlug(car.slug);

  if (!slug && car.name) {
    logProduction(
      "catalog",
      "missing_vehicle_slug",
      { name: car.name, id: car._id },
      "warn"
    );
  }

  return {
    ...car,

    _id: car._id || "",

    name: car.name || "Unknown EV",

    brand: car.brand || "EV Brand",

    heroImage: car.heroImage || car.image || listingImage,

    listingThumbnail:
      car.listingThumbnail || listingImage,

    compareThumbnail:
      car.compareThumbnail ||
      car.listingThumbnail ||
      car.heroImage ||
      listingImage,

    ogImage:
      car.ogImage ||
      car.heroImage ||
      listingImage,

    image: listingImage,

    price:
      car.startingPrice ||
      car.price ||
      0,

    range:
      car.specifications?.range ||
      car.range ||
      0,

    battery:
      car.specifications?.batteryPack ||
      car.battery ||
      "EV Battery",

    chargingTime:
      car.specifications?.chargingTime ||
      "N/A",

    topSpeed:
      car.specifications?.topSpeed ||
      "N/A",

    slug,

    isFeatured:
      car.isFeatured || false,

    catalogSource:
      car.catalogSource || "legacy",

    catalogMeta:
      car.catalogMeta || null,
  };
}