import { useParams } from "react-router-dom";

import CarDetails from "../../pages/CarDetails";

import SeoGuidePage from "../../pages/SeoGuidePage";

import { isSeoPageSlug } from "../../utils/seoRoutes";

/**
 * Resolves /cars/:slug — reserved SEO slugs → decision pages; else vehicle detail.
 */
export default function CarsSlugRouter() {
  const { slug } = useParams();

  if (isSeoPageSlug(slug)) {
    return <SeoGuidePage />;
  }

  return <CarDetails />;
}
