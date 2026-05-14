export default function normalizeCar(car) {
  return {
    ...car,

    _id: car._id || "",

    name: car.name || "Unknown EV",

    brand: car.brand || "EV Brand",

    image:
      car.heroImage ||
      car.image ||
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200&auto=format&fit=crop",

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

    slug:
      car.slug ||
      car.name
        ?.toLowerCase()
        .replace(/\s+/g, "-"),

    isFeatured:
      car.isFeatured || false,
  };
}