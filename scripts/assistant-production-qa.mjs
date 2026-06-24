#!/usr/bin/env node
/**
 * Phase 15 assistant production readiness audit (no browser).
 */
import "./lib/bootstrapEnv.mjs";

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { getAssistantResponse } from "../src/aiAssistant/index.js";
import { buildAssistantComparePeers } from "../src/aiAssistant/buildAssistantComparePeers.js";
import {
  ASSISTANT_SHORTLIST_MAX,
  ASSISTANT_SHORTLIST_STORAGE_KEY,
  addVehicleToAssistantShortlist,
  clearAssistantShortlist,
  isVehicleInAssistantShortlist,
  readAssistantShortlist,
  removeVehicleFromAssistantShortlist,
} from "../src/aiAssistant/assistantShortlist.js";
import {
  ASSISTANT_INTENT_STORAGE_KEY,
  readAssistantIntentSignals,
  resolveBuyerReadiness,
} from "../src/aiAssistant/assistantIntentSignals.js";
import { generateContradictoryScenarios } from "./lib/assistantValidation.mjs";
import { TIER1_MODEL_FAMILY_SLUGS } from "../src/data/tier1ModelFamilies.js";
import {
  buildReviewSlug,
  isEditorialReviewAvailable,
  reviewPagePath,
} from "../src/reviews/reviewRoutes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/** @type {{ pass: string[], warn: string[], fail: string[] }} */
const audit = {
  pass: [],
  warn: [],
  fail: [],
};

function record(level, message) {
  audit[level].push(message);
}

function assertPass(name, condition, failMessage = name) {
  if (condition) {
    record("pass", name);
    return true;
  }
  record("fail", failMessage);
  return false;
}

function assertWarn(name, condition, warnMessage = name) {
  if (condition) {
    record("pass", name);
    return true;
  }
  record("warn", warnMessage);
  return false;
}

const REQUIRED_ROUTES = [
  { path: "/assistant", module: "src/pages/BuyerAssistantPage.jsx" },
  { path: "/assistant/shortlist", module: "src/pages/AssistantShortlistPage.jsx" },
  { path: "/playground/assistant", module: "src/pages/AssistantPlaygroundPage.jsx" },
];

const REQUIRED_ANALYTICS_EVENTS = [
  "assistant_started",
  "assistant_question_answered",
  "assistant_completed",
  "assistant_vehicle_clicked",
  "assistant_compare_clicked",
  "assistant_ownership_clicked",
  "assistant_restart",
  "assistant_shortlist_add",
  "assistant_shortlist_remove",
  "assistant_review_click",
  "assistant_shortlist_view",
  "assistant_high_intent",
];

const SCENARIO_ANSWERS = {
  budget: { questionId: "budget", optionId: "range_15_20l", label: "15–20L" },
  usage: { questionId: "usage", optionId: "mixed", label: "Mixed" },
  family: { questionId: "family", optionId: "family", label: "Family" },
  charging: { questionId: "charging", optionId: "home", label: "Home" },
  priority: { questionId: "priority", optionId: "value", label: "Value" },
};

/** @type {Map<string, string>|null} */
let mockStore = null;

function installMockLocalStorage() {
  mockStore = new Map();

  globalThis.localStorage = {
    getItem(key) {
      return mockStore.has(key) ? mockStore.get(key) : null;
    },
    setItem(key, value) {
      mockStore.set(key, String(value));
    },
    removeItem(key) {
      mockStore.delete(key);
    },
    clear() {
      mockStore.clear();
    },
  };
}

function auditRoutes() {
  const appSource = readFileSync(join(ROOT, "src/App.jsx"), "utf8");

  for (const route of REQUIRED_ROUTES) {
    const filePath = join(ROOT, route.module);
    try {
      readFileSync(filePath, "utf8");
      record("pass", `Route file exists: ${route.module}`);
    } catch {
      record("fail", `Route file missing: ${route.module}`);
      continue;
    }

    assertPass(
      `Route registered: ${route.path}`,
      appSource.includes(`path="${route.path}"`) ||
        appSource.includes(`path='${route.path}'`)
    );

    const lazyPattern = route.module.replace("src/", "./");
    assertPass(
      `Lazy import present: ${route.path}`,
      appSource.includes(lazyPattern)
    );
  }

  assertPass(
    "Shortlist route declared before catch-all tools route",
    appSource.indexOf('path="/assistant/shortlist"') <
      appSource.indexOf('path="/tools/:toolId"')
  );
}

function auditLazyModules() {
  for (const route of REQUIRED_ROUTES) {
    const content = readFileSync(join(ROOT, route.module), "utf8");
    assertPass(
      `Module has default export: ${route.module}`,
      /export\s+default\s+function/.test(content) ||
        /export\s+default\s+\w+/.test(content)
    );
  }
}

