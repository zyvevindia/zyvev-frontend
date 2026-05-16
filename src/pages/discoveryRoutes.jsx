import DiscoverySeoPage from "./DiscoverySeoPage";
import { PAGE_TYPES } from "../seo/registry";

export function BestEvsDiscoveryPage() {
  return (
    <DiscoverySeoPage pageType={PAGE_TYPES.BEST_EVS} />
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
  return <DiscoverySeoPage pageType={PAGE_TYPES.BRAND} />;
}

export function CityEvsDiscoveryPage() {
  return <DiscoverySeoPage pageType={PAGE_TYPES.CITY_EVS} />;
}

export function CityChargingDiscoveryPage() {
  return (
    <DiscoverySeoPage pageType={PAGE_TYPES.CITY_CHARGING} />
  );
}
