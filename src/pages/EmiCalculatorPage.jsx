import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import EmiBreakdownChart from "../components/tools/EmiBreakdownChart.jsx";
import EmiForm from "../components/tools/EmiForm.jsx";
import EmiResultCard from "../components/tools/EmiResultCard.jsx";
import Score2ToolsPerspective from "../components/score2/Score2ToolsPerspective.jsx";
import SEO from "../components/SEO/SEO.jsx";
import JsonLd from "../components/SEO/JsonLd.jsx";
import { TIER1_MODEL_FAMILY_SLUGS } from "../data/tier1ModelFamilies.js";
import { buildBreadcrumbSchema, buildWebPageSchema } from "../seo/schema.js";
import {
  calculateEmiPlan,
  clampEmiValue,
  generateEmiInsights,
} from "../tools/emiCalculator.js";
import { EMI_BOUNDS, EMI_DEFAULTS } from "../tools/emiDefaults.js";
import {
  fetchListingCatalogVariants,
  fetchVehicleFamilyBySlug,
} from "../utils/vehicleDetailResolver.js";
import { aggregateModelFamilies } from "../utils/modelFamily.js";
import { normalizeVehicleSlug } from "../utils/vehicleRoutes.js";

import "../styles/ownership-tools-page.css";
import "../components/tools/emi-calculator.css";

const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN || "https://evsavari.com";

const PAGE_TITLE = "EMI Calculator";
const PAGE_DESCRIPTION =
  "Estimate monthly EMI, total interest, and full loan outflow for your EV purchase.";

