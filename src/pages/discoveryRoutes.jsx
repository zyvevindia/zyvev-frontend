import DiscoverySeoPage from "./DiscoverySeoPage";
import IntelligenceDiscoveryPage from "./IntelligenceDiscoveryPage";
import { PAGE_TYPES } from "../seo/registry";
import LandingRouter from "../landing/LandingRouter.jsx";
import { LANDING_ROUTE_FAMILIES } from "../landing/landingRouteConfig.js";

export function BestEvsDiscoveryPage() {
  return (
    <LandingRouter routeFamily={LANDING_ROUTE_FAMILIES.BEST_EVS}>
      <DiscoverySeoPage pageType={PAGE_TYPES.BEST_EVS} />
    </LandingRouter>
  );
}

export function CompareGuideDiscoveryPage() {
  return (
    <DiscoverySeoPage pageType={PAGE_TYPES.COMPARE_GUIDE} />
  );
}

export function ChargingGuideDiscoveryPage() {
  return (
    <DiscoverySeoPage pageType={PAGE_TYPES.CHARGING_GUIDE} />
  );
}

export function OwnershipGuideDiscoveryPage() {
  return (
    <DiscoverySeoPage pageType={PAGE_TYPES.OWNERSHIP_GUIDE} />
  );
}

export function BrandDiscoveryPage() {
  return (
    <LandingRouter routeFamily={LANDING_ROUTE_FAMILIES.BRANDS}>
      <DiscoverySeoPage pageType={PAGE_TYPES.BRAND} />
    </LandingRouter>
  );
}

export function CityEvsDiscoveryPage() {
  return <DiscoverySeoPage pageType={PAGE_TYPES.CITY_EVS} />;
}

export function CityChargingDiscoveryPage() {
  return (
    <DiscoverySeoPage pageType={PAGE_TYPES.CITY_CHARGING} />
  );
}

export function DiscoverLandingPage() {
  return (
    <LandingRouter routeFamily={LANDING_ROUTE_FAMILIES.DISCOVER}>
      <IntelligenceDiscoveryPage />
    </LandingRouter>
  );
}
