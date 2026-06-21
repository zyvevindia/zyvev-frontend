import { useEffect, useMemo, useState } from "react";

import { Link, Navigate, useParams } from "react-router-dom";

import SEO from "../components/SEO/SEO.jsx";
import JsonLd from "../components/SEO/JsonLd.jsx";
import ReviewAlternativesSection from "../components/reviews/ReviewAlternativesSection.jsx";
import ReviewAudienceCard from "../components/reviews/ReviewAudienceCard.jsx";
import ReviewEvSavariVerdictCard from "../components/reviews/ReviewEvSavariVerdictCard.jsx";
import ReviewHero from "../components/reviews/ReviewHero.jsx";
import ReviewInternalLinks from "../components/reviews/ReviewInternalLinks.jsx";
import ReviewProsConsCard from "../components/reviews/ReviewProsConsCard.jsx";
import ReviewSectionCard from "../components/reviews/ReviewSectionCard.jsx";
import ReviewVerdictCard from "../components/reviews/ReviewVerdictCard.jsx";
import OwnershipToolsMiniCard from "../components/tools/OwnershipToolsMiniCard.jsx";
import { buildReviewPageMeta } from "../seo/reviewPageMetadata.js";
import { buildReviewPageSchemas } from "../seo/reviewSchema.js";
import { buildVehicleReview } from "../reviews/buildVehicleReview.js";
import {
  buildReviewSlug,
  resolveVehicleSlugFromReviewSlug,
} from "../reviews/reviewRoutes.js";
import { resolveReviewFamilyName } from "../reviews/reviewBuilderUtils.js";
import { fetchVehicleFamilyBySlug } from "../utils/vehicleDetailResolver.js";
import { getHeroImage, getOgImage } from "../utils/vehicleMedia.js";

import "../components/tools/vehicle-ownership-tools.css";

import "../components/reviews/review-page.css";

export default function ReviewPage() {
  const { slug: routeSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [variants, setVariants] = useState([]);

  const vehicleSlug = useMemo(
    () => resolveVehicleSlugFromReviewSlug(routeSlug),
    [routeSlug]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReviewVehicle() {
      if (!vehicleSlug) {
        setError("not_found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchVehicleFamilyBySlug(vehicleSlug);
        if (cancelled) return;

        if (!result?.vehicle) {
          setError("not_found");
          setVehicle(null);
          setVariants([]);
          return;
        }

        setVehicle(result.vehicle);
        setVariants(result.variants || []);
      } catch {
        if (!cancelled) {
          setError("load_failed");
          setVehicle(null);
          setVariants([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReviewVehicle();

    return () => {
      cancelled = true;
    };
  }, [vehicleSlug]);

  const intelligenceVehicle = useMemo(() => {
    if (!vehicle) return null;

    return {
      ...vehicle,
      slug: vehicleSlug,
      familySlug: vehicleSlug,
      variants: variants.length ? variants : undefined,
    };
  }, [vehicle, vehicleSlug, variants]);

  const review = useMemo(
    () =>
      intelligenceVehicle ? buildVehicleReview(intelligenceVehicle) : null,
    [intelligenceVehicle]
  );

  if (loading) {
    return (
      <div className="review-page">
        <div className="review-page__state">Loading editorial review…</div>
      </div>
    );
  }

  if (error || !review) {
    const isLoadFailed = error === "load_failed";

    return (
      <div className="review-page">
        <div className="review-page__state">
          <h1>{isLoadFailed ? "Could not load this review" : "Review not found"}</h1>
          <p>
            {isLoadFailed
              ? "Please check your connection and try again."
              : "This editorial review is unavailable."}{" "}
            <Link to="/cars">Browse all EVs</Link>.
          </p>
        </div>
      </div>
    );
  }

  const canonicalSlug = buildReviewSlug(review.vehicleSlug);
  if (routeSlug !== canonicalSlug) {
    return <Navigate to={`/reviews/${canonicalSlug}`} replace />;
  }

  const familyName = resolveReviewFamilyName(intelligenceVehicle, review.vehicleSlug);
  const ogImage = getOgImage(vehicle) || getHeroImage(vehicle);
  const meta = buildReviewPageMeta({
    vehicleName: familyName,
    vehicleSlug: review.vehicleSlug,
    image: ogImage,
  });
  const schemas = buildReviewPageSchemas({
    review,
    vehicle: { ...vehicle, name: familyName, displayName: familyName },
    canonicalUrl: meta.canonical,
    image: ogImage,
  });

  return (
    <div className="review-page">
      <SEO
        title={meta.title}
        description={meta.description}
        keywords={meta.keywords}
        canonical={meta.canonical}
        image={meta.image}
        type={meta.ogType}
        robots={meta.robots}
      />
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}

      <div className="review-page__inner">
        <ReviewHero
          review={review}
          vehicle={vehicle}
          intelligenceVehicle={intelligenceVehicle}
          variants={variants}
        />

        <div className="review-page__grid">
          <ReviewEvSavariVerdictCard verdict={review.evSavariVerdict} />

          <ReviewProsConsCard variant="pros" items={review.pros} />
          <ReviewProsConsCard variant="cons" items={review.cons} />

          <ReviewAudienceCard
            title="Who should buy this EV"
            items={review.whoShouldBuy}
            tone="positive"
          />
          <ReviewAudienceCard
            title="Who should avoid this EV"
            items={review.whoShouldAvoid}
            tone="neutral"
          />

          <ReviewSectionCard
            title="City Driving"
            body={review.cityDriving?.body}
          />
          <ReviewSectionCard
            title="Highway Driving"
            body={review.highwayDriving?.body}
          />
          <ReviewSectionCard
            title="Charging Experience"
            body={review.chargingExperience?.body}
          />
          <ReviewSectionCard
            title="Ownership Cost"
            body={review.ownershipCost?.body}
          />
          <ReviewSectionCard
            title="Family Suitability"
            body={review.familySuitability?.body}
          />
          <ReviewSectionCard
            title="Service Experience"
            body={review.serviceExperience?.body}
          />

          <ReviewVerdictCard verdict={review.finalVerdict} />
          <OwnershipToolsMiniCard vehicleSlug={review.vehicleSlug} />
        </div>

        <ReviewAlternativesSection vehicle={intelligenceVehicle} />

        <ReviewInternalLinks
          vehicleSlug={review.vehicleSlug}
          familyName={familyName}
        />
      </div>
    </div>
  );
}
