import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import PetrolSavingsChart from "../components/tools/PetrolSavingsChart.jsx";
import PetrolSavingsForm from "../components/tools/PetrolSavingsForm.jsx";
import PetrolSavingsResultCard from "../components/tools/PetrolSavingsResultCard.jsx";
import Score2ToolsPerspective from "../components/score2/Score2ToolsPerspective.jsx";
import SEO from "../components/SEO/SEO.jsx";
import JsonLd from "../components/SEO/JsonLd.jsx";
import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { buildBreadcrumbSchema, buildWebPageSchema } from "../seo/schema.js";
import {
  calculateCostPerKm,
  clampCostPerKmValue,
  resolveVehicleCostPerKmEfficiency,
} from "../tools/costPerKmCalculator.js";
import { COST_PER_KM_DEFAULTS } from "../tools/costPerKmDefaults.js";
import {
  calculatePetrolSavings,
  clampPetrolSavingsValue,
  generatePetrolSavingsInsights,
} from "../tools/petrolSavingsCalculator.js";
import { PETROL_SAVINGS_BOUNDS, PETROL_SAVINGS_DEFAULTS } from "../tools/petrolSavingsDefaults.js";
import {
  fetchListingCatalogVariants,
  fetchVehicleFamilyBySlug,
} from "../utils/vehicleDetailResolver.js";
import { aggregateModelFamilies } from "../utils/modelFamily.js";
import { normalizeVehicleSlug } from "../utils/vehicleRoutes.js";

import "../styles/ownership-tools-page.css";
import "../components/tools/petrol-savings.css";

const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://evsavari.com";

const PAGE_TITLE = "Petrol vs EV Savings Calculator";
const PAGE_DESCRIPTION =
  "Compare EV and petrol ownership costs to estimate total savings, break-even distance, and break-even years.";

