import { useEffect, useRef, useState } from "react";

import { trackAnalytics } from "../../analytics/track.js";
import { TIER1_MODEL_FAMILY_SLUGS } from "../../data/tier1ModelFamilies.js";
import { getVehicleScoreProfileAsync } from "../../score2/getVehicleScoreProfileAsync.js";

/**
 * @param {string} familySlug
 * @param {{
 *   analyticsViewEvent?: string|null,
 *   analyticsSource?: string,
 * }} [options]
 */
export function useScore2Profile(
  familySlug,
  { analyticsViewEvent = null, analyticsSource = "" } = {}
) {
  const slug = String(familySlug || "").trim().toLowerCase();
  const isTier1 = TIER1_MODEL_FAMILY_SLUGS.includes(slug);

  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const trackedRef = useRef(false);

  useEffect(() => {
    trackedRef.current = false;

    if (!isTier1 || !slug) {
      setProfile(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    getVehicleScoreProfileAsync(slug)
      .then((nextProfile) => {
        if (cancelled) return;

        setProfile(nextProfile);
        setLoaded(true);

        if (
          nextProfile &&
          analyticsViewEvent &&
          !trackedRef.current
        ) {
          trackedRef.current = true;
          trackAnalytics(analyticsViewEvent, {
            family_slug: slug,
            overall_tier: nextProfile.score?.overall,
            source_page: analyticsSource,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, isTier1, analyticsViewEvent, analyticsSource]);

  return {
    profile,
    loaded,
    isTier1,
  };
}
