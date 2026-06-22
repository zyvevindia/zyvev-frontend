import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useParams } from "react-router-dom";

import TcoBreakdownChart from "../../components/tools/TcoBreakdownChart.jsx";
import TcoForm from "../../components/tools/TcoForm.jsx";
import TcoResultCard from "../../components/tools/TcoResultCard.jsx";
import {
  clampCostPerKmValue,
  resolveVehicleCostPerKmEfficiency,
} from "../../tools/costPerKmCalculator.js";
import { COST_PER_KM_DEFAULTS } from "../../tools/costPerKmDefaults.js";
import {
  calculateTco,
  clampTcoValue,
  deriveDefaultInsurancePerYear,
} from "../../tools/tcoCalculator.js";
import { TCO_BOUNDS, TCO_DEFAULTS } from "../../tools/tcoDefaults.js";

import OwnershipPageLayout from "./OwnershipPageLayout.jsx";
import { OWNERSHIP_PAGE_TYPES } from "./ownershipRoutes.js";
import {
  buildOwnershipQuestionShortAnswer,
  formatOwnershipQuestionQuickAnswer,
} from "./ownershipQuestionSummaries.js";
import { buildOwnershipSummaryText } from "./ownershipPageSummaries.js";
import { useOwnershipPageVehicle } from "./useOwnershipPageVehicle.js";

import "../../components/tools/tco-calculator.css";

export default function OwnershipCostPage({
  questionType = null,
}) {
  const { slug: routeSlug } = useParams();
  const { vehicleSlug, vehicle, variants, familyName, loading, error, isValidSlug } =
    useOwnershipPageVehicle(routeSlug);

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

  const insuranceManualRef = useRef(insuranceManual);
  insuranceManualRef.current = insuranceManual;

  const applyVehiclePrefill = useCallback((loadedVehicle, loadedVariants = []) => {
    const price = Number(
      loadedVehicle?.startingPrice ||
        loadedVehicle?.price ||
        loadedVehicle?.exShowroomPrice ||
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
      loadedVehicle,
      loadedVariants
    );
    if (resolved?.efficiencyKmPerKwh) {
      setEfficiencyKmPerKwh(resolved.efficiencyKmPerKwh);
      setEfficiencyFromVehicle(resolved.fromRealWorld);
    }
  }, []);

  useEffect(() => {
    if (!vehicle) return;
    applyVehiclePrefill(vehicle, variants);
  }, [vehicle, variants, applyVehiclePrefill]);

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

  const summaryText = questionType
    ? buildOwnershipQuestionShortAnswer(questionType, familyName, {
        totalOwnershipCostInr: result.totalOwnershipCostInr,
        annualKm,
        ownershipYears,
      })
    : buildOwnershipSummaryText(
        OWNERSHIP_PAGE_TYPES.TCO,
        familyName,
        {
          totalOwnershipCostInr: result.totalOwnershipCostInr,
          annualKm,
          ownershipYears,
        }
      );

  const quickAnswerValue = questionType
    ? formatOwnershipQuestionQuickAnswer(questionType, {
        totalOwnershipCostInr: result.totalOwnershipCostInr,
      })
    : "";

  const vehicleOption = useMemo(
    () =>
      vehicleSlug
        ? [{ slug: vehicleSlug, name: familyName || vehicleSlug }]
        : [],
    [vehicleSlug, familyName]
  );

  if (!isValidSlug && !loading) {
    return (
      <OwnershipPageLayout
        pageType={OWNERSHIP_PAGE_TYPES.TCO}
        vehicleSlug={vehicleSlug}
        familyName={familyName || "Electric vehicle"}
        error="not_found"
        questionType={questionType}
      />
    );
  }

  return (
    <OwnershipPageLayout
      pageType={OWNERSHIP_PAGE_TYPES.TCO}
      vehicleSlug={vehicleSlug}
      familyName={familyName}
      vehicle={vehicle}
      summaryText={summaryText}
      loading={loading}
      error={error}
      questionType={questionType}
      quickAnswerValue={quickAnswerValue}
    >
      <div className="tco-page__layout">
        <TcoForm
          vehicleSlug={vehicleSlug}
          vehicles={vehicleOption}
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
          onVehicleChange={() => {}}
          onVehiclePriceChange={(value) => {
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
          }}
          onAnnualKmChange={(value) =>
            setAnnualKm(
              clampTcoValue(value, TCO_BOUNDS.annualKmMin, TCO_BOUNDS.annualKmMax)
            )
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
          onInsuranceChange={(value) => {
            setInsuranceManual(true);
            setInsurancePerYear(
              clampTcoValue(
                value,
                TCO_BOUNDS.insurancePerYearMin,
                TCO_BOUNDS.insurancePerYearMax
              )
            );
          }}
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
          <TcoResultCard
            totalOwnershipCostInr={result.totalOwnershipCostInr}
            ownershipCostPerKm={result.ownershipCostPerKm}
            depreciationInr={result.depreciationInr}
            energyInr={result.energyInr}
            maintenanceInr={result.maintenanceInr}
            insuranceInr={result.insuranceInr}
            residualValueInr={result.residualValueInr}
          />
          <TcoBreakdownChart breakdown={result.breakdown} />
        </div>
      </div>
    </OwnershipPageLayout>
  );
}