export default function PetrolSavingsPage() {
  const [searchParams] = useSearchParams();
  const queryVehicleSlug = normalizeVehicleSlug(searchParams.get("vehicle"));

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleSlug, setVehicleSlug] = useState(queryVehicleSlug || "");
  const [evPriceInr, setEvPriceInr] = useState(PETROL_SAVINGS_DEFAULTS.evPriceInr);
  const [evPriceFromVehicle, setEvPriceFromVehicle] = useState(false);
  const [annualKm, setAnnualKm] = useState(PETROL_SAVINGS_DEFAULTS.annualKm);
  const [ownershipYears, setOwnershipYears] = useState(
    PETROL_SAVINGS_DEFAULTS.ownershipYears
  );
  const [homeTariffInr, setHomeTariffInr] = useState(
    PETROL_SAVINGS_DEFAULTS.homeTariffInr
  );
  const [homeChargingPct, setHomeChargingPct] = useState(
    PETROL_SAVINGS_DEFAULTS.homeChargingPct
  );
  const [efficiencyKmPerKwh, setEfficiencyKmPerKwh] = useState(
    PETROL_SAVINGS_DEFAULTS.efficiencyKmPerKwh
  );
  const [efficiencyFromVehicle, setEfficiencyFromVehicle] = useState(false);
  const [petrolPricePerLitre, setPetrolPricePerLitre] = useState(
    PETROL_SAVINGS_DEFAULTS.petrolPricePerLitre
  );
  const [petrolEfficiencyKmPerL, setPetrolEfficiencyKmPerL] = useState(
    PETROL_SAVINGS_DEFAULTS.petrolEfficiencyKmPerL
  );
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
      setEvPriceFromVehicle(false);
      setEfficiencyFromVehicle(false);
      setEfficiencyKmPerKwh(COST_PER_KM_DEFAULTS.efficiencyKmPerKwh);
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
        setEvPriceInr(
          clampPetrolSavingsValue(
            price,
            PETROL_SAVINGS_BOUNDS.vehiclePriceMin,
            PETROL_SAVINGS_BOUNDS.vehiclePriceMax
          )
        );
        setEvPriceFromVehicle(true);
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
        setEvPriceInr(
          clampPetrolSavingsValue(
            option.startingPrice,
            PETROL_SAVINGS_BOUNDS.vehiclePriceMin,
            PETROL_SAVINGS_BOUNDS.vehiclePriceMax
          )
        );
        setEvPriceFromVehicle(true);
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
      setEvPriceFromVehicle(false);
      setEfficiencyFromVehicle(false);
    }
  }, []);

  const publicChargingPct = useMemo(
    () =>
      calculateCostPerKm({
        homeTariffInr,
        homeChargingPct,
        efficiencyKmPerKwh,
      }).publicChargingPct,
    [homeTariffInr, homeChargingPct, efficiencyKmPerKwh]
  );

  const result = useMemo(
    () =>
      calculatePetrolSavings({
        evPriceInr,
        petrolVehiclePriceInr: evPriceInr,
        annualKm,
        ownershipYears,
        homeTariffInr,
        homeChargingPct,
        efficiencyKmPerKwh,
        petrolPricePerLitre,
        petrolEfficiencyKmPerL,
      }),
    [
      evPriceInr,
      annualKm,
      ownershipYears,
      homeTariffInr,
      homeChargingPct,
      efficiencyKmPerKwh,
      petrolPricePerLitre,
      petrolEfficiencyKmPerL,
    ]
  );

  const insights = useMemo(
    () => generatePetrolSavingsInsights(result),
    [result]
  );

  const canonical = `${SITE_ORIGIN.replace(/\/$/, "")}/tools/savings-vs-petrol`;
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Tools", url: "/tools" },
      { name: "Petrol vs EV Savings", url: "/tools/savings-vs-petrol" },
    ]),
    buildWebPageSchema({
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: canonical,
    }),
  ].filter(Boolean);

  return (
    <div className="ownership-tools-page petrol-savings-page">
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
          <span>Petrol vs EV savings</span>
        </nav>

        <header className="petrol-savings-page__hero">
          <h1 className="petrol-savings-page__title">{PAGE_TITLE}</h1>
          <p className="petrol-savings-page__subtitle">{PAGE_DESCRIPTION}</p>
        </header>

        <div className="petrol-savings-page__layout">
          <PetrolSavingsForm
            vehicleSlug={vehicleSlug}
            vehicles={vehicleOptions}
            evPriceInr={evPriceInr}
            evPriceFromVehicle={evPriceFromVehicle}
            annualKm={annualKm}
            ownershipYears={ownershipYears}
            homeTariffInr={homeTariffInr}
            homeChargingPct={homeChargingPct}
            publicChargingPct={publicChargingPct}
            efficiencyKmPerKwh={efficiencyKmPerKwh}
            efficiencyFromVehicle={efficiencyFromVehicle}
            petrolPricePerLitre={petrolPricePerLitre}
            petrolEfficiencyKmPerL={petrolEfficiencyKmPerL}
            onVehicleChange={handleVehicleChange}
            onEvPriceChange={(value) => {
              setEvPriceFromVehicle(false);
              setEvPriceInr(
                clampPetrolSavingsValue(
                  value,
                  PETROL_SAVINGS_BOUNDS.vehiclePriceMin,
                  PETROL_SAVINGS_BOUNDS.vehiclePriceMax
                )
              );
            }}
            onAnnualKmChange={(value) =>
              setAnnualKm(
                clampPetrolSavingsValue(
                  value,
                  PETROL_SAVINGS_BOUNDS.annualKmMin,
                  PETROL_SAVINGS_BOUNDS.annualKmMax
                )
              )
            }
            onOwnershipYearsChange={(value) =>
              setOwnershipYears(
                clampPetrolSavingsValue(
                  value,
                  PETROL_SAVINGS_BOUNDS.ownershipYearsMin,
                  PETROL_SAVINGS_BOUNDS.ownershipYearsMax
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
            onPetrolPriceChange={(value) =>
              setPetrolPricePerLitre(
                clampPetrolSavingsValue(
                  value,
                  PETROL_SAVINGS_BOUNDS.petrolPriceMin,
                  PETROL_SAVINGS_BOUNDS.petrolPriceMax
                )
              )
            }
            onPetrolEfficiencyChange={(value) =>
              setPetrolEfficiencyKmPerL(
                clampPetrolSavingsValue(
                  value,
                  PETROL_SAVINGS_BOUNDS.petrolEfficiencyMin,
                  PETROL_SAVINGS_BOUNDS.petrolEfficiencyMax
                )
              )
            }
          />

          <div className="petrol-savings-page__results">
            <Score2ToolsPerspective vehicleSlug={vehicleSlug} />
            <PetrolSavingsResultCard
              evTotalInr={result.ev.totalOwnershipCostInr}
              petrolTotalInr={result.petrol.totalOwnershipCostInr}
              savingsInr={result.savingsInr}
              savingsPct={result.savingsPct}
              tone={result.tone}
              breakEvenKm={result.breakEvenKm}
              ownershipYears={result.ev.ownershipYears}
            />

            <PetrolSavingsChart
              evBreakdown={result.ev.breakdown}
              petrolBreakdown={result.petrol.breakdown}
              evTotalInr={result.ev.totalOwnershipCostInr}
              petrolTotalInr={result.petrol.totalOwnershipCostInr}
            />

            {insights.length ? (
              <section
                className="petrol-savings-page__insight"
                aria-labelledby="petrol-savings-insight-title"
              >
                <h2
                  id="petrol-savings-insight-title"
                  className="petrol-savings-page__insight-title"
                >
                  Ownership insight
                </h2>
                <ul className="petrol-savings-page__insight-list">
                  {insights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        {loadingVehicles ? (
          <p className="petrol-savings-form__hint" style={{ marginTop: 16 }}>
            Loading tier-1 vehicles…
          </p>
        ) : null}
      </div>
    </div>
  );
}
