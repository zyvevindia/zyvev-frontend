# Sprint 1.4 — Navigation & Product Simplification (EVSavari Lite)

**Sprint:** 1.4  
**Objective:** Public EVSavari behaves as a clean EV marketplace (EVSavari Lite) while Layer 2 platform capabilities remain preserved internally.

---

## Navigation Audit

### Header (Desktop & Mobile)

| Item | Path | Status |
|------|------|--------|
| Home | `/` | **ACTIVE** |
| Browse EVs | `/cars` | **ACTIVE** |
| Compare | `/compare` (dynamic tray destination) | **ACTIVE** |
| Guides | `/guides` | **ACTIVE** |
| Search | `/cars#catalog-search` | **ACTIVE** |
| Tools | `/tools` | **HIDDEN** (removed Sprint 1.3; route redirects Sprint 1.4) |
| Admin | `/admin` | **HIDDEN** (removed from nav Sprint 1.4; direct URL only) |

### Footer

| Section | Link | Status |
|---------|------|--------|
| Quick Links | Home, Browse EVs, Compare, Guides, Search | **ACTIVE** |
| Company | About, How EVSavari works, Contact, Privacy, Terms | **ACTIVE** |
| Social placeholders | (removed) | **DEPRECATED** — removed “coming soon” buttons |
| Dealer / Admin / Tools | — | **HIDDEN** — never present in footer |

### Side Navigation

No persistent side nav in EVSavari Lite. Admin and dealer shells retain their own internal navigation when accessed directly (**HIDDEN** from public).

---

## Route Inventory (Public Surface)

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Homepage | ACTIVE |
| `/cars`, `/popular`, `/latest`, `/upcoming`, `/bikes`, `/scooters` | Browse catalog | ACTIVE |
| `/cars/:slug` | Car details | ACTIVE |
| `/compare`, `/compare/:slug` | Compare + SEO compare guides | ACTIVE |
| `/guides`, `/discover/*`, `/best-evs/*` | Guides & EV intelligence | ACTIVE |
| `/charging-guides/*`, `/ownership-guides/*` | Guide content | ACTIVE |
| `/brands/*`, `/cities/*`, `/reviews/*`, `/trust/*` | Discovery & trust | ACTIVE |
| `/tools/emi`, `/tools/tco`, `/tools/cost-per-km`, `/tools/savings-vs-petrol` | Ownership calculators (contextual) | ACTIVE |
| `/ownership/:slug/*` | Vehicle-scoped ownership tools | ACTIVE |
| `/about`, `/contact`, `/privacy`, `/terms`, `/how-evsavari-works` | Company pages | ACTIVE |
| `/tools` | Tools hub | HIDDEN → redirects to `/cars` |
| `/ownership`, `/ownership/vehicles` | Ownership hubs | HIDDEN → redirects to `/cars` |
| `/assistant`, `/assistant/shortlist` | Buyer AI | HIDDEN → redirects to `/cars` |
| `/playground/*` | Internal playgrounds | HIDDEN → redirects to `/cars` |
| `/tools/:toolId` (unshipped) | Placeholder tools | DEPRECATED → redirects to `/cars` |
| `/login` | Staff login | HIDDEN (direct URL) |
| `/dealer/*` | Dealer portal | HIDDEN |
| `/admin/*` | Admin platform | HIDDEN (operational) |
| `/sales`, `/sales-analytics` | CRM / sales | HIDDEN (auth-gated) |

Full machine-readable inventory: `src/config/evsavariLite.js`

---

## Feature Inventory

### ACTIVE (Layer 1 — EVSavari Lite)

Homepage, Browse, Search, Compare, Car Details, EMI Calculator, Ownership Calculators, Lead Forms (Callback, Best Deal, Dealer Assistance), Guides, EV Intelligence discovery pages.

### HIDDEN (Layer 2 — Platform)

CRM, Dealer Dashboard, Dealer Portal, Sales Dashboard, Editorial Platform, Analytics, AI Modules, Admin, Tools Hub, Ownership Hub, Playgrounds, Staff Login public links.

### FUTURE

Dealer AI, OEM AI, Marketplace Automation, User Accounts, Wishlist, Saved Searches, Notifications, OTP.

### DEPRECATED

Tools nav entry, ownership tool placeholder pages, footer social “coming soon” buttons.

---

## Architecture Impact Assessment

| Area | Impact |
|------|--------|
| **Frontend** | Visibility-only: nav/footer cleanup, `LiteHiddenRedirect` on hub routes, `evsavariLite.js` boundary config. No folder moves. |
| **Backend** | None |
| **Database** | None |
| **Routing** | Same `App.jsx` route table; hidden hubs render redirect component instead of hub pages. All platform routes remain registered. |
| **API** | None |
| **Regression risk** | Low — Lite journeys unchanged; calculators and leads untouched. |
| **Future compatibility** | Platform modules (dealer, admin, AI, CRM) remain importable; re-exposure is a visibility change only. |

### Architectural Validation

- **Single Catalog Service** — unchanged  
- **Single Media Service** — unchanged  
- **Single Lead Service** — unchanged  
- **Single Routing Architecture** — unchanged (`App.jsx` + lazy routes)  
- **Single Component Ownership** — unchanged  
- **No duplicate implementations** — confirmed  

---

## Files Changed (Sprint 1.4)

- `src/config/evsavariLite.js` — Lite boundary config & route inventory
- `src/components/LiteHiddenRedirect.jsx` — hidden route redirect
- `src/components/Navbar.jsx` — remove Admin from public nav
- `src/components/Footer.jsx` — remove social placeholder buttons
- `src/Login.jsx` — remove public dealer portal link
- `src/App.jsx` — hidden hub routes use `LiteHiddenRedirect`
- `src/pages/EmiCalculatorPage.jsx` — breadcrumb: Browse EVs (not Tools hub)
- `src/pages/TcoCalculatorPage.jsx` — breadcrumb: Browse EVs
- `src/pages/CostPerKmPage.jsx` — breadcrumb: Browse EVs
- `src/pages/PetrolSavingsPage.jsx` — breadcrumb: Browse EVs
- `scripts/sprint-14-lite-boundary-certification.mjs` — production certification harness
- `package.json` — `lite:certify:sprint14` script

Platform page modules (`OwnershipToolsPage`, `BuyerAssistantPage`, admin pages, etc.) **retained on disk** — not deleted.

---

## Production Verification

Run after deploy:

```bash
npm run lite:certify:sprint14
```

Certification report: `docs/releases/sprint-14-lite-boundary-certification.md`

---

## Final Verdict

**PASS** — Production verified 2026-07-09 (`npm run lite:certify:sprint14`)

- Code commit: `32b498ab`
- Lite nav: Home, Browse EVs, Compare, Guides, Search only; Admin and Tools removed
- Hidden hubs redirect: `/tools`, `/assistant`, `/ownership` → `/cars`
- `/admin` operational (direct URL, not in public nav/footer)
- All Lite journeys, CTAs, and footer company links pass on production

Certification report: `docs/releases/sprint-14-lite-boundary-certification.md`