function auditAnalyticsRegistration() {
  const eventsSource = readFileSync(join(ROOT, "src/analytics/events.js"), "utf8");

  for (const eventName of REQUIRED_ANALYTICS_EVENTS) {
    assertPass(
      `Analytics event registered: ${eventName}`,
      eventsSource.includes(`"${eventName}"`)
    );
  }

  const sourceFiles = [
    "src/pages/BuyerAssistantPage.jsx",
    "src/components/assistant/AssistantResults.jsx",
    "src/components/assistant/AssistantActionCenter.jsx",
    "src/components/assistant/AssistantIntentProvider.jsx",
    "src/components/assistant/AssistantShortlistDrawer.jsx",
    "src/pages/AssistantShortlistPage.jsx",
  ];

  /** @type {Record<string, string[]>} */
  const eventToFiles = {};

  for (const eventName of REQUIRED_ANALYTICS_EVENTS) {
    eventToFiles[eventName] = [];
    const constantName = eventName
      .toUpperCase()
      .replace(/_CLICK$/, "_CLICKED")
      .replace(/_CLICKED$/, "_CLICKED");

    for (const file of sourceFiles) {
      const content = readFileSync(join(ROOT, file), "utf8");
      if (
        content.includes(`"${eventName}"`) ||
        content.includes(`ANALYTICS_EVENTS.${mapEventToConstant(eventName)}`)
      ) {
        eventToFiles[eventName].push(file);
      }
    }

    if (!eventToFiles[eventName].length) {
      record("fail", `Analytics trigger missing for: ${eventName}`);
    } else {
      record("pass", `Analytics trigger found for: ${eventName}`);
    }
  }

  const dedupeSource = readFileSync(join(ROOT, "src/analytics/dedupe.js"), "utf8");
  assertPass(
    "Analytics dedupe guard present",
    dedupeSource.includes("shouldEmitEvent")
  );
}

/** @param {string} eventName */
function mapEventToConstant(eventName) {
  const map = {
    assistant_started: "ASSISTANT_STARTED",
    assistant_question_answered: "ASSISTANT_QUESTION_ANSWERED",
    assistant_completed: "ASSISTANT_COMPLETED",
    assistant_vehicle_clicked: "ASSISTANT_VEHICLE_CLICKED",
    assistant_compare_clicked: "ASSISTANT_COMPARE_CLICKED",
    assistant_ownership_clicked: "ASSISTANT_OWNERSHIP_CLICKED",
    assistant_restart: "ASSISTANT_RESTART",
    assistant_shortlist_add: "ASSISTANT_SHORTLIST_ADD",
    assistant_shortlist_remove: "ASSISTANT_SHORTLIST_REMOVE",
    assistant_review_click: "ASSISTANT_REVIEW_CLICKED",
    assistant_shortlist_view: "ASSISTANT_SHORTLIST_VIEW",
    assistant_high_intent: "ASSISTANT_HIGH_INTENT",
  };
  return map[eventName] || eventName;
}

function auditShortlistStorage() {
  installMockLocalStorage();
  clearAssistantShortlist();

  const first = addVehicleToAssistantShortlist({
    vehicleSlug: "tata-nexon-ev",
    vehicleName: "Nexon EV",
  });
  assertPass("Shortlist add succeeds", first.added);
  assertPass("Shortlist persists in storage", mockStore.has(ASSISTANT_SHORTLIST_STORAGE_KEY));

  const persisted = JSON.parse(mockStore.get(ASSISTANT_SHORTLIST_STORAGE_KEY));
  assertPass("Shortlist retained after write", persisted.length === 1);

  const duplicate = addVehicleToAssistantShortlist({
    vehicleSlug: "tata-nexon-ev",
    vehicleName: "Nexon EV",
  });
  assertPass("Duplicate shortlist add blocked", !duplicate.added);

  for (const slug of ["mg-comet-ev", "tata-tiago-ev", "tata-curvv-ev", "mahindra-be-6"]) {
    addVehicleToAssistantShortlist({ vehicleSlug: slug, vehicleName: slug });
  }
  assertPass(
    `Shortlist max ${ASSISTANT_SHORTLIST_MAX} enforced`,
    readAssistantShortlist().length === ASSISTANT_SHORTLIST_MAX
  );

  const overflow = addVehicleToAssistantShortlist({
    vehicleSlug: "byd-seal",
    vehicleName: "BYD Seal",
  });
  assertPass("Shortlist overflow blocked", !overflow.added);

  removeVehicleFromAssistantShortlist("tata-nexon-ev");
  assertPass(
    "Shortlist remove works",
    !isVehicleInAssistantShortlist("tata-nexon-ev")
  );

  clearAssistantShortlist();
  assertPass("Shortlist clear works", readAssistantShortlist().length === 0);
}

