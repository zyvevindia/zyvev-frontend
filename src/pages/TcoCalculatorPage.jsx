import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import TcoBreakdownChart from "../components/tools/TcoBreakdownChart.jsx";
import TcoForm from "../components/tools/TcoForm.jsx";
import TcoResultCard from "../components/tools/TcoResultCard.jsx";
import Score2ToolsPerspective from "../components/score2/Score2ToolsPerspective.jsx";
import SEO from "../components/SEO/SEO.jsx";
import JsonLd from "../components/SEO/JsonLd.jsx";
import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { buildBreadcrumbSchema, buildWebPageSchema } from "../seo/schema.js";
import {
  clampCostPerKmValue,
  resolveVehicleCostPerKmEfficiency,
} from "../tools/costPerKmCalculator.js";
import { COST_PER_KM_DEFAULTS } from "../tools/costPerKmDefaults.js";
import {
  calculateTco,
  clampTcoValue,
  deriveDefaultInsurancePerYear,
  generateTcoOwnershipInsights,
} from "../tools/tcoCalculator.js";
import { TCO_BOUNDS, TCO_DEFAULTS } from "../tools/tcoDefaults.js";
import {
  fetchListingCatalogVariants,
  fetchVehicleFamilyBySlug,
} from "../utils/vehicleDetailResolver.js";
import { aggregateModelFamilies } from "../utils/modelFamily.js";
import { normalizeVehicleSlug } from "../utils/vehicleRoutes.js";

import "../styles/ownership-tools-page.css";
import "../components/tools/tco-calculator.css";

const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://evsavari.com";

const PAGE_TITLE = "Total Cost of Ownership Calculator";
const PAGE_DESCRIPTION =
  "Estimate 5-year EV ownership cost including depreciation, charging, maintenance, and insurance.";

