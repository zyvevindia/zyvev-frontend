# Visual Regression Testing

Automated screenshot comparison for EVSavari public pages using Playwright's native `toHaveScreenshot` API. Visual tests run as a mandatory quality gate in CI alongside functional Playwright tests.

## Authoritative environment: Linux CI

**Linux GitHub Actions is the canonical environment for visual regression.**

| Environment | Role |
|-------------|------|
| **Linux CI** (`ubuntu-latest`) | Generates committed baselines; determines pass/fail |
| **Windows / macOS (local)** | Developer convenience only — results are not authoritative |

Committed baseline PNGs must be generated on Linux (via the **Visual Linux baselines** workflow or a Linux machine). Do not commit Windows-generated PNGs as production baselines — font and subpixel rendering differ from Linux CI.

**CI pass/fail:** `.github/workflows/ci.yml` runs the full 168-test visual matrix on Linux. Local Windows runs skip WebKit and may differ from CI for catalog-heavy pages.

## Purpose

Detect unintended UI changes (layout shifts, styling regressions, broken components) across browsers and viewports before release — without modifying product code or design.

## Architecture

```
tests/
  visual/
    public-pages.spec.js            # Snapshot specs
    public-pages.spec.js-snapshots/ # Baseline PNGs (committed)
  helpers/
    catalogApiStub.js               # Catalog API stub (shared with functional E2E)
    visualPages.js                  # Route manifest
    visualHelpers.js                # Stabilization, waits, masks (visual tests only)
  fixtures.js                       # Functional E2E fixture (auto-installs catalog stub)
scripts/
  run-visual-playwright.mjs         # Visual test runner
playwright.config.js                # Visual + functional projects
```

### Viewports and browsers

| Project suffix | Viewport | Touch |
|----------------|----------|-------|
| `desktop` | 1440×900 | No |
| `laptop` | 1280×800 | No |
| `tablet` | 820×1180 | Yes |
| `mobile` | 390×844 | Yes |

Each viewport runs on Chromium, Firefox, and WebKit (`visual-{viewport}-{browser}`).

### Snapshot naming

`{page-id}-{device}-{browser}.png` — e.g. `home-desktop-chromium.png`, `compare-mobile-firefox.png`.

### Stabilization (test-only)

`visualHelpers.js` is imported only by `tests/visual/`. It never ships in the production bundle.

Before each screenshot:

- Stub catalog API probes so vehicle detail pages load from bundled golden data (no live backend)
- Dismiss the soft-launch banner via `sessionStorage`
- Disable CSS animations, transitions, and caret blink (injected style tag)
- Wait for fonts, images, network idle, and page-ready selectors
- Reset scroll to top

### Masks (unstable UI only)

Default masks hide loading/transient UI — not business content:

| Selector | Reason |
|----------|--------|
| `.soft-launch-banner` | Dismissible launch banner |
| `.car-card-skeleton`, `.skeleton` | Loading placeholders |
| `[aria-busy='true']` | In-flight async regions |
| `img[loading='lazy']:not([complete])` | Incomplete lazy images |

Do **not** mask prices, vehicle cards, Score 2.0, compare tables, CTAs, assistant UI, or specifications.

## Workflow

### Production baseline bootstrap (Linux — required once)

Replace any Windows-generated PNGs with Linux-canonical baselines:

1. GitHub → **Actions** → **Visual Linux baselines** → **Run workflow**
2. Wait for green (generates 168 PNGs, validates, runs full suite)
3. Download artifact **linux-visual-snapshots**
4. Replace all files in `tests/visual/public-pages.spec.js-snapshots/`
5. Commit and push:

```bash
git add tests/visual/public-pages.spec.js-snapshots/*.png
git commit -m "Add Linux-canonical visual regression baselines (168 PNGs)"
```

Verify inventory locally (counts only; not pass/fail):

```bash
npm run test:visual:verify:strict
```

### Run visual regression locally (convenience only)

```bash
npm run build
npm run test:visual
```

Reuses an existing preview server on port 5173 when available. On Windows, WebKit projects are skipped automatically.

**Local results do not determine production readiness — Linux CI does.**

### Update baselines after intentional UI changes

On **Linux** (or via the Visual Linux baselines workflow):

```bash
npm run build
CI=1 PLAYWRIGHT_SKIP_BUILD=1 npm run test:visual:update
```

On Windows (Chromium + Firefox only — not for committing production baselines):

```bash
npm run test:visual:update
```

### Reviewing failures

1. Open the HTML report: `npx playwright show-report`
2. Or inspect `test-results/` — each failure includes `-expected.png`, `-actual.png`, and `-diff.png`
3. Decide:
   - **Bug** → fix the UI regression
   - **Intentional** → `npm run test:visual:update` and commit new baselines

## CI behaviour

`.github/workflows/ci.yml` runs in order:

1. `npm run build` (`VITE_API_URL=https://evsavari-api.onrender.com`)
2. Post-launch smoke + ingestion smoke
3. `npx playwright install --with-deps chromium firefox webkit`
4. `npm run test:e2e` (functional only — catalog API stub via `tests/fixtures.js`)
5. `node scripts/verify-visual-baselines.mjs --require-webkit` (168 PNGs required)
6. `npm run test:visual` (168 snapshot comparisons on Linux)

Job timeout: **120 minutes**. On failure, `playwright-report/` and `test-results/` artifacts are uploaded.

See [playwright-ci-pipeline.md](./playwright-ci-pipeline.md) for environment variables and backend stub architecture.

## Test matrix

| Metric | Value |
|--------|-------|
| Public pages | 14 |
| Viewports | 4 (desktop, laptop, tablet, mobile) |
| Browsers | 3 (Chromium, Firefox, WebKit) |
| **Total visual tests** | **168** |
| **Total baseline PNGs** | **168** |
| PNGs per browser | 56 |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Executable doesn't exist` for WebKit on Windows | Use the GitHub Actions workflow or Linux/macOS |
| Vehicle detail shows load error | Visual tests stub the catalog API automatically; ensure `PLAYWRIGHT_SKIP_BUILD=1` after `npm run build` |
| Port 5173 in use | Stop `npm run dev` or let Playwright reuse the preview server locally |
| Flaky listing/search screenshots | Re-run once; if persistent, check for new dynamic UI and add a **loading-only** mask |
| Font rendering diffs across OS | Regenerate baselines on Linux via Visual Linux baselines workflow |

## Best practices

- Do **not** change production UI to satisfy tests — stabilize in helpers only
- Add new public routes to `visualPages.js` when shipping user-facing pages
- Prefer full-page snapshots; use clipped snapshots only when a region is unstable
- Run `npm run test:e2e` after visual changes to confirm functional tests still pass

## Pages covered

Home, EV Listing (`/cars`), Vehicle Details, Compare, Buyer Assistant, Search, Budget EVs, Upcoming EVs, Guides Hub, About, Contact, Privacy, Terms, 404.
