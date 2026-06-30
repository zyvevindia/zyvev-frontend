# Playwright CI & E2E Pipeline

Production-quality guide for running functional and visual Playwright tests locally and in GitHub Actions. No product code changes — test infrastructure only.

## Authoritative environment

| Concern | Authoritative | Convenience only |
|---------|---------------|------------------|
| Visual regression pass/fail | **Linux GitHub Actions** (`ci.yml`) | Windows / macOS local runs |
| Baseline PNG commits | **Linux-generated** (168 PNGs) | Windows PNGs must not be used for production |
| Functional E2E (98 tests) | Linux CI | Windows (skip WebKit + iPhone projects) |

**CI determines production readiness for visual regression.** Local Windows execution is useful for debugging but is not authoritative.

## Pipeline overview

```
Install (npm ci)
  → Production build (VITE_API_URL set in CI)
  → Post-launch smoke + ingestion smoke
  → Playwright browser install (chromium, firefox, webkit)
  → Functional E2E (test:e2e)
  → Visual baseline inventory check (`--require-webkit`, 168 PNGs)
  → Visual regression (test:visual, 168 tests on Linux)
  → Artifact upload on failure
```

Defined in `.github/workflows/ci.yml` (timeout: **120 minutes**).

## Environment variables

| Variable | Required | CI value | Local default | Purpose |
|----------|----------|----------|---------------|---------|
| `CI` | CI only | `1` | unset | Enables `forbidOnly`, retries, single worker, fresh preview server |
| `PLAYWRIGHT_SKIP_BUILD` | After build | `1` | unset | Skips duplicate build in `global-setup.mjs` |
| `PLAYWRIGHT_VISUAL` | Visual runs | `1` (auto) | set by runner script | Enables visual projects and snapshot settings |
| `VITE_API_URL` | Build time | `https://evsavari-api.onrender.com` | `.env` → `http://localhost:5000` | Baked into preview bundle via Vite |
| `VITE_GA_ID` | E2E build | `G-E2ETEST` | optional | Analytics test id for assistant analytics specs |
| `VITE_ANALYTICS_DEBUG` | E2E build | `true` (global-setup) | optional | Enables analytics debug hooks in tests |

### Important assumptions

1. **No live backend required for E2E** — functional tests use `tests/fixtures.js`, which installs `installCatalogApiStub()` on every page. Catalog list probes return `{ cars: [] }` so vehicle detail pages load from bundled golden data (`tata-nexon-ev`, etc.).

2. **`.env` is not used in CI** — CI sets `VITE_API_URL` explicitly on `npm run build` so the preview bundle never bakes `localhost:5000`.

3. **Local dev with `.env`** — `VITE_API_URL=http://localhost:5000` is fine; the Playwright stub intercepts catalog probes regardless of baked URL.

4. **Preview server** — Playwright starts `npm run preview --port 5173`. Locally, an existing server on 5173 is reused (`reuseExistingServer: !CI`).

## Browser requirements

| Browser | Linux CI | macOS | Windows |
|---------|----------|-------|---------|
| Chromium | ✅ `npx playwright install chromium` | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| WebKit | ✅ | ✅ | ❌ Not available |
| iPhone 14 profile | WebKit engine | ✅ | ❌ Same as WebKit |

**Windows limitation:** `test:e2e` and `test:visual` include WebKit and `responsive-iphone-14` projects. On Windows, ~29 functional + ~56 visual tests fail with `Executable doesn't exist`. This is expected — full matrix validation runs on Linux CI only.

Install all browsers (Linux/macOS/CI):

```bash
npx playwright install --with-deps chromium firefox webkit
```

## NPM scripts

| Script | Scope | Notes |
|--------|-------|-------|
| `npm run test:e2e` | 7 functional projects, 98 tests | Excludes visual specs |
| `npm run test:visual` | 12 visual projects, 168 tests | Chromium + Firefox + WebKit |
| `npm run test:visual:update` | Regenerate chromium + firefox baselines | Review git diff before commit |
| `npm run test:visual:update:webkit` | Regenerate webkit baselines only | Linux/macOS or GitHub Actions |
| `npm run test:visual:verify` | Inventory check | Warns if WebKit incomplete |
| `npm run test:visual:verify:strict` | Strict inventory | Fails unless 168 PNGs present |

## Functional test architecture

