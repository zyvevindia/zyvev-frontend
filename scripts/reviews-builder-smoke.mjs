/**
 * Review intelligence builder smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import { findGoldenDossierByFamilySlug } from "../src/catalogAcquisition/benchmark/goldenLoaderNode.js";
import { buildReviewContext } from "../src/reviews/buildReviewContext.js";
import { buildVehicleReview } from "../src/reviews/buildVehicleReview.js";
import { REVIEW_CONFIDENCE, REVIEW_LIMITS } from "../src/reviews/constants.js";

const VALIDATION_SLUGS = [
  "tata-nexon-ev",
  "mg-comet-ev",
  "byd-seal",
  "mahindra-be-6",
];

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

function loadVehicle(slug) {
  return findGoldenDossierByFamilySlug(slug);
}

function assertSection(section, label) {
  assert(`${label} section is object`, section != null && typeof section === "object");
  assert(`${label} section has body`, typeof section?.body === "string");
  assert(`${label} section body non-empty`, Boolean(section?.body?.trim()));
}

for (const slug of VALIDATION_SLUGS) {
  const vehicle = loadVehicle(slug);
  assert(`${slug} golden dossier loads`, vehicle != null);

  let context = null;
  let review = null;

  try {
    context = buildReviewContext(vehicle);
    review = buildVehicleReview(vehicle);
  } catch (error) {
    console.error(`FAIL: ${slug} builders threw`, error);
    failed += 1;
    continue;
  }

  assert(`${slug} review context builds`, context != null);
  assert(`${slug} vehicle review builds`, review != null);
  assert(`${slug} vehicleSlug matches`, review?.vehicleSlug === slug);
  assert(
    `${slug} pros within limit`,
    Array.isArray(review?.pros) && review.pros.length <= REVIEW_LIMITS.maxPros
  );
  assert(
    `${slug} cons within limit`,
    Array.isArray(review?.cons) && review.cons.length <= REVIEW_LIMITS.maxCons
  );
  assert(
    `${slug} confidence label valid`,
    Object.values(REVIEW_CONFIDENCE).includes(review?.confidence)
  );

  assertSection(review?.overview, `${slug} overview`);
  assertSection(review?.cityDriving, `${slug} cityDriving`);
  assertSection(review?.highwayDriving, `${slug} highwayDriving`);
  assertSection(review?.chargingExperience, `${slug} chargingExperience`);
  assertSection(review?.ownershipCost, `${slug} ownershipCost`);
  assertSection(review?.familySuitability, `${slug} familySuitability`);
  assertSection(review?.serviceExperience, `${slug} serviceExperience`);

  assert(
    `${slug} finalVerdict present`,
    review?.finalVerdict != null &&
      typeof review.finalVerdict.headline === "string" &&
      typeof review.finalVerdict.summary === "string"
  );

  const hasProsOrCons =
    (context.strengths?.length ?? 0) > 0 || (context.weaknesses?.length ?? 0) > 0;
  assert(`${slug} pros or cons populate`, hasProsOrCons);
}

const sparseReview = buildVehicleReview({ slug: "sparse-ev", name: "Sparse EV" });
assert("sparse vehicle still returns review", sparseReview != null);
assert("sparse vehicle sections degrade gracefully", Boolean(sparseReview?.overview?.body));

const nullReview = buildVehicleReview(null);
assert("null vehicle returns null review", nullReview == null);

if (failed > 0) {
  console.error(`\n${failed} review builder smoke check(s) failed.`);
  process.exit(1);
}

console.log("\nReview builder smoke passed.");
