import { useCallback, useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import EmiBreakdownChart from "../../components/tools/EmiBreakdownChart.jsx";
import EmiForm from "../../components/tools/EmiForm.jsx";
import EmiResultCard from "../../components/tools/EmiResultCard.jsx";
import {
  calculateEmiPlan,
  clampEmiValue,
} from "../../tools/emiCalculator.js";
import { EMI_BOUNDS, EMI_DEFAULTS } from "../../tools/emiDefaults.js";

import OwnershipPageLayout from "./OwnershipPageLayout.jsx";
import { OWNERSHIP_PAGE_TYPES } from "./ownershipRoutes.js";
import {
  buildOwnershipQuestionShortAnswer,
  formatOwnershipQuestionQuickAnswer,
} from "./ownershipQuestionSummaries.js";
import { buildOwnershipSummaryText } from "./ownershipPageSummaries.js";
import { useOwnershipPageVehicle } from "./useOwnershipPageVehicle.js";

import "../../components/tools/emi-calculator.css";

export default function EmiOwnershipPage({
  questionType = null,
}) {
  const { slug: routeSlug } = useParams();
  const { vehicleSlug, vehicle, familyName, loading, error, isValidSlug } =
    useOwnershipPageVehicle(routeSlug);

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

  const applyVehiclePrefill = useCallback((loadedVehicle) => {
    const price = Number(
      loadedVehicle?.startingPrice ||
        loadedVehicle?.price ||
        loadedVehicle?.exShowroomPrice ||
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
  }, []);

  useEffect(() => {
    if (!vehicle) return;
    applyVehiclePrefill(vehicle);
  }, [vehicle, applyVehiclePrefill]);

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

  const summaryText = questionType
    ? buildOwnershipQuestionShortAnswer(questionType, familyName, {
        emiInr: result.monthlyEmi,
        downPaymentPct,
      })
    : buildOwnershipSummaryText(
        OWNERSHIP_PAGE_TYPES.EMI,
        familyName,
        {
          emiInr: result.monthlyEmi,
          downPaymentPct,
        }
      );

  const quickAnswerValue = questionType
    ? formatOwnershipQuestionQuickAnswer(questionType, {
        emiInr: result.monthlyEmi,
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
        pageType={OWNERSHIP_PAGE_TYPES.EMI}
        vehicleSlug={vehicleSlug}
        familyName={familyName || "Electric vehicle"}
        error="not_found"
        questionType={questionType}
      />
    );
  }

  return (
    <OwnershipPageLayout
      pageType={OWNERSHIP_PAGE_TYPES.EMI}
      vehicleSlug={vehicleSlug}
      familyName={familyName}
      vehicle={vehicle}
      summaryText={summaryText}
      loading={loading}
      error={error}
      questionType={questionType}
      quickAnswerValue={quickAnswerValue}
    >
      <div className="emi-page__layout">
        <EmiForm
          vehicleSlug={vehicleSlug}
          vehicles={vehicleOption}
          vehiclePriceInr={vehiclePriceInr}
          vehiclePriceFromVehicle={vehiclePriceFromVehicle}
          downPaymentPct={downPaymentPct}
          downPaymentInr={result.downPaymentInr}
          loanTenureYears={loanTenureYears}
          interestRatePct={interestRatePct}
          processingFeePct={processingFeePct}
          balloonPaymentInr={balloonPaymentInr}
          onVehicleChange={() => {}}
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
        </div>
      </div>
    </OwnershipPageLayout>
  );
}