```
tests/
  fixtures.js                    # Extends page with catalog API stub
  helpers/
    catalogApiStub.js              # Shared stub (functional + visual)
    visualHelpers.js               # Visual-only stabilization (imports stub)
  global-setup.mjs               # Build with analytics test env
```

All functional specs import `{ test, expect }` from `../fixtures.js` (not `@playwright/test` directly).

### Catalog-dependent tests (previously 8 failures)

These tests navigate to `/cars/tata-nexon-ev` or ownership/review flows:

- `tests/journeys/vehicle-review-ownership.spec.js`
- `tests/ownership/ownership-links.spec.js`
- `tests/responsive/responsive-score2.spec.js`
- `tests/responsive/responsive-ownership.spec.js`
- (and cross-browser duplicates)

**Root cause:** `CarDetails` probes `${API_URL}/cars?limit=1` before golden fallback. Without backend or stub, probe fails → "Could not load this vehicle".

**Solution:** `catalogApiStub.js` fulfills probes with HTTP 200 + empty catalog. Golden data loads deterministically. Tests still validate real UI rendering — stub only replaces unreachable network calls.

## Visual regression

See [visual-regression.md](./visual-regression.md) for snapshot naming, masks, and baseline update workflow.

### WebKit baseline bootstrap (one-time)

Playwright WebKit cannot run on Windows. After merging P1.4 framework:

1. GitHub → **Actions** → **Visual WebKit baselines** → **Run workflow**
2. Download **webkit-visual-snapshots** artifact (56 PNGs)
3. Copy into `tests/visual/public-pages.spec.js-snapshots/`
4. Commit: `git add tests/visual/public-pages.spec.js-snapshots/*webkit*.png`

The workflow verifies `--require-webkit` before uploading artifacts.

## Local reproduction (Linux/macOS)

```bash
npm ci
VITE_API_URL=https://evsavari-api.onrender.com VITE_GA_ID=G-E2ETEST npm run build
npx playwright install --with-deps chromium firefox webkit
CI=1 PLAYWRIGHT_SKIP_BUILD=1 npm run test:e2e
CI=1 PLAYWRIGHT_SKIP_BUILD=1 npm run test:visual
```

## Local reproduction (Windows)

```bash
npm ci
npm run build
npx playwright install chromium firefox
set CI=1&& set PLAYWRIGHT_SKIP_BUILD=1&& npm run test:e2e -- --project=chromium --project=firefox --project=responsive-desktop-chrome --project=responsive-pixel-7 --project=responsive-ipad-air
set PLAYWRIGHT_SKIP_BUILD=1&& npm run test:visual
```

Omit webkit and iphone-14 projects on Windows.

## GitHub Actions workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR, push to main/develop | Full build + smoke + E2E + **visual gate (168 tests)** |
| `visual-linux-baselines.yml` | Manual `workflow_dispatch` | **Canonical** — generate, validate, upload all 168 Linux PNGs |
| `visual-webkit-baselines.yml` | Manual `workflow_dispatch` | WebKit-only shortcut (prefer `visual-linux-baselines.yml`) |

### Linux baseline bootstrap (production)

1. Actions → **Visual Linux baselines** → Run workflow
2. Download **linux-visual-snapshots** artifact (168 PNGs)
3. Replace `tests/visual/public-pages.spec.js-snapshots/*.png`
4. Commit — CI visual gate should pass on next push

The workflow runs `test:visual:update`, strict inventory verify, and `test:visual` validation before uploading artifacts.

### CI artifacts on failure

- `playwright-report/` — HTML report
- `test-results/` — screenshots, traces, diff images

Retention: 14 days.

Playwright uses **zero retries** (`retries: 0`) — failures are not masked by automatic re-runs.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Vehicle detail shows load error in E2E | Spec imports `@playwright/test` directly | Use `tests/fixtures.js` |
| 37 failures on Windows | WebKit + iPhone projects | Run non-WebKit projects locally; trust Linux CI |
| Visual CI fails on webkit | Missing 56 baseline PNGs | Run WebKit bootstrap workflow |
| Port 5173 in use | Dev server running | Stop dev server or let Playwright reuse it locally |
| Build warns localhost API in prod | `.env` baked into build | Set `VITE_API_URL` explicitly when building for CI |

## Optional: live local API

For manual QA against a real catalog API (not required for Playwright):

```bash
# Terminal 1 — backend on port 5000
# Terminal 2
npm run dev
node scripts/check-local-api.mjs
```

Playwright tests do **not** require this when using `tests/fixtures.js`.
