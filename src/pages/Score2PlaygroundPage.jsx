import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

import {
  ScoreAvoidIfCard,
  ScoreBestForCard,
  ScoreConfidenceCard,
  ScorePersonaCard,
  ScoreStrengthsCard,
  ScoreSummaryCard,
  ScoreWeaknessesCard,
} from "../components/score2";
import { formatVehicleSlugLabel } from "../components/score2/score2DisplayUtils";
import { getVehicleScoreProfileAsync } from "../score2/getVehicleScoreProfileAsync.js";
import "../components/score2/score2.css";

const PLAYGROUND_SLUGS = Object.freeze([
  "tata-nexon-ev",
  "mg-comet-ev",
  "byd-seal",
  "mahindra-be-6",
]);

function VehicleScoreSection({ slug, profile, loading, error }) {
  const label = formatVehicleSlugLabel(slug);

  if (loading) {
    return (
      <section className="score2-playground__vehicle">
        <h2 className="score2-playground__vehicle-title">{label}</h2>
        <div className="score2-playground__status">Loading profile…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="score2-playground__vehicle">
        <h2 className="score2-playground__vehicle-title">{label}</h2>
        <div className="score2-playground__error">{error}</div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="score2-playground__vehicle">
        <h2 className="score2-playground__vehicle-title">{label}</h2>
        <div className="score2-playground__error">Profile unavailable.</div>
      </section>
    );
  }

  const { score, recommendation, confidence, explanation } = profile;

  return (
    <section className="score2-playground__vehicle">
      <h2 className="score2-playground__vehicle-title">{label}</h2>
      <div className="score2-playground__grid">
        <div className="score2-playground__summary">
          <ScoreSummaryCard
            overallTier={score.overall}
            summary={explanation.summary}
          />
        </div>
        <ScoreStrengthsCard strengths={explanation.strengths} />
        <ScoreWeaknessesCard weaknesses={explanation.weaknesses} />
        <ScoreBestForCard bestFor={explanation.bestFor} />
        <ScoreAvoidIfCard avoidIf={explanation.avoidIf} />
        <ScorePersonaCard recommendation={recommendation} />
        <ScoreConfidenceCard confidence={confidence} />
      </div>
    </section>
  );
}

export default function Score2PlaygroundPage() {
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      setLoading(true);
      const nextProfiles = {};
      const nextErrors = {};

      await Promise.all(
        PLAYGROUND_SLUGS.map(async (slug) => {
          try {
            const profile = await getVehicleScoreProfileAsync(slug);
            if (!profile) {
              nextErrors[slug] = "Could not load score profile.";
              return;
            }
            nextProfiles[slug] = profile;
          } catch (error) {
            nextErrors[slug] =
              error instanceof Error ? error.message : "Failed to load profile.";
          }
        })
      );

      if (!cancelled) {
        setProfiles(nextProfiles);
        setErrors(nextErrors);
        setLoading(false);
      }
    }

    loadProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="score2-playground">
      <Helmet>
        <title>Score2 Playground (Internal)</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="score2-playground__inner">
        <header className="score2-playground__header">
          <p className="score2-playground__eyebrow">Internal only</p>
          <h1 className="score2-playground__title">Score 2.0 Playground</h1>
          <p className="score2-playground__subtitle">
            Presentation-layer validation for qualitative Score Renaissance
            profiles. Not linked from navigation and not indexed for SEO.
          </p>
        </header>

        {PLAYGROUND_SLUGS.map((slug) => (
          <VehicleScoreSection
            key={slug}
            slug={slug}
            profile={profiles[slug]}
            loading={loading}
            error={errors[slug]}
          />
        ))}
      </div>
    </main>
  );
}
