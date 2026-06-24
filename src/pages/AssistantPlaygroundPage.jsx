import { useEffect, useMemo, useState } from "react";

import { Helmet } from "react-helmet-async";



import { ANALYTICS_EVENTS } from "../analytics/events.js";

import { trackAnalytics } from "../analytics/track.js";

import {

  ASSISTANT_QUESTIONS,

  buildAssistantJourneyInput,

  getAssistantResponse,

  groupAssistantRecommendationsByBucket,

} from "../aiAssistant/index.js";

import { buildAssistantBuyerProfile } from "../aiAssistant/buildAssistantBuyerProfile.js";

import { buildRecommendationConfidence } from "../aiAssistant/buildRecommendationConfidence.js";

import { buildProfileInsights } from "../aiAssistant/buildProfileInsights.js";

import {

  readAssistantIntentSignals,

  resolveBuyerReadiness,

} from "../aiAssistant/assistantIntentSignals.js";

import { readAssistantShortlist } from "../aiAssistant/assistantShortlist.js";

import { resolveBuyerArchetypes } from "../buyerJourney/resolveBuyerArchetypes.js";

import "../styles/assistant-playground.css";



function formatProgress(value) {

  return `${Math.round(value * 100)}%`;

}



function DebugPanel({ response, answers }) {

  const journeyInput = useMemo(() => {

    if (!response.state.complete) {

      return null;

    }



    return buildAssistantJourneyInput(response.state);

  }, [response.state]);



  const resolvedArchetypes = useMemo(() => {

    if (!journeyInput) {

      return null;

    }



    return resolveBuyerArchetypes(journeyInput);

  }, [journeyInput]);



  const grouped = useMemo(

    () => groupAssistantRecommendationsByBucket(response.journey),

    [response.journey]

  );

  const buyerProfile = useMemo(() => {
    if (!response.state.complete || !response.journey) return null;
    return buildAssistantBuyerProfile(response.state, response.journey);
  }, [response.state, response.journey]);

  const recommendationConfidence = useMemo(() => {
    if (!response.state.complete) return null;
    return buildRecommendationConfidence(response.state);
  }, [response.state]);

  const profileInsights = useMemo(
    () => buildProfileInsights(response.journey),
    [response.journey]
  );

  const intentSignals = useMemo(() => readAssistantIntentSignals(), [answers, response]);

  const shortlistState = useMemo(() => readAssistantShortlist(), [answers, response]);

  const readiness = useMemo(() => resolveBuyerReadiness(intentSignals), [intentSignals]);



  return (

    <section className="assistant-playground__panel assistant-playground__debug" aria-label="Debug mode">

      <h2 className="assistant-playground__panel-title">Debug mode</h2>



      <div className="assistant-playground__section">

        <h3 className="assistant-playground__section-title">Conversation state</h3>

        <pre className="assistant-playground__debug-block">

          {JSON.stringify(

            {

              answers,

              state: response.state,

              flow: response.flow,

            },

            null,

            2

          )}

        </pre>

      </div>



      {resolvedArchetypes ? (

        <div className="assistant-playground__section">

          <h3 className="assistant-playground__section-title">Resolved archetypes</h3>

          <pre className="assistant-playground__debug-block">

            {JSON.stringify(resolvedArchetypes, null, 2)}

          </pre>

        </div>

      ) : null}



      {journeyInput ? (

        <div className="assistant-playground__section">

          <h3 className="assistant-playground__section-title">Buyer journey input</h3>

          <pre className="assistant-playground__debug-block">

            {JSON.stringify(journeyInput, null, 2)}

          </pre>

        </div>

      ) : null}



      {response.state.complete ? (

        <>

          {buyerProfile ? (
            <div className="assistant-playground__section">
              <h3 className="assistant-playground__section-title">Buyer profile</h3>
              <pre className="assistant-playground__debug-block">
                {JSON.stringify(buyerProfile, null, 2)}
              </pre>
            </div>
          ) : null}

          {recommendationConfidence ? (
            <div className="assistant-playground__section">
              <h3 className="assistant-playground__section-title">Recommendation explanation</h3>
              <pre className="assistant-playground__debug-block">
                {JSON.stringify(recommendationConfidence, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="assistant-playground__section">
            <h3 className="assistant-playground__section-title">Intent signals</h3>
            <pre className="assistant-playground__debug-block">
              {JSON.stringify({ ...intentSignals, readiness }, null, 2)}
            </pre>
          </div>

          <div className="assistant-playground__section">
            <h3 className="assistant-playground__section-title">Shortlist state</h3>
            <pre className="assistant-playground__debug-block">
              {JSON.stringify(shortlistState, null, 2)}
            </pre>
          </div>

          {profileInsights.length ? (
            <div className="assistant-playground__section">
              <h3 className="assistant-playground__section-title">Profile insights</h3>
              <pre className="assistant-playground__debug-block">
                {JSON.stringify(profileInsights, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="assistant-playground__section">

            <h3 className="assistant-playground__section-title">Strong matches</h3>

            <pre className="assistant-playground__debug-block">

              {JSON.stringify(response.buckets?.strongMatches || [], null, 2)}

            </pre>

          </div>



          <div className="assistant-playground__section">

            <h3 className="assistant-playground__section-title">Recommendation buckets</h3>

            <pre className="assistant-playground__debug-block">

              {JSON.stringify(grouped, null, 2)}

            </pre>

          </div>



          <div className="assistant-playground__section">

            <h3 className="assistant-playground__section-title">Follow-up questions</h3>

            <pre className="assistant-playground__debug-block">

              {JSON.stringify(response.followUpQuestions, null, 2)}

            </pre>

          </div>

        </>

      ) : null}

    </section>

  );

}



function RecommendationCard({ recommendation }) {

  return (

    <article className="assistant-playground__card">

      <p className="assistant-playground__card-meta">

        {recommendation.bucket.replace(/([A-Z])/g, " $1").trim()} ·{" "}

        {recommendation.confidence} confidence

      </p>

      <h3 className="assistant-playground__card-title">

        {recommendation.vehicleName}

      </h3>

      <p className="assistant-playground__card-copy">{recommendation.headline}</p>

      <p className="assistant-playground__card-copy">{recommendation.summary}</p>

      {recommendation.whyMatches.length ? (

        <div className="assistant-playground__section">

          <h4 className="assistant-playground__section-title">Why matches</h4>

          <ul className="assistant-playground__list">

            {recommendation.whyMatches.map((item) => (

              <li key={item}>{item}</li>

            ))}

          </ul>

        </div>

      ) : null}

      {recommendation.tradeOffs.length ? (

        <div className="assistant-playground__section">

          <h4 className="assistant-playground__section-title">Trade-offs</h4>

          <ul className="assistant-playground__list">

            {recommendation.tradeOffs.map((item) => (

              <li key={item}>{item}</li>

            ))}

          </ul>

        </div>

      ) : null}

    </article>

  );

}



export default function AssistantPlaygroundPage() {

  const [answers, setAnswers] = useState({});

  const [debugMode, setDebugMode] = useState(false);



  const response = useMemo(() => getAssistantResponse(answers), [answers]);



  useEffect(() => {

    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_PLAYGROUND_VIEW, {

      source_page: "assistant_playground",

    });

  }, []);



  useEffect(() => {

    if (!response.state.complete) return;



    trackAnalytics(ANALYTICS_EVENTS.ASSISTANT_RECOMMENDATION_GENERATED, {

      source_page: "assistant_playground",

      result_count: response.recommendations.length,

      strong_match_count: response.buckets?.strongMatches?.length || 0,

    });

  }, [response]);



  const handleAnswerChange = (stage, questionId, optionId, label) => {

    setAnswers((current) => ({

      ...current,

      [stage]: {

        questionId,

        optionId,

        label,

      },

    }));

  };



  return (

    <main className="assistant-playground">

      <Helmet>

        <title>Assistant Playground (Internal)</title>

        <meta name="robots" content="noindex,nofollow" />

      </Helmet>



      <div className="assistant-playground__inner">

        <header className="assistant-playground__header">

          <p className="assistant-playground__eyebrow">Internal only</p>

          <h1 className="assistant-playground__title">AI Buyer Assistant Playground</h1>

          <p className="assistant-playground__subtitle">

            Deterministic recommendation generation from conversation answers. No

            LLM, no chat UI, no API calls — read-only use of Score 2.0, Buyer

            Journey, Recommendation, and Compare Intelligence.

          </p>

          <label className="assistant-playground__debug-toggle">

            <input

              type="checkbox"

              checked={debugMode}

              onChange={(event) => setDebugMode(event.target.checked)}

            />

            <span>Debug mode</span>

          </label>

        </header>



        <div className="assistant-playground__layout">

          <section className="assistant-playground__panel" aria-label="Conversation answers">

            <h2 className="assistant-playground__panel-title">Conversation answers</h2>

            <p className="assistant-playground__progress">

              Completion: {formatProgress(response.flow.completionProgress)}

            </p>



            {ASSISTANT_QUESTIONS.map((question) => {

              const selected = answers[question.stage]?.optionId || "";



              return (

                <label key={question.id} className="assistant-playground__field">

                  <span className="assistant-playground__label">{question.prompt}</span>

                  <select

                    className="assistant-playground__select"

                    value={selected}

                    onChange={(event) => {

                      const option = question.options.find(

                        (entry) => entry.id === event.target.value

                      );

                      if (!option) return;

                      handleAnswerChange(

                        question.stage,

                        question.id,

                        option.id,

                        option.label

                      );

                    }}

                  >

                    <option value="">Select…</option>

                    {question.options.map((option) => (

                      <option key={option.id} value={option.id}>

                        {option.label}

                      </option>

                    ))}

                  </select>

                </label>

              );

            })}

          </section>



          <section className="assistant-playground__panel" aria-label="Assistant response">

            <h2 className="assistant-playground__panel-title">Assistant response</h2>



            {!response.state.complete ? (

              <p className="assistant-playground__status">

                {response.flow.nextQuestion

                  ? `Next: ${response.flow.nextQuestion.prompt}`

                  : "Complete all answers to generate recommendations."}

              </p>

            ) : (

              <>

                <div className="assistant-playground__section">

                  <h3 className="assistant-playground__section-title">Strong matches</h3>

                  {response.buckets?.strongMatches?.length ? (

                    <ul className="assistant-playground__list">

                      {response.buckets.strongMatches.map((match) => (

                        <li key={match.vehicleSlug}>

                          {match.vehicleName} ({match.anchorFitTier})

                        </li>

                      ))}

                    </ul>

                  ) : (

                    <p className="assistant-playground__card-copy">No strong matches.</p>

                  )}

                </div>



                <div className="assistant-playground__section">

                  <h3 className="assistant-playground__section-title">Recommendations</h3>

                  {response.recommendations.slice(0, 4).map((recommendation) => (

                    <RecommendationCard

                      key={recommendation.vehicleSlug}

                      recommendation={recommendation}

                    />

                  ))}

                </div>



                <div className="assistant-playground__section">

                  <h3 className="assistant-playground__section-title">Follow-up questions</h3>

                  {response.followUpQuestions.map((item) => (

                    <p key={item.id} className="assistant-playground__follow-up">

                      {item.prompt}

                    </p>

                  ))}

                </div>

              </>

            )}

          </section>



          {debugMode ? <DebugPanel response={response} answers={answers} /> : null}

        </div>

      </div>

    </main>

  );

}


