# EVSavari soft launch — deployment readiness

For **step-by-step production execution** (Vercel, Render, env lists, launch order), use **[production-deployment-guide.md](./production-deployment-guide.md)**.

This document supports **production deployment** (Vercel + Render) and **manual QA** before soft launch. It is not a substitute for full automated testing.

---

## 1. Deployment checklist

### Vercel (frontend)

- [ ] Project linked to this repo; **Production** branch/environment chosen (e.g. `main` or release branch).
- [ ] **Environment variables** set in Vercel: `VITE_API_URL` (production API base URL, no trailing slash), optional `VITE_GA_ID`.
- [ ] **Build command** `npm run build` succeeds (run locally before merge).
- [ ] **Output**: Vite default `dist`; no custom output dir unless configured.
- [ ] **vercel.json**: SPA fallback rewrites `/*` → `/` so client routes (`/compare`, `/admin`, `/dealer`, `/cars`, etc.) resolve.
- [ ] **Static files** in `public/` served at root: `/favicon.svg`, `/robots.txt`, `/sitemap.xml`, `/icons.svg`.
- [ ] **Preview deployments**: add each stable preview origin to Render **`CORS_ORIGINS`** (comma-separated) if you test against production API from previews.

### Render (backend)

- [ ] **Node** service matches `package.json` engines (Node ≥ 20).
- [ ] **Start command** `node server.js` (or `npm start`).
- [ ] **Required env** (see `config/env.js`): `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- [ ] **Port**: `PORT` injected by Render; server uses `process.env.PORT || 5000`.
- [ ] **Optional**: `CORS_ORIGINS` — comma-separated extra allowed browser origins (e.g. Vercel preview URLs). Defaults include localhost:5173, zyvev-frontend.vercel.app, evsavari.com, www.evsavari.com.
- [ ] **Production** `NODE_ENV=production` so Morgan dev logging is off and CORS rejection noise is reduced.

### Post-deploy smoke

- [ ] `GET https://<api>/` returns backend health text.
- [ ] From production site, open DevTools → Network: API calls return **200** (not CORS errors).

---

## 2. Launch blockers (must fix before broad launch)

| ID | Area | Issue |
|----|------|--------|
| B1 | Social / SEO | **OG/Twitter images** now point at `favicon.svg` so URLs resolve; many networks prefer a **1200×630 PNG/JPEG** (`og-image`). Add `public/og-image.jpg` and point `og:image` / `twitter:image` to it for reliable previews. |
| B2 | CORS | Any **new production frontend hostname** (e.g. new Vercel project name) must be in backend **`CORS_ORIGINS`** or added to `defaultCorsOrigins` in `server.js`, or the browser will block API calls. |
| B3 | QA | **End-to-end flows** below require **manual validation** on staging/production URLs (not verified in this audit). |

---

## 3. Production risks (monitor / plan)

| Risk | Notes |
|-------|--------|
| **Secrets in client** | Only `VITE_*` vars are exposed in the bundle; never put secrets in `VITE_` names. |
| **API rate limits** | Global limiter may throttle heavy dashboards; tune if legitimate admin traffic hits 429. |
| **RBAC** | `PrivateRoute` enforces roles client-side; backend must still authorize every privileged route (verify on API). |
| **No-origin CORS** | Server allows requests with **no `Origin`** header (`curl`, server-to-server). Expected for non-browser clients; ensure sensitive mutations require auth. |
| **Console noise** | Frontend uses `console.error` in catch paths; acceptable for soft launch; strip or gate behind `DEV` later. |
| **Backend `console.log`** | Many `server.js` / `dealerApi.js` logs; consider reducing in production for log volume and PII. |
| **ESLint** | `npm run lint` currently reports multiple issues; does not block Vite build but increases regression risk. |
| **Mobile** | Layout is mostly inline-style responsive; spot-check listing grids, compare table, admin tables on small viewports. |

---

## 4. Recommended immediate fixes (small / already applied where noted)

1. **Render + rate limiting**: `app.set("trust proxy", 1)` in production so client IP behind proxy is correct for limiters (applied in `server.js`).
2. **CORS**: Merge **`CORS_ORIGINS`** from env with defaults; log blocked origins only outside production (applied in `server.js`).
3. **Broken OG URL**: Replaced missing **`og-image.jpg`** with existing **`favicon.svg`** so crawlers do not 404; follow up with a proper raster OG asset (see B1).
4. **Sitemap**: Added **`/cars`** entry for primary listing surface (applied in `public/sitemap.xml`).
5. **Vercel env**: Confirm **`VITE_API_URL`** matches the Render API URL used in CORS allowlist.

---

## 5. Frontend — Vercel / SPA / assets (audit summary)

| Item | Status |
|------|--------|
| **vercel.json** | Rewrite `/(.*)` → `/` is correct for **React Router** SPA; `cleanUrls` + `trailingSlash: false` align with app links. |
| **Static assets** | `public/` files served at site root; Vercel does not rewrite over existing static files. |
| **robots.txt** | `Sitemap: https://evsavari.com/sitemap.xml` — ensure production domain matches deployment. |
| **sitemap.xml** | Includes `/`, `/compare`, `/cars`, about/contact/privacy/terms. Category URLs (`/popular`, etc.) omitted; add later if SEO requires. |
| **Favicon** | `index.html` → `/favicon.svg` (exists in `public/`). |
| **OG / Twitter** | Point to `/favicon.svg` until a dedicated `og-image` exists (see B1). |

---

## 6. Backend — Render / env / CORS / API patterns (audit summary)

| Item | Status |
|------|--------|
| **Render** | `PORT`, `trust proxy` in production, `dotenv`, required env validation on boot. |
| **CORS** | Defaults + **`CORS_ORIGINS`**; production does not log every blocked origin to stdout. |
| **Frontend API usage** | App code uses **`API_URL` from `src/config.js`** for fetches; no hardcoded `http://localhost` in fetch URLs found. |

---

## 7. Launch readiness QA — flows to validate manually

Run on **staging or production** URLs with DevTools open (Console + Network).

| Flow | What to verify |
|------|----------------|
| **Homepage** | Loads sections; no red errors; API `/cars` returns data. |
| **Listing** | `/cars` (and category routes) load, filters work, cards render. |
| **Compare** | Add 2–3 vehicles, open `/compare`, table renders; **Clear comparison** empties state. |
| **Lead inquiry** | Lead modal / form submits; success or clear validation errors; Network shows POST to `/leads`. |
| **Admin login** | `/login` → admin dashboard; protected routes redirect when logged out. |
| **Dealer login** | `/dealer/login` → `/dealer` when `dealer` role; wrong role cannot open dealer dashboard. |
| **CRM lead workflow** | Kanban / sales dashboard: move status, notes, follow-up; data persists after refresh. |
| **Notifications** | Bell loads list; mark read if implemented; no infinite error loop. |
| **Dealer assignment** | Admin assigns lead to dealer; dealer API reflects assignment (per product spec). |

---

## 8. Hardening notes (no UI redesign)

- **Console logs**: Dev-only env banner in `src/config.js` is appropriate; widespread `console.error` in catches is acceptable short term.
- **Error boundaries** | Root `ErrorBoundary` in `main.jsx` wraps the app; route-level gaps remain possible inside lazy routes.
- **Loading / error states** | Listing, Home, and dashboards have patterns; admin/compare tables may still show empty states briefly — acceptable if tested.

---

*Generated for EVSavari soft launch preparation. Update this file as blockers are cleared.*
