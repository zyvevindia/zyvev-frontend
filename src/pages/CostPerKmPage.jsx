import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import CostPerKmForm from "../components/tools/CostPerKmForm.jsx";
import CostPerKmResultCard from "../components/tools/CostPerKmResultCard.jsx";
import Score2ToolsPerspective from "../components/score2/Score2ToolsPerspective.jsx";
import SEO from "../components/SEO/SEO.jsx";
import JsonLd from "../components/SEO/JsonLd.jsx";
import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { buildBreadcrumbSchema, buildWebPageSchema } from "../seo/schema.js";
import {
  calculateCostPerKm,
  calculateMonthlyCost,
  calculateYearlyCost,
  clampCostPerKmValue,
  formatCostPerKmRate,
  resolveCostPerKmSavingsTier,
  resolveVehicleCostPerKmEfficiency,
} from "../tools/costPerKmCalculator.js";
import {
  COST_PER_KM_DEFAULTS,
  COST_PER_KM_ICE_REFERENCE,
} from "../tools/costPerKmDefaults.js";
import { formatElectricityTariff } from "../utils/numberFormatters.js";
import { fetchListingCatalogVariants, fetchVehicleFamilyBySlug } from "../utils/vehicleDetailResolver.js";
import { aggregateModelFamilies } from "../utils/modelFamily.js";
import { normalizeVehicleSlug } from "../utils/vehicleRoutes.js";

import "../styles/ownership-tools-page.css";
import "../components/tools/cost-per-km.css";

const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://evsavari.com";

const PAGE_TITLE = "Cost Per Km Calculator";
const PAGE_DESCRIPTION =
  "Estimate EV running cost per kilometre using your electricity tariff, charging mix, and vehicle efficiency.";