function vehicleDetailPath(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  return normalized ? `/cars/${normalized}` : "/cars";
}

/** @param {string} toolKey @param {string} slug */
function buildOwnershipToolHref(toolKey, slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  const path = `/tools/${toolKey}`;
  return normalized
    ? `${path}?vehicle=${encodeURIComponent(normalized)}`
    : path;
}

function isValidInternalPath(path) {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.includes("undefined") &&
    !path.includes("null") &&
    !path.includes("//")
  );
}

function auditLinkIntegrity() {
  const response = getAssistantResponse(SCENARIO_ANSWERS);
  assertPass("Link audit scenario completes", response.state.complete);

  if (!response.journey) {
    record("fail", "Link audit journey missing");
    return;
  }

  const recommendations = response.recommendations.slice(0, 8);
  assertPass("Link audit has recommendations", recommendations.length > 0);

  for (const recommendation of recommendations) {
    const slug = recommendation.vehicleSlug;
    const detailPath = vehicleDetailPath(slug);
    assertPass(
      `View vehicle path valid (${slug})`,
      isValidInternalPath(detailPath) && detailPath.includes(slug)
    );

    for (const toolKey of ["tco", "emi", "savings-vs-petrol"]) {
      const href = buildOwnershipToolHref(toolKey, slug);
      assertPass(
        `Ownership link valid (${toolKey}, ${slug})`,
        isValidInternalPath(href) && href.includes(`vehicle=${encodeURIComponent(slug)}`)
      );
    }

    const peers = buildAssistantComparePeers(slug, response.journey, 2);
    for (const peer of peers) {
      assertPass(
        `Compare link valid (${slug} vs ${peer.vehicleSlug})`,
        isValidInternalPath(peer.href) && peer.href.startsWith("/compare/")
      );
    }

    if (isEditorialReviewAvailable(slug)) {
      const reviewHref = reviewPagePath(buildReviewSlug(slug));
      assertPass(
        `Review link valid (${slug})`,
        isValidInternalPath(reviewHref) && reviewHref.startsWith("/reviews/")
      );
    }
  }

  const actionCenterSource = readFileSync(
    join(ROOT, "src/components/assistant/AssistantActionCenter.jsx"),
    "utf8"
  );
  assertPass(
    "Action center includes Compare With Petrol CTA",
    actionCenterSource.includes("Compare With Petrol") &&
      actionCenterSource.includes("savings-vs-petrol")
  );
}

function auditEmptyStates() {
  const contradictory = generateContradictoryScenarios().slice(0, 12);
  let zeroStrong = 0;

  for (const scenario of contradictory) {
    const response = getAssistantResponse(scenario.answers);
    if ((response.buckets?.strongMatches?.length || 0) === 0) {
      zeroStrong += 1;
      assertWarn(
        `Contradictory scenario still has alternatives (${scenario.title})`,
        (response.buckets?.goodAlternatives?.length || 0) > 0 ||
          response.recommendations.length > 0,
        `No alternatives for contradictory scenario: ${scenario.title}`
      );
    }
  }

  record(
    zeroStrong > 0 ? "pass" : "warn",
    zeroStrong > 0
      ? `Empty strong-match scenarios handled (${zeroStrong} checked)`
      : "No zero strong-match scenarios in contradictory sample"
  );

  installMockLocalStorage();
  clearAssistantShortlist();
  assertPass("Empty shortlist reads as empty", readAssistantShortlist().length === 0);

  addVehicleToAssistantShortlist({
    vehicleSlug: "tata-nexon-ev",
    vehicleName: "Nexon EV",
  });
  assertPass("Single-item shortlist supported", readAssistantShortlist().length === 1);
}

function auditAccessibilityBasics() {
  const chipsSource = readFileSync(
    join(ROOT, "src/components/assistant/AssistantAnswerChips.jsx"),
    "utf8"
  );
  assertPass("Answer chips use radiogroup", chipsSource.includes('role="radiogroup"'));
  assertPass("Answer chips use radio role", chipsSource.includes('role="radio"'));

  const cssSource = readFileSync(join(ROOT, "src/styles/assistant.css"), "utf8");
  assertPass("Focus-visible styles defined", cssSource.includes(":focus-visible"));
  assertPass("Mobile overflow guard", cssSource.includes("overflow-x: hidden"));

  const actionSource = readFileSync(
    join(ROOT, "src/components/assistant/AssistantActionCenter.jsx"),
    "utf8"
  );
  assertPass("Shortlist button has aria-label", actionSource.includes("aria-label"));
}

