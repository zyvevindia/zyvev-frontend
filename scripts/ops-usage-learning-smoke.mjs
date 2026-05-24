/**
 * Smoke: ops usage-learning modules (Node-safe — no Vite/browser-only import graph).
 * npm run ops:usage-learning-smoke
 */

import "./lib/bootstrapEnv.mjs";

import { feedbackOpsPriorityScore, normalizeFeedbackCategoryId } from "../src/ops/feedbackTaxonomy.js";
import { summarizeUsageLearningBuffer } from "../src/ops/usageLearningBuffer.js";
import { summarizeOemQueue } from "../src/ops/oemUpdateQueue.js";

const empty = summarizeUsageLearningBuffer([]);
if (empty.total !== 0) {
  console.error("expected empty buffer summary");
  process.exit(1);
}

if (normalizeFeedbackCategoryId("wrong_data") !== "incorrect_ev_data") {
  process.exit(1);
}

if (feedbackOpsPriorityScore("incorrect_ev_data", "high") < 20) {
  console.error("priority score unexpectedly low");
  process.exit(1);
}

const oem = summarizeOemQueue();
if (typeof oem.total !== "number") {
  process.exit(1);
}

console.log("ops:usage-learning-smoke OK");
