import { useCallback, useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import PetrolSavingsChart from "../../components/tools/PetrolSavingsChart.jsx";
import PetrolSavingsForm from "../../components/tools/PetrolSavingsForm.jsx";
import PetrolSavingsResultCard from "../../components/tools/PetrolSavingsResultCard.jsx";
import {
  calculateCostPerKm,
  clampCostPerKmValue,
  resolveVehicleCostPerKmEfficiency,
} from "../../tools/costPerKmCalculator.js";
import {
  calculatePetrolSavings,
  clampPetrolSavingsValue,
} from "../../tools/petrolSavingsCalculator.js";
import {
  PETROL_SAVINGS_BOUNDS,
  PETROL_SAVINGS_DEFAULTS,
} from "../../tools/petrolSavingsDefaults.js";

import OwnershipPageLayout from "./OwnershipPageLayout.jsx";
import { OWNERSHIP_PAGE_TYPES } from "./ownershipRoutes.js";
import {
  buildOwnershipQuestionShortAnswer,
  formatOwnershipQuestionQuickAnswer,
} from "./ownershipQuestionSummaries.js";
import { buildOwnershipSummaryText } from "./ownershipPageSummaries.js";
import { useOwnershipPageVehicle } from "./useOwnershipPageVehicle.js";

import "../../components/tools/petrol-savings.css";

export default function PetrolSavingsOwnershipPage({
  questionType = null,
}) {
  const { slug: routeSlug } = useParams();
  const { vehicleSlug, vehicle, variants, familyName, loading, error, isValidSlug } =
    useOwnershipPageVehicle(routeSlug);

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

  const applyVehiclePrefill = useCallback((loadedVehicle, loadedVariants = []) => {
    const price = Number(
      loadedVehicle?.startingPrice ||
        loadedVehicle?.price ||
        loadedVehicle?.exShowroomPrice ||
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

  const summaryText = questionType
    ? buildOwnershipQuestionShortAnswer(questionType, familyName, {
        savingsInr: result.savingsInr,
      })
    : buildOwnershipSummaryText(
        OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS,
        familyName,
        { savingsInr: result.savingsInr }
      );

  const quickAnswerValue = questionType
    ? formatOwnershipQuestionQuickAnswer(questionType, {
        savingsInr: result.savingsInr,
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
        pageType={OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS}
        vehicleSlug={vehicleSlug}
        familyName={familyName || "Electric vehicle"}
        error="not_found"
        questionType={questionType}
      />
    );
  }

  return (
    <OwnershipPageLayout
      pageType={OWNERSHIP_PAGE_TYPES.PETROL_SAVINGS}
      vehicleSlug={vehicleSlug}
      familyName={familyName}
      vehicle={vehicle}
      summaryText={summaryText}
      loading={loading}
      error={error}
      questionType={questionType}
      quickAnswerValue={quickAnswerValue}
    >
      <div className="petrol-savings-page__layout">
        <PetrolSavingsForm
          vehicleSlug={vehicleSlug}
          vehicles={vehicleOption}
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
          onVehicleChange={() => {}}
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
        </div>
      </div>
    </OwnershipPageLayout>
  );
}
