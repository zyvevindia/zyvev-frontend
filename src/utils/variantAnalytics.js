import { normalizeVehicleSlug } from "./vehicleRoutes";
import { trackBuyerEvent } from "../event-tracking/trackBuyerEvent";

/**
 * Consistent variant/family metadata for behavioral events.
 */
export function buildVariantEventPayload({
  familySlug,
  variantSlug,
  brand,
  sourcePage,
  extra = {},
}) {
  const normalizedVariant = variantSlug
    ? normalizeVehicleSlug(variantSlug)
    : "";

  return {
    vehicleSlugs: normalizedVariant
      ? [normalizedVariant]
      : [],
    sourcePage:
      sourcePage ||
      (typeof window !== "undefined"
        ? window.location.pathname
        : ""),
    metadata: {
      familySlug: familySlug || "",
      variantSlug: normalizedVariant || "",
      brand: brand || "",
      ...extra,
    },
  };
}

export function trackVariantEvent(
  eventType,
  context
) {
  trackBuyerEvent(
    eventType,
    buildVariantEventPayload(context)
  );
}
