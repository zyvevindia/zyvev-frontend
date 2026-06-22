import { useCallback, useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import CostPerKmForm from "../../components/tools/CostPerKmForm.jsx";
import CostPerKmResultCard from "../../components/tools/CostPerKmResultCard.jsx";
import {
  calculateCostPerKm,
  calculateMonthlyCost,
  calculateYearlyCost,
  clampCostPerKmValue,
  resolveCostPerKmSavingsTier,
  resolveVehicleCostPerKmEfficiency,
} from "../../tools/costPerKmCalculator.js";
import { COST_PER_KM_DEFAULTS } from "../../tools/costPerKmDefaults.js";

import OwnershipPageLayout from "./OwnershipPageLayout.jsx";
import { OWNERSHIP_PAGE_TYPES } from "./ownershipRoutes.js";
import {
  buildOwnershipQuestionShortAnswer,
  formatOwnershipQuestionQuickAnswer,
} from "./ownershipQuestionSummaries.js";
import { buildOwnershipSummaryText } from "./ownershipPageSummaries.js";
import { useOwnershipPageVehicle } from "./useOwnershipPageVehicle.js";

import "../../components/tools/cost-per-km.css";

export default function RunningCostPage({
  questionType = null,
}) {
  const { slug: routeSlug } = useParams();
  const { vehicleSlug, vehicle, familyName, loading, error, isValidSlug } =
    useOwnershipPageVehicle(routeSlug);

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

  const applyVehicleEfficiency = useCallback((loadedVehicle, variants = []) => {
    const resolved = resolveVehicleCostPerKmEfficiency(loadedVehicle, variants);
    if (resolved?.efficiencyKmPerKwh) {
      setEfficiencyKmPerKwh(resolved.efficiencyKmPerKwh);
      setEfficiencyFromVehicle(resolved.fromRealWorld);
    }
  }, []);

  useEffect(() => {
    if (!vehicle) return;
    applyVehicleEfficiency(vehicle, variants);
  }, [vehicle, variants, applyVehicleEfficiency]);

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

  const summaryText = questionType
    ? buildOwnershipQuestionShortAnswer(questionType, familyName, {
        costPerKm: calculation.costPerKm,
      })
    : buildOwnershipSummaryText(
        OWNERSHIP_PAGE_TYPES.RUNNING_COST,
        familyName,
        { costPerKm: calculation.costPerKm }
      );

  const quickAnswerValue = questionType
    ? formatOwnershipQuestionQuickAnswer(questionType, {
        costPerKm: calculation.costPerKm,
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
        pageType={OWNERSHIP_PAGE_TYPES.RUNNING_COST}
        vehicleSlug={vehicleSlug}
        familyName={familyName || "Electric vehicle"}
        error="not_found"
        questionType={questionType}
      />
    );
  }

  return (
    <OwnershipPageLayout
      pageType={OWNERSHIP_PAGE_TYPES.RUNNING_COST}
      vehicleSlug={vehicleSlug}
      familyName={familyName}
      vehicle={vehicle}
      summaryText={summaryText}
      loading={loading}
      error={error}
      questionType={questionType}
      quickAnswerValue={quickAnswerValue}
    >
      <div className="cost-per-km-page__layout">
        <CostPerKmForm
          homeTariffInr={homeTariffInr}
          homeChargingPct={homeChargingPct}
          efficiencyKmPerKwh={efficiencyKmPerKwh}
          publicChargingPct={calculation.publicChargingPct}
          vehicleSlug={vehicleSlug}
          vehicles={vehicleOption}
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
          onVehicleChange={() => {}}
        />

        <CostPerKmResultCard
          costPerKm={calculation.costPerKm}
          monthlyCost={monthlyCost}
          yearlyCost={yearlyCost}
          savingsTier={savingsTier}
        />
      </div>
    </OwnershipPageLayout>
  );
}
