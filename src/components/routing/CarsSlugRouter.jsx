import { Navigate, useParams } from "react-router-dom";

import SectionErrorBoundary from "../errors/SectionErrorBoundary";
import CarDetails from "../../pages/CarDetails";

import SeoGuidePage from "../../pages/SeoGuidePage";

import { isSeoPageSlug } from "../../utils/seoRoutes";

import {
  isValidVehicleSlug,
  normalizeVehicleSlug,
} from "../../utils/vehicleRoutes";

/**
 * Resolves /cars/:slug — reserved SEO slugs → decision pages; else vehicle detail.
 */
export default function CarsSlugRouter() {
  const { slug } = useParams();
  const normalized = normalizeVehicleSlug(slug);

  if (isSeoPageSlug(slug)) {
    return <SeoGuidePage />;
  }

  if (slug && !isValidVehicleSlug(slug)) {
    return <Navigate to="/cars" replace />;
  }

  return (
    <SectionErrorBoundary label="Vehicle details">
      <CarDetails key={normalized || slug} />
    </SectionErrorBoundary>
  );
}