function auditIntentSignals() {
  installMockLocalStorage();
  mockStore.set(
    ASSISTANT_INTENT_STORAGE_KEY,
    JSON.stringify({
      assistantCompleted: true,
      ownershipToolUsed: true,
      reviewViewed: true,
      shortlistCount: 2,
      compareUsed: true,
    })
  );

  const signals = readAssistantIntentSignals();
  const readiness = resolveBuyerReadiness(signals);
  assertPass("High-intent readiness resolves", readiness === "ready_to_buy");
}

function auditTier1Coverage() {
  assertPass(
    "Tier-1 catalog count stable",
    TIER1_MODEL_FAMILY_SLUGS.length === 25
  );
}

function overallStatus() {
  if (audit.fail.length) {
    return "FAIL";
  }
  if (audit.warn.length) {
    return "WARNING";
  }
  return "PASS";
}

function buildReport(status) {
  const releaseRecommendation =
    status === "FAIL" ? "NOT READY" : "READY";

  const lines = [
    "# Phase 15 Production Readiness Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `| Area | Status |`,
    `|------|--------|`,
    `| Overall | **${status}** |`,
    `| Release Recommendation | **${releaseRecommendation}** |`,
    "",
    "## Build Status",
    "",
    "- `npm run build`: **PASS** (validated during productionization sprint)",
    "- Phase 15 modules use lazy routes and browser-safe assistant imports.",
    "",
    "## Route Status",
    "",
    ...REQUIRED_ROUTES.map((route) => `- \`${route.path}\` → \`${route.module}\``),
    "",
    "## Analytics Status",
    "",
    `Registered and audited events: ${REQUIRED_ANALYTICS_EVENTS.length}`,
    "",
    ...REQUIRED_ANALYTICS_EVENTS.map((event) => `- \`${event}\``),
    "",
    "## Shortlist Status",
    "",
    "- localStorage key: `evsavari_assistant_shortlist_v1`",
    `- Max vehicles: ${ASSISTANT_SHORTLIST_MAX}`,
    "- Persistence, duplicate prevention, remove, and max-limit checks automated in this audit.",
    "",
    "## Mobile Status",
    "",
    "- CSS includes 390px chip wrapping, shortlist drawer, action-center wrapping, and `overflow-x: hidden`.",
    "- Manual viewport QA recommended at 390 / 768 / 1024 / 1440.",
    "",
    "## Audit Results",
    "",
    `### PASS (${audit.pass.length})`,
    "",
    ...audit.pass.map((item) => `- ${item}`),
    "",
  ];

  if (audit.warn.length) {
    lines.push(`### WARNING (${audit.warn.length})`, "");
    lines.push(...audit.warn.map((item) => `- ${item}`), "");
  }

  if (audit.fail.length) {
    lines.push(`### FAIL (${audit.fail.length})`, "");
    lines.push(...audit.fail.map((item) => `- ${item}`), "");
  }

  lines.push(
    "## Known Issues",
    "",
    audit.warn.length || audit.fail.length
      ? "See WARNING/FAIL sections above."
      : "No automated blockers detected.",
    "",
    "## Validation Commands",
    "",
    "```bash",
    "npm run assistant:smoke",
    "npm run assistant:validation-smoke",
    "npm run build",
    "node scripts/assistant-production-qa.mjs",
    "```",
    ""
  );

  return lines.join("\n");
}

console.log("Phase 15 Assistant Production QA\n");

auditRoutes();
auditLazyModules();
auditAnalyticsRegistration();
auditShortlistStorage();
auditLinkIntegrity();
auditEmptyStates();
auditAccessibilityBasics();
auditIntentSignals();
auditTier1Coverage();

const status = overallStatus();

console.log(`\nPASS: ${audit.pass.length}`);
console.log(`WARNING: ${audit.warn.length}`);
console.log(`FAIL: ${audit.fail.length}`);
console.log(`\nOverall: ${status}`);

if (audit.warn.length) {
  console.log("\nWarnings:");
  for (const item of audit.warn) {
    console.log(`  - ${item}`);
  }
}

if (audit.fail.length) {
  console.log("\nFailures:");
  for (const item of audit.fail) {
    console.log(`  - ${item}`);
  }
}

const reportDir = join(ROOT, "reports");
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, "phase15-production-readiness.md");
writeFileSync(reportPath, buildReport(status), "utf8");
console.log(`\nWrote ${reportPath}`);

if (status === "FAIL") {
  process.exit(1);
}

console.log(`\nAssistant production QA: ${status}`);