export default function CostPerKmPage() {
  const [searchParams] = useSearchParams();
  const queryVehicleSlug = normalizeVehicleSlug(searchParams.get("vehicle"));

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleSlug, setVehicleSlug] = useState(queryVehicleSlug || "");
  const [homeTariffInr, setHomeTariffInr] = useState(
    COST_PER_KM_DEFAULTS.homeTariffInr
  );
  const [homeChargingPct, setHomeChargingPct] = useState(
    COST_PER_KM_DEFAULTS.homeChargingPct
  );
  const [efficiencyKmPerKwh, setEfficiencyKmPerKwh] = useState(
    COST_PER_KM_DEFAULTS.efficiencyKmPerKwh
  );
  const [efficiencyFromVehicle, setEfficiencyFromVehicle] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadVehicleOptions() {
      setLoadingVehicles(true);
      try {
        const variants = await fetchListingCatalogVariants({ limit: 120 });
        if (cancelled) return;

        const families = aggregateModelFamilies(variants)
          .filter((family) =>
            TIER1_MODEL_FAMILY_SLUGS.includes(
              family.familySlug || family.slug
            )
          )
          .map((family) => ({
            slug: family.familySlug || family.slug,
            name: family.familyName || family.name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setVehicleOptions(families);
      } catch {
        if (!cancelled) {
          setVehicleOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingVehicles(false);
        }
      }
    }

    loadVehicleOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyVehicleEfficiency = useCallback(async (slug) => {
    const normalized = normalizeVehicleSlug(slug);
    if (!normalized) {
      setEfficiencyFromVehicle(false);
      setEfficiencyKmPerKwh(COST_PER_KM_DEFAULTS.efficiencyKmPerKwh);
      return;
    }

    try {
      const result = await fetchVehicleFamilyBySlug(normalized);
      const vehicle = result?.vehicle;
      if (!vehicle) {
        setEfficiencyFromVehicle(false);
        return;
      }

      const resolved = resolveVehicleCostPerKmEfficiency(
        vehicle,
        result?.variants || []
      );

      if (resolved?.efficiencyKmPerKwh) {
        setEfficiencyKmPerKwh(resolved.efficiencyKmPerKwh);
        setEfficiencyFromVehicle(resolved.fromRealWorld);
      }
    } catch {
      setEfficiencyFromVehicle(false);
    }
  }, []);

  useEffect(() => {
    if (!queryVehicleSlug) return;
    setVehicleSlug(queryVehicleSlug);
    applyVehicleEfficiency(queryVehicleSlug);
  }, [queryVehicleSlug, applyVehicleEfficiency]);

  const handleVehicleChange = useCallback(
    (slug) => {
      const normalized = normalizeVehicleSlug(slug);
      setVehicleSlug(normalized);
      applyVehicleEfficiency(normalized);
    },
    [applyVehicleEfficiency]
  );

  const calculation = useMemo(
    () =>
      calculateCostPerKm({
        homeTariffInr,
        homeChargingPct,
        efficiencyKmPerKwh,
      }),
    [homeTariffInr, homeChargingPct, efficiencyKmPerKwh]
  );

  const monthlyCost = useMemo(
    () => calculateMonthlyCost(calculation.costPerKm),
    [calculation.costPerKm]
  );

  const yearlyCost = useMemo(
    () => calculateYearlyCost(calculation.costPerKm),
    [calculation.costPerKm]
  );

  const savingsTier = useMemo(
    () => resolveCostPerKmSavingsTier(calculation.costPerKm),
    [calculation.costPerKm]
  );

  const canonical = `${SITE_ORIGIN.replace(/\/$/, "")}/tools/cost-per-km`;
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Tools", url: "/tools" },
      { name: PAGE_TITLE, url: "/tools/cost-per-km" },
    ]),
    buildWebPageSchema({
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: canonical,
    }),
  ].filter(Boolean);

  const selectedVehicleName =
    vehicleOptions.find((vehicle) => vehicle.slug === vehicleSlug)?.name || "";

  return (
    <div className="ownership-tools-page cost-per-km-page">
      <SEO
        title={`${PAGE_TITLE} | EVSavari Tools`}
        description={PAGE_DESCRIPTION}
        canonical={canonical}
      />

      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}

      <div className="ownership-tools-page__inner">
        <nav className="ownership-tools-page__crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link to="/tools">Tools</Link>
          <span aria-hidden="true"> / </span>
          <span>Cost per km</span>
        </nav>

        <header className="cost-per-km-page__hero">
          <h1 className="cost-per-km-page__title">{PAGE_TITLE}</h1>
          <p className="cost-per-km-page__subtitle">{PAGE_DESCRIPTION}</p>
        </header>

        <div className="cost-per-km-page__layout">
          <CostPerKmForm
            homeTariffInr={homeTariffInr}
            homeChargingPct={homeChargingPct}
            efficiencyKmPerKwh={efficiencyKmPerKwh}
            publicChargingPct={calculation.publicChargingPct}
            vehicleSlug={vehicleSlug}
            vehicles={vehicleOptions}
            efficiencyFromVehicle={efficiencyFromVehicle}
            onHomeTariffChange={(value) =>
              setHomeTariffInr(clampCostPerKmValue(value, 4, 20))
            }
            onHomeChargingChange={(value) =>
              setHomeChargingPct(clampCostPerKmValue(value, 0, 100))
            }
            onEfficiencyChange={(value) => {
              setEfficiencyFromVehicle(false);
              setEfficiencyKmPerKwh(clampCostPerKmValue(value, 3, 12));
            }}
            onVehicleChange={handleVehicleChange}
          />

          <div className="cost-per-km-page__results">
            <Score2ToolsPerspective vehicleSlug={vehicleSlug} />
            <CostPerKmResultCard
            costPerKm={calculation.costPerKm}
            monthlyCost={monthlyCost}
            yearlyCost={yearlyCost}
            savingsTier={savingsTier}
          />
          </div>
        </div>

        <section className="cost-per-km-page__panel" aria-labelledby="cost-per-km-explanation">
          <h2 id="cost-per-km-explanation" className="cost-per-km-page__panel-title">
            How this estimate works
          </h2>
          <p className="cost-per-km-page__panel-copy">
            Based on your charging mix and efficiency
            {selectedVehicleName ? ` for the ${selectedVehicleName}` : ""}, this
            EV costs approximately {formatCostPerKmRate(calculation.costPerKm)} to
            run. Your blended electricity rate is about{" "}
            {formatElectricityTariff(calculation.effectiveRateInr)} after weighting home and
            public charging.
          </p>
        </section>

        <section
          className="cost-per-km-page__panel"
          aria-labelledby="cost-per-km-comparison"
          style={{ marginTop: 16 }}
        >
          <h2 id="cost-per-km-comparison" className="cost-per-km-page__panel-title">
            Reference comparison
          </h2>
          <ul className="cost-per-km-page__comparison">
            <li>{COST_PER_KM_ICE_REFERENCE.petrol}</li>
            <li>{COST_PER_KM_ICE_REFERENCE.diesel}</li>
          </ul>
        </section>

        {loadingVehicles ? (
          <p className="cost-per-km-form__hint" style={{ marginTop: 16 }}>
            Loading tier-1 vehicles…
          </p>
        ) : null}
      </div>
    </div>
  );
}
