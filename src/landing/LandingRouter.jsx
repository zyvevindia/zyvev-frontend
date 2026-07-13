import { useParams } from "react-router-dom";

import LandingPage from "./LandingPage.jsx";
import LandingNotFound from "./LandingNotFound.jsx";
import { resolveLandingConfig } from "./landingRegistry.js";
import { LANDING_ROUTE_CONFIG } from "./landingRouteConfig.js";
import "./config/registerProductionLandings.js";

/**
 * Landing router — single routing mechanism for all landing pages.
 *
 * 1. Resolve slug from URL params using route family config
 * 2. If registry hit → render LandingPage (generic engine)
 * 3. Else if legacy fallback children provided → render unchanged (backward compat)
 * 4. Else → configuration not found placeholder
 */
export default function LandingRouter({ routeFamily, children = null }) {
  const params = useParams();
  const routeCfg = LANDING_ROUTE_CONFIG[routeFamily];
  const slug = routeCfg ? params[routeCfg.paramKey] : null;
  const config = resolveLandingConfig(routeFamily, slug);

  if (config) {
    return <LandingPage config={config} />;
  }

  if (children) {
    return children;
  }

  return <LandingNotFound routeFamily={routeFamily} slug={slug} />;
}
