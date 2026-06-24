import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import {
  ASSISTANT_QUESTIONS,
  getAssistantResponse,
  groupAssistantRecommendationsByBucket,
} from "../aiAssistant/index.js";
import { ANALYTICS_EVENTS } from "../analytics/events.js";
import { trackAnalytics } from "../analytics/track.js";
import { AssistantIntentProvider, useAssistantIntent } from "../components/assistant/AssistantIntentProvider.jsx";
import AssistantProgress from "../components/assistant/AssistantProgress.jsx";
import AssistantQuestionCard from "../components/assistant/AssistantQuestionCard.jsx";
import AssistantResults from "../components/assistant/AssistantResults.jsx";
import AssistantShell from "../components/assistant/AssistantShell.jsx";
import AssistantShortlistDrawer from "../components/assistant/AssistantShortlistDrawer.jsx";
import AssistantWelcomeCard from "../components/assistant/AssistantWelcomeCard.jsx";

const SOURCE_PAGE = "buyer_assistant";
const TOTAL_QUESTIONS = ASSISTANT_QUESTIONS.length;

function BuyerAssistantExperience() {
  const [phase, setPhase] = useState("welcome");
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [completedTracked, setCompletedTracked] = useState(false);
  const { markStarted, markCompleted } = useAssistantIntent();

  const response = useMemo(() => getAssistantResponse(answers), [answers]);
  const groupedRecommendations = useMemo(
    () => groupAssistantRecommendationsByBucket(response.journey),
    [response.journey]
  );

  const currentQuestion = ASSISTANT_QUESTIONS[currentQuestionIndex] || null;
  const selectedOptionId = currentQuestion
    ? answers[currentQuestion.stage]?.optionId || ""
    : "";

  useEffect(() => {
    if (!started) {
      return;
    }

    markStarted();
    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_STARTED, {
      source_page: SOURCE_PAGE,
    });
  }, [started, markStarted]);

  useEffect(() => {
    if (phase !== "results" || !response.state.complete || completedTracked) {
      return;
    }

    markCompleted();
    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_COMPLETED, {
      source_page: SOURCE_PAGE,
      strong_match_count: response.buckets?.strongMatches?.length || 0,
      recommendation_count: response.recommendations.length,
    });
    setCompletedTracked(true);
  }, [phase, response, completedTracked, markCompleted]);

  const handleStart = () => {
    setStarted(true);
    setCompletedTracked(false);
    setPhase("questions");
    setCurrentQuestionIndex(0);
  };

  const handleAnswerSelect = useCallback(
    (option) => {
      if (!currentQuestion) {
        return;
      }

      setAnswers((current) => ({
        ...current,
        [currentQuestion.stage]: {
          questionId: currentQuestion.id,
          optionId: option.id,
          label: option.label,
        },
      }));

      trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_QUESTION_ANSWERED, {
        source_page: SOURCE_PAGE,
        question_id: currentQuestion.id,
        option_id: option.id,
        step: currentQuestionIndex + 1,
      });

      if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
        setCurrentQuestionIndex((index) => index + 1);
      } else {
        setPhase("results");
      }
    },
    [currentQuestion, currentQuestionIndex]
  );

  const handleBack = () => {
    if (phase === "results") {
      setPhase("questions");
      setCurrentQuestionIndex(TOTAL_QUESTIONS - 1);
      return;
    }

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((index) => index - 1);
    }
  };

  const handleRestart = () => {
    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_RESTART, {
      source_page: SOURCE_PAGE,
    });

    setAnswers({});
    setCurrentQuestionIndex(0);
    setPhase("welcome");
    setStarted(false);
    setCompletedTracked(false);
  };

  const showBack = phase === "results" || currentQuestionIndex > 0;

  const progressStep =
    phase === "results"
      ? TOTAL_QUESTIONS
      : Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS);

  return (
    <AssistantShell>
      <Helmet>
        <title>EV Buyer Assistant | EVSavari</title>
        <meta
          name="description"
          content="Answer five quick questions to find EVs that match your budget, usage, family needs, charging access, and priorities."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {phase === "welcome" ? (
        <AssistantWelcomeCard onStart={handleStart} />
      ) : null}

      {phase === "questions" || phase === "results" ? (
        <>
          <AssistantProgress currentStep={progressStep} totalSteps={TOTAL_QUESTIONS} />

          <div className="assistant-toolbar">
            <div className="assistant-toolbar__actions">
              {showBack ? (
                <button
                  type="button"
                  className="assistant-btn assistant-btn--ghost"
                  onClick={handleBack}
                  disabled={phase === "questions" && currentQuestionIndex === 0}
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                className="assistant-btn assistant-btn--ghost"
                onClick={handleRestart}
              >
                Restart
              </button>
            </div>
          </div>
        </>
      ) : null}

      {phase === "questions" && currentQuestion ? (
        <AssistantQuestionCard
          question={currentQuestion}
          selectedOptionId={selectedOptionId}
          onSelect={handleAnswerSelect}
        />
      ) : null}

      {phase === "results" && response.journey ? (
        <AssistantResults
          groupedRecommendations={groupedRecommendations}
          journey={response.journey}
          state={response.state}
          sourcePage={SOURCE_PAGE}
        />
      ) : null}

      <AssistantShortlistDrawer sourcePage={SOURCE_PAGE} />
    </AssistantShell>
  );
}

export default function BuyerAssistantPage() {
  return (
    <AssistantIntentProvider sourcePage={SOURCE_PAGE}>
      <BuyerAssistantExperience />
    </AssistantIntentProvider>
  );
}
