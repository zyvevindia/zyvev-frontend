/**
 * Recommendation intelligence layer smoke checks (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import { BUYER_ARCHETYPE_IDS } from "../src/recommendations/constants.js";
import { getRecommendationNarrative } from "../src/recommendations/recommendationRegistry.js";
import { getVehicleRecommendationProfiles } from "../src/recommendations/recommendationProfileRegistry.js";

const VALIDATION_SLUGS = [
  "tata-nexon-ev",
  "mg-comet-ev",
  "byd-seal",
  "mahindra-be-6",
];

/** @type {Record<string, {
 *   topIncludes?: string[],
 *   secondaryIncludes?: string[],
 *   weakIncludes?: string[],
 *   whoShouldBuyIncludes?: string[],
 *   whoShouldLookElsewhereIncludes?: string[],
 *   primaryIncludes?: string,
 *   familyHeadlineIncludes?: string,
 *   familyWhyIncludes?: string[],
 *   familyConsiderationsInclude?: string[],
 * }>} */
const EXPECTED_VEHICLE_INTELLIGENCE = {
  "tata-nexon-ev": {
    topIncludes: ["Family Buyer", "Highway Traveller"],
    secondaryIncludes: ["City Commuter", "Budget Buyer"],
    weakIncludes: ["Premium Buyer"],
    whoShouldBuyIncludes: [
      "Families",
      "Mixed city-highway users",
      "Regular commuters",
    ],
    whoShouldLookElsewhereIncludes: ["Buyers seeking luxury positioning"],
    primaryIncludes: "Strong choice for families and mixed city-highway users",
    familyHeadlineIncludes: "Strong choice for families",
    familyWhyIncludes: [
      "Strong family practicality",
      "Broad service support",
      "Suitable for mixed city and highway usage",
    ],
    familyConsiderationsInclude: ["Premium appeal is limited"],
  },
  "mg-comet-ev": {
    topIncludes: ["City Commuter", "Budget Buyer"],
    secondaryIncludes: ["First-time EV Buyer"],
    weakIncludes: ["Highway Traveller", "Family Buyer"],
    whoShouldBuyIncludes: ["Budget-conscious buyers", "Regular commuters"],
    whoShouldLookElsewhereIncludes: ["Frequent highway travellers"],
    cityHeadlineIncludes: "Excellent fit for urban commuters",
    cityWhyIncludes: [
      "Strong city usability",
      "Low ownership costs",
      "Attractive purchase value",
    ],
    cityConsiderationsInclude: ["Long-distance capability is limited"],
  },
  "byd-seal": {
    topIncludes: ["Premium Buyer"],
    weakIncludes: ["Budget Buyer"],
    premiumHeadlineIncludes: "Premium buyers are likely to appreciate this EV",
    premiumWhyIncludes: [
      "Premium comfort and performance appeal",
      "Strong highway capability",
    ],
    premiumConsiderationsInclude: [
      "Purchase price may feel high for value-focused buyers",
    ],
  },
};

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    failed += 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

function printList(title, items = []) {
  console.log(title);
  if (!items.length) {
    console.log("  (none)");
    return;
  }
  for (const item of items) {
    console.log(`  - ${item}`);
  }
}

function includesAll(haystack, needles = []) {
  return needles.every((needle) =>
    haystack.some((item) => String(item).includes(needle))
  );
}

function titleList(items = []) {
  return items.map((item) => item.title || item);
}