export default function TcoCalculatorPage() {
  const [searchParams] = useSearchParams();
  const queryVehicleSlug = normalizeVehicleSlug(searchParams.get("vehicle"));

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleSlug, setVehicleSlug] = useState(queryVehicleSlug || "");
  const [vehiclePriceInr, setVehiclePriceInr] = useState(
    TCO_DEFAULTS.vehiclePriceInr
  );
  const [vehiclePriceFromVehicle, setVehiclePriceFromVehicle] = useState(false);
  const [annualKm, setAnnualKm] = useState(TCO_DEFAULTS.annualKm);
  const [ownershipYears, setOwnershipYears] = useState(
    TCO_DEFAULTS.ownershipYears
  );
  const [homeTariffInr, setHomeTariffInr] = useState(
    TCO_DEFAULTS.homeTariffInr
  );
  const [homeChargingPct, setHomeChargingPct] = useState(
    TCO_DEFAULTS.homeChargingPct
  );
  const [efficiencyKmPerKwh, setEfficiencyKmPerKwh] = useState(
    TCO_DEFAULTS.efficiencyKmPerKwh
  );
  const [efficiencyFromVehicle, setEfficiencyFromVehicle] = useState(false);
  const [insurancePerYear, setInsurancePerYear] = useState(() =>
    deriveDefaultInsurancePerYear(TCO_DEFAULTS.vehiclePriceInr)
  );
  const [insuranceManual, setInsuranceManual] = useState(false);
  const [maintenanceCostPerKm, setMaintenanceCostPerKm] = useState(
    TCO_DEFAULTS.maintenanceCostPerKm
  );
  const [residualValuePct, setResidualValuePct] = useState(
    TCO_DEFAULTS.residualValuePct
  );
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  const insuranceManualRef = useRef(insuranceManual);
  insuranceManualRef.current = insuranceManual;

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
            startingPrice: family.startingPrice || 0,
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

  const applyVehiclePrefill = useCallback(async (slug) => {
    const normalized = normalizeVehicleSlug(slug);
    if (!normalized) {
      setVehiclePriceFromVehicle(false);
      setEfficiencyFromVehicle(false);
      setEfficiencyKmPerKwh(COST_PER_KM_DEFAULTS.efficiencyKmPerKwh);
      if (!insuranceManualRef.current) {
        setInsurancePerYear(
          deriveDefaultInsurancePerYear(TCO_DEFAULTS.vehiclePriceInr)
        );
      }
      return;
    }

    const option = vehicleOptions.find((vehicle) => vehicle.slug === normalized);

    try {
      const result = await fetchVehicleFamilyBySlug(normalized);
      const vehicle = result?.vehicle;
      if (!vehicle) return;

      const price = Number(
        vehicle.startingPrice ||
          vehicle.price ||
          vehicle.exShowroomPrice ||
          option?.startingPrice ||
          0
      );

      if (price > 0) {
        setVehiclePriceInr(
          clampTcoValue(price, TCO_BOUNDS.vehiclePriceMin, TCO_BOUNDS.vehiclePriceMax)
        );
        setVehiclePriceFromVehicle(true);
        if (!insuranceManualRef.current) {
          setInsurancePerYear(deriveDefaultInsurancePerYear(price));
        }
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
      if (option?.startingPrice > 0) {
        setVehiclePriceInr(
          clampTcoValue(
            option.startingPrice,
            TCO_BOUNDS.vehiclePriceMin,
            TCO_BOUNDS.vehiclePriceMax
          )
        );
        setVehiclePriceFromVehicle(true);
        if (!insuranceManualRef.current) {
          setInsurancePerYear(
            deriveDefaultInsurancePerYear(option.startingPrice)
          );
        }
      }
    }
  }, [vehicleOptions]);

  useEffect(() => {
    if (!queryVehicleSlug) return;
    setVehicleSlug(queryVehicleSlug);
  }, [queryVehicleSlug]);

  useEffect(() => {
    if (!vehicleSlug) return;
    applyVehiclePrefill(vehicleSlug);
  }, [vehicleSlug, applyVehiclePrefill]);

  const handleVehicleChange = useCallback((slug) => {
    const normalized = normalizeVehicleSlug(slug);
    setVehicleSlug(normalized);
    if (!normalized) {
      setVehiclePriceFromVehicle(false);
      setEfficiencyFromVehicle(false);
    }
  }, []);

  const handleVehiclePriceChange = useCallback((value) => {
    const price = clampTcoValue(
      value,
      TCO_BOUNDS.vehiclePriceMin,
      TCO_BOUNDS.vehiclePriceMax
    );
    setVehiclePriceInr(price);
    setVehiclePriceFromVehicle(false);
    if (!insuranceManualRef.current) {
      setInsurancePerYear(deriveDefaultInsurancePerYear(price));
    }
  }, []);

  const handleInsuranceChange = useCallback((value) => {
    setInsuranceManual(true);
    setInsurancePerYear(
      clampTcoValue(
        value,
        TCO_BOUNDS.insurancePerYearMin,
        TCO_BOUNDS.insurancePerYearMax
      )
    );
  }, []);

  const result = useMemo(
    () =>
      calculateTco({
        vehiclePriceInr,
        annualKm,
        ownershipYears,
        homeTariffInr,
        homeChargingPct,
        efficiencyKmPerKwh,
        maintenanceCostPerKm,
        insurancePerYear,
        residualValuePct,
      }),
    [
      vehiclePriceInr,
      annualKm,
      ownershipYears,
      homeTariffInr,
      homeChargingPct,
      efficiencyKmPerKwh,
      maintenanceCostPerKm,
      insurancePerYear,
      residualValuePct,
    ]
  );

  const insights = useMemo(
    () => generateTcoOwnershipInsights(result),
    [result]
  );

  const canonical = `${SITE_ORIGIN.replace(/\/$/, "")}/tools/tco`;
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Tools", url: "/tools" },
      { name: "Total Cost of Ownership", url: "/tools/tco" },
    ]),
    buildWebPageSchema({
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: canonical,
    }),
  ].filter(Boolean);

  return (
    <div className="ownership-tools-page tco-page">
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
          <span>Total cost of ownership</span>
        </nav>

        <header className="tco-page__hero">
          <h1 className="tco-page__title">{PAGE_TITLE}</h1>
          <p className="tco-page__subtitle">{PAGE_DESCRIPTION}</p>
        </header>

        <div className="tco-page__layout">
          <TcoForm
            vehicleSlug={vehicleSlug}
            vehicles={vehicleOptions}
            vehiclePriceInr={vehiclePriceInr}
            vehiclePriceFromVehicle={vehiclePriceFromVehicle}
            annualKm={annualKm}
            ownershipYears={ownershipYears}
            homeTariffInr={homeTariffInr}
            homeChargingPct={homeChargingPct}
            publicChargingPct={result.publicChargingPct}
            efficiencyKmPerKwh={efficiencyKmPerKwh}
            efficiencyFromVehicle={efficiencyFromVehicle}
            insurancePerYear={insurancePerYear}
            maintenanceCostPerKm={maintenanceCostPerKm}
            residualValuePct={residualValuePct}
            onVehicleChange={handleVehicleChange}
            onVehiclePriceChange={handleVehiclePriceChange}
            onAnnualKmChange={(value) =>
              setAnnualKm(clampTcoValue(value, TCO_BOUNDS.annualKmMin, TCO_BOUNDS.annualKmMax))
            }
            onOwnershipYearsChange={(value) =>
              setOwnershipYears(
                clampTcoValue(
                  value,
                  TCO_BOUNDS.ownershipYearsMin,
                  TCO_BOUNDS.ownershipYearsMax
                )
              )
            }
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
            onInsuranceChange={handleInsuranceChange}
            onMaintenanceChange={(value) =>
              setMaintenanceCostPerKm(
                clampTcoValue(
                  value,
                  TCO_BOUNDS.maintenanceCostPerKmMin,
                  TCO_BOUNDS.maintenanceCostPerKmMax
                )
              )
            }
            onResidualChange={(value) =>
              setResidualValuePct(
                clampTcoValue(
                  value,
                  TCO_BOUNDS.residualValuePctMin,
                  TCO_BOUNDS.residualValuePctMax
                )
              )
            }
          />

          <div className="tco-page__results">
            <Score2ToolsPerspective vehicleSlug={vehicleSlug} />
            <TcoResultCard
              totalOwnershipCostInr={result.totalOwnershipCostInr}
              ownershipCostPerKm={result.ownershipCostPerKm}
              depreciationInr={result.depreciationInr}
              energyInr={result.energyInr}
              maintenanceInr={result.maintenanceInr}
              insuranceInr={result.insuranceInr}
              ownershipYears={result.ownershipYears}
            />

            <TcoBreakdownChart
              breakdown={result.breakdown}
              totalOwnershipCostInr={result.totalOwnershipCostInr}
            />

            {insights.length ? (
              <section
                className="tco-page__insight"
                aria-labelledby="tco-insight-title"
              >
                <h2 id="tco-insight-title" className="tco-page__insight-title">
                  Ownership insight
                </h2>
                <ul className="tco-page__insight-list">
                  {insights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        {loadingVehicles ? (
          <p className="tco-form__hint" style={{ marginTop: 16 }}>
            Loading tier-1 vehicles…
          </p>
        ) : null}
      </div>
    </div>
  );
}
