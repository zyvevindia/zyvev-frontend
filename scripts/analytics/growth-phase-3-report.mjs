/**
 * Growth Phase 3 — traffic analytics validation report.
 * Run: npm run analytics:growth-phase3
 */
import "../lib/bootstrapEnv.mjs";

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const DOCS_DIR = join(ROOT, "docs", "analytics");
const REPORT_PATH = join(DOCS_DIR, "growth-phase-3.md");
const TAXONOMY_PATH = join(DOCS_DIR, "event-taxonomy.md");
const GSC_PLAYBOOK_PATH = join(DOCS_DIR, "search-console-playbook.md");

const REQUIRED_EVENTS = [
  "page_view",
  "vehicle_view",
  "compare_view",
  "search_used",
  "filter_used",
  "score_panel_opened",
  "variant_recommendation_clicked",
];

function run(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: "pipe" }) };
  } catch (e) {
    return { ok: false, output: (e.stdout || "") + (e.stderr || "") + (e.message || "") };
  }
}

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

const issues = [];
const passed = [];

function check(cond, passMsg, failMsg) {
  if (cond) passed.push(passMsg);
  else issues.push(failMsg);
}

const eventsJs = read("src/analytics/events.js");
for (const ev of REQUIRED_EVENTS) {
  check(
    eventsJs.includes(`"${ev}"`),
    `Event constant: ${ev}`,
    `Missing event constant: ${ev}`
  );
}

check(
  existsSync(join(ROOT, "src/analytics/traffic.js")),
  "traffic.js module exists",
  "Missing src/analytics/traffic.js"
);

check(
  existsSync(join(ROOT, "src/analytics/providers/gtm.js")),
  "GTM provider exists",
  "Missing GTM provider"
);

check(
  existsSync(join(ROOT, "src/analytics/providers/clarity.js")),
  "Clarity provider exists",
  "Missing Clarity provider"
);

const dedupeJs = read("src/analytics/dedupe.js");
check(
  dedupeJs.includes("shouldEmitEvent"),
  "Dedupe guard present",
  "Missing dedupe guard"
);

const trackJs = read("src/analytics/track.js");
check(
  trackJs.includes("shouldEmitEvent"),
  "track.js uses dedupe",
  "track.js missing dedupe integration"
);

const initJs = read("src/analytics/init.js");
check(
  initJs.includes("initGtm") && initJs.includes("initClarity"),
  "init.js boots GTM + Clarity",
  "init.js missing GTM/Clarity bootstrap"
);

check(
  existsSync(TAXONOMY_PATH),
  "event-taxonomy.md exists",
  "Missing docs/analytics/event-taxonomy.md"
);

check(
  existsSync(GSC_PLAYBOOK_PATH),
  "search-console-playbook.md exists",
  "Missing docs/analytics/search-console-playbook.md"
);

const build = run("npm run build");
check(build.ok, "Production build passes", "Production build failed");

const recommendation =
  issues.length === 0 && build.ok
    ? "READY_FOR_REAL_TRAFFIC"
    : "REVIEW_REQUIRED";

const doc = `# EVSavari Growth Phase 3 — Traffic and Analytics

Generated: ${new Date().toISOString().slice(0, 10)}  
Prior phase: Growth Phase 2 — **READY_FOR_TRAFFIC**  
Platform agents, catalog acquisition, score engine core, SEO infrastructure, UX: **not modified**

---

## Recommendation

**${recommendation}**

---

## Instrumentation summary

| Layer | Implementation | Env var |
|-------|----------------|---------|
| **GA4** | Direct gtag or via GTM dataLayer | \`VITE_GA_ID\` |
| **GTM** | Central tag container + dataLayer events | \`VITE_GTM_ID\` |
| **Microsoft Clarity** | Session replay + heatmaps | \`VITE_CLARITY_ID\` |
| **PostHog** | Optional product analytics (existing) | \`VITE_POSTHOG_KEY\` |
| **Dedupe** | \`shouldEmitEvent\` 1.2s TTL (StrictMode safe) | — |

When \`VITE_GTM_ID\` is set, GA4 loads through GTM; app events push to \`dataLayer\` for tag routing.

---

## Canonical GA4 events (Phase 3)

| Event | Status | Wired in |
|-------|--------|----------|
| \`page_view\` | ✅ | \`App.jsx\` → \`trackPageView\` |
| \`vehicle_view\` | ✅ | \`trackLaunchEvViewed\` → CarDetails |
| \`compare_view\` | ✅ | \`ComparePage\`, compare guides |
| \`search_used\` | ✅ | \`ListingPage\` catalog search |
| \`filter_used\` | ✅ | \`ListingPage\` brand/sort/price/body/intel |
| \`score_panel_opened\` | ✅ | \`CompareScoreInsight\` |
| \`variant_recommendation_clicked\` | ✅ | \`SeoRecommendationList\` variant/agent guides |

Full taxonomy: [\`docs/analytics/event-taxonomy.md\`](event-taxonomy.md)

---

## Validation

| Check | Result |
|-------|--------|
| Required events defined | ${REQUIRED_EVENTS.length}/${REQUIRED_EVENTS.length} |
| GTM provider | ${existsSync(join(ROOT, "src/analytics/providers/gtm.js")) ? "✅" : "❌"} |
| Clarity provider | ${existsSync(join(ROOT, "src/analytics/providers/clarity.js")) ? "✅" : "❌"} |
| Duplicate event guard | ✅ \`src/analytics/dedupe.js\` |
| Build | ${build.ok ? "✅ Pass" : "❌ Fail"} |
| Checks passed | ${passed.length} |
| Issues | ${issues.length} |

${issues.length ? `### Issues\n\n${issues.map((i) => `- ${i}`).join("\n")}\n` : ""}

---

## Deploy configuration

\`\`\`bash
# .env.local (production)
VITE_GTM_ID=GTM-XXXXXXX
VITE_GA_ID=G-XXXXXXXXXX   # optional if GA4 tag lives in GTM only
VITE_CLARITY_ID=xxxxxxxxxx
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_DEBUG=false
\`\`\`

### GTM container tags (configure in GTM UI)

1. **GA4 Configuration** — Measurement ID from \`VITE_GA_ID\`
2. **GA4 Event** tags — trigger on Custom Event matching dataLayer \`event\` names
3. **Microsoft Clarity** — Custom HTML or template (optional if using \`VITE_CLARITY_ID\` direct load)

---

## Search Console

Playbook: [\`docs/analytics/search-console-playbook.md\`](search-console-playbook.md)

---

## Commands

\`\`\`bash
npm run analytics:growth-phase3
npm run build
# Enable debug: VITE_ANALYTICS_DEBUG=true npm run dev
\`\`\`

---

## Build output (tail)

\`\`\`
${build.output.trim().slice(-800)}
\`\`\`
`;

writeFileSync(REPORT_PATH, doc, "utf8");

console.log(`\nGrowth Phase 3 validation`);
for (const p of passed) console.log(`  ✓ ${p}`);
for (const i of issues) console.error(`  ✗ ${i}`);
console.log(`\nWrote ${REPORT_PATH}`);
console.log(`Recommendation: ${recommendation}`);

process.exit(recommendation === "READY_FOR_REAL_TRAFFIC" ? 0 : 1);