for (const slug of VALIDATION_SLUGS) {
  console.log(`\n=== ${slug} ===\n`);

  const bundle = getVehicleRecommendationProfiles(slug);
  assert(`${slug} recommendation bundle loads`, bundle != null);
  if (!bundle) continue;

  assert(`${slug} has seven archetype profiles`, Boolean(bundle.profiles));
  assert(
    `${slug} profile count is seven`,
    Object.values(bundle.profiles).filter(Boolean).length === 7
  );
  assert(`${slug} topFits present`, Array.isArray(bundle.topFits));
  assert(`${slug} secondaryFits present`, Array.isArray(bundle.secondaryFits));
  assert(`${slug} weakFits present`, Array.isArray(bundle.weakFits));
  assert(`${slug} whoShouldBuy present`, bundle.whoShouldBuy.length > 0);
  assert(
    `${slug} explanation present`,
    Boolean(bundle.explanation?.primaryRecommendation)
  );

  const expected = EXPECTED_VEHICLE_INTELLIGENCE[slug];
  if (expected?.topIncludes) {
    assert(
      `${slug} top fits include expected archetypes`,
      includesAll(titleList(bundle.topFits), expected.topIncludes)
    );
  }
  if (expected?.secondaryIncludes) {
    assert(
      `${slug} secondary fits include expected archetypes`,
      includesAll(titleList(bundle.secondaryFits), expected.secondaryIncludes)
    );
  }
  if (expected?.weakIncludes) {
    assert(
      `${slug} weak fits include expected archetypes`,
      includesAll(titleList(bundle.weakFits), expected.weakIncludes)
    );
  }
  if (expected?.whoShouldBuyIncludes) {
    assert(
      `${slug} who-should-buy includes expected phrases`,
      includesAll(bundle.whoShouldBuy, expected.whoShouldBuyIncludes)
    );
  }
  if (expected?.whoShouldLookElsewhereIncludes) {
    assert(
      `${slug} who-should-look-elsewhere includes expected phrases`,
      includesAll(
        bundle.whoShouldLookElsewhere,
        expected.whoShouldLookElsewhereIncludes
      )
    );
  }
  if (expected?.primaryIncludes) {
    assert(
      `${slug} primary recommendation matches editorial expectation`,
      bundle.explanation.primaryRecommendation.includes(expected.primaryIncludes)
    );
  }

  const familyProfile = bundle.profiles.familyBuyer;
  const cityProfile = bundle.profiles.cityCommuter;
  const premiumProfile = bundle.profiles.premiumBuyer;

  if (expected?.familyHeadlineIncludes && familyProfile) {
    assert(
      `${slug} family headline matches`,
      familyProfile.headline.includes(expected.familyHeadlineIncludes)
    );
    assert(
      `${slug} family why-it-fits includes expected bullets`,
      includesAll(familyProfile.whyItFits, expected.familyWhyIncludes || [])
    );
    assert(
      `${slug} family considerations include expected item`,
      includesAll(
        familyProfile.considerations,
        expected.familyConsiderationsInclude || []
      )
    );
  }

  if (expected?.cityHeadlineIncludes && cityProfile) {
    assert(
      `${slug} city headline matches`,
      cityProfile.headline.includes(expected.cityHeadlineIncludes)
    );
    assert(
      `${slug} city why-it-fits includes expected bullets`,
      includesAll(cityProfile.whyItFits, expected.cityWhyIncludes || [])
    );
    assert(
      `${slug} city considerations include expected item`,
      includesAll(
        cityProfile.considerations,
        expected.cityConsiderationsInclude || []
      )
    );
  }

  if (expected?.premiumHeadlineIncludes && premiumProfile) {
    assert(
      `${slug} premium headline matches`,
      premiumProfile.headline.includes(expected.premiumHeadlineIncludes)
    );
    assert(
      `${slug} premium why-it-fits includes expected bullets`,
      includesAll(premiumProfile.whyItFits, expected.premiumWhyIncludes || [])
    );
    assert(
      `${slug} premium considerations include expected item`,
      includesAll(
        premiumProfile.considerations,
        expected.premiumConsiderationsInclude || []
      )
    );
  }

  const familyNarrative = getRecommendationNarrative(
    BUYER_ARCHETYPE_IDS.FAMILY_BUYER,
    slug
  );
  assert(`${slug} narrative registry still works`, familyNarrative != null);

  printList("Top fits:", titleList(bundle.topFits));
  printList("Secondary fits:", titleList(bundle.secondaryFits));
  printList("Weak fits:", titleList(bundle.weakFits));

  if (familyProfile) {
    console.log(`\nFamily Buyer headline: ${familyProfile.headline}`);
    console.log(`Family Buyer summary: ${familyProfile.summary}`);
    printList("Why it fits:", familyProfile.whyItFits);
    printList("Considerations:", familyProfile.considerations);
  }

  if (cityProfile) {
    console.log(`\nCity Commuter headline: ${cityProfile.headline}`);
    console.log(`City Commuter summary: ${cityProfile.summary}`);
    printList("Why it fits:", cityProfile.whyItFits);
    printList("Considerations:", cityProfile.considerations);
  }

  printList("\nWho should buy:", bundle.whoShouldBuy);
  printList("Who should look elsewhere:", bundle.whoShouldLookElsewhere);
  console.log(`\nPrimary recommendation: ${bundle.explanation.primaryRecommendation}`);
  printList("Supporting reasons:", bundle.explanation.supportingReasons);
  printList("Trade-offs:", bundle.explanation.tradeOffs);
  console.log(`Confidence statement: ${bundle.explanation.confidenceStatement}`);
}

console.log(`\nRecommendation smoke: ${failed === 0 ? "PASS" : "FAIL"}`);
process.exit(failed === 0 ? 0 : 1);