export default function EmiCalculatorPage() {
  const [searchParams] = useSearchParams();
  const queryVehicleSlug = normalizeVehicleSlug(searchParams.get("vehicle"));

  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [vehicleSlug, setVehicleSlug] = useState(queryVehicleSlug || "");
  const [vehiclePriceInr, setVehiclePriceInr] = useState(
    EMI_DEFAULTS.vehiclePriceInr
  );
  const [vehiclePriceFromVehicle, setVehiclePriceFromVehicle] = useState(false);
  const [downPaymentPct, setDownPaymentPct] = useState(
    EMI_DEFAULTS.downPaymentPct
  );
  const [loanTenureYears, setLoanTenureYears] = useState(
    EMI_DEFAULTS.loanTenureYears
  );
  const [interestRatePct, setInterestRatePct] = useState(
    EMI_DEFAULTS.interestRatePct
  );
  const [processingFeePct, setProcessingFeePct] = useState(
    EMI_DEFAULTS.processingFeePct
  );
  const [balloonPaymentInr, setBalloonPaymentInr] = useState(
    EMI_DEFAULTS.balloonPaymentInr
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
      setVehiclePriceFromVehicle(false);
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
          clampEmiValue(
            price,
            EMI_BOUNDS.vehiclePriceMin,
            EMI_BOUNDS.vehiclePriceMax
          )
        );
        setVehiclePriceFromVehicle(true);
      }
    } catch {
      if (option?.startingPrice > 0) {
        setVehiclePriceInr(
          clampEmiValue(
            option.startingPrice,
            EMI_BOUNDS.vehiclePriceMin,
            EMI_BOUNDS.vehiclePriceMax
          )
        );
        setVehiclePriceFromVehicle(true);
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
    }
  }, []);

  const result = useMemo(
    () =>
      calculateEmiPlan({
        vehiclePriceInr,
        downPaymentPct,
        loanTenureYears,
        interestRatePct,
        processingFeePct,
        balloonPaymentInr,
      }),
    [
      vehiclePriceInr,
      downPaymentPct,
      loanTenureYears,
      interestRatePct,
      processingFeePct,
      balloonPaymentInr,
    ]
  );

  const insights = useMemo(
    () => generateEmiInsights(result),
    [result]
  );

  const canonical = `${SITE_ORIGIN.replace(/\/$/, "")}/tools/emi`;
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Tools", url: "/tools" },
      { name: "EMI Calculator", url: "/tools/emi" },
    ]),
    buildWebPageSchema({
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: canonical,
    }),
  ].filter(Boolean);

  return (
    <div className="ownership-tools-page emi-page">
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
          <Link to="/cars">Browse EVs</Link>
          <span aria-hidden="true"> / </span>
          <span>EMI calculator</span>
        </nav>

        <header className="emi-page__hero">
          <h1 className="emi-page__title">{PAGE_TITLE}</h1>
          <p className="emi-page__subtitle">{PAGE_DESCRIPTION}</p>
        </header>

        <div className="emi-page__layout">
          <EmiForm
            vehicleSlug={vehicleSlug}
            vehicles={vehicleOptions}
            vehiclePriceInr={vehiclePriceInr}
            vehiclePriceFromVehicle={vehiclePriceFromVehicle}
            downPaymentPct={downPaymentPct}
            downPaymentInr={result.downPaymentInr}
            loanTenureYears={loanTenureYears}
            interestRatePct={interestRatePct}
            processingFeePct={processingFeePct}
            balloonPaymentInr={balloonPaymentInr}
            onVehicleChange={handleVehicleChange}
            onVehiclePriceChange={(value) => {
              setVehiclePriceFromVehicle(false);
              setVehiclePriceInr(
                clampEmiValue(
                  value,
                  EMI_BOUNDS.vehiclePriceMin,
                  EMI_BOUNDS.vehiclePriceMax
                )
              );
            }}
            onDownPaymentPctChange={(value) =>
              setDownPaymentPct(
                clampEmiValue(
                  value,
                  EMI_BOUNDS.downPaymentPctMin,
                  EMI_BOUNDS.downPaymentPctMax
                )
              )
            }
            onLoanTenureChange={(value) =>
              setLoanTenureYears(
                clampEmiValue(
                  value,
                  EMI_BOUNDS.loanTenureYearsMin,
                  EMI_BOUNDS.loanTenureYearsMax
                )
              )
            }
            onInterestRateChange={(value) =>
              setInterestRatePct(
                clampEmiValue(
                  value,
                  EMI_BOUNDS.interestRatePctMin,
                  EMI_BOUNDS.interestRatePctMax
                )
              )
            }
            onProcessingFeeChange={(value) =>
              setProcessingFeePct(
                clampEmiValue(
                  value,
                  EMI_BOUNDS.processingFeePctMin,
                  EMI_BOUNDS.processingFeePctMax
                )
              )
            }
            onBalloonPaymentChange={(value) =>
              setBalloonPaymentInr(
                clampEmiValue(
                  value,
                  EMI_BOUNDS.balloonPaymentMin,
                  EMI_BOUNDS.balloonPaymentMax
                )
              )
            }
          />

          <div className="emi-page__results">
            <Score2ToolsPerspective vehicleSlug={vehicleSlug} />
            <EmiResultCard
              monthlyEmi={result.monthlyEmi}
              loanAmountInr={result.loanAmountInr}
              totalInterestInr={result.totalInterestInr}
              totalOutflowInr={result.totalOutflowInr}
              affordability={result.affordability}
              loanTenureYears={result.loanTenureYears}
            />

            <EmiBreakdownChart
              breakdown={result.breakdown}
              totalOutflowInr={result.totalOutflowInr}
            />

            {insights.length ? (
              <section
                className="emi-page__insight"
                aria-labelledby="emi-insight-title"
              >
                <h2 id="emi-insight-title" className="emi-page__insight-title">
                  Loan insight
                </h2>
                <ul className="emi-page__insight-list">
                  {insights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        {loadingVehicles ? (
          <p className="emi-form__hint" style={{ marginTop: 16 }}>
            Loading tier-1 vehicles…
          </p>
        ) : null}
      </div>
    </div>
  );
}
