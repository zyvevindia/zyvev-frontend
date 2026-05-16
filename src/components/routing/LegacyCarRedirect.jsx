import {
  Navigate,
  useParams,
} from "react-router-dom";

import {
  normalizeVehicleSlug,
  vehicleDetailPath,
} from "../../utils/vehicleRoutes";

import { logRouteRedirect } from "../../utils/routeObservability";

/**
 * 301-equivalent client redirect: /car/:slug → /cars/:slug
 */
export default function LegacyCarRedirect() {
  const { slug } = useParams();
  const target = vehicleDetailPath(slug);

  logRouteRedirect(
    `/car/${slug}`,
    target,
    slug
  );

  return (
    <Navigate
      to={target}
      replace
    />
  );
}
