# EVSavari — production deployment execution guide

Use this document to **execute** a first production (or production-like) deployment: Render API first, then Vercel UI, then domain, CORS, and smoke tests. No application code changes are required for a standard deploy.

Related: [soft-launch-readiness.md](./soft-launch-readiness.md) (risks, blockers, deeper QA notes).

---

## Part 1 — Step-by-step deployment

### Phase A — Render (backend) Web Service

1. **Create service**  
   In [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service** → connect the **backend** Git repository (e.g. `evsavari-backend` / `zyvev-backend`).

2. **Branch & region**  
   Select **production branch** (e.g. `main`) and a region close to users (e.g. Singapore / Mumbai if available).

3. **Runtime**  
   - **Environment**: `Node`  
   - **Node version**: **20+** (matches `package.json` `engines`). Set **Environment Variable** `NODE_VERSION=20` if the dashboard offers it, or use Render’s Node selector.

4. **Build & start (defaults)**  
   - **Root directory**: repository root (where `package.json` and `server.js` live).  
   - **Build Command**: leave empty **or** `npm install` (Render runs install automatically for Node).  
   - **Start Command**: **`npm start`**  
     This runs **`node server.js`** per `package.json` → compatible with Render.

5. **Health check (optional)**  
   **Health Check Path**: `/` — the server responds with plain text `EVSavari Backend Running 🚀`.

6. **Deploy**  
   Trigger first deploy. Watch logs: you must see **`✅ Environment variables validated`** and **`MongoDB Connected`** (or fix env vars per Part 2).

7. **Note the public URL**  
   Example: `https://evsavari-api.onrender.com` — you will use this as **`VITE_API_URL`** on Vercel and in **CORS** if it is not already covered by defaults.

---

### Phase B — Render environment variables

Configure **all required variables** in Render → your Web Service → **Environment** (see **Part 2 — Backend exact list**). Redeploy after saving.

---

### Phase C — Vercel (frontend) project

1. **Import project**  
   [Vercel Dashboard](https://vercel.com) → **Add New** → **Project** → import the **frontend** repository.

2. **Framework**  
   Vercel should detect **Vite**. If not: **Framework Preset** → **Vite**.

3. **Build settings**  
   - **Install Command**: `npm install` (default).  
   - **Build Command**: **`npm run build`**.  
   - **Output Directory**: **`dist`** (matches `vite.config.js` `build.outDir`).  
   - **Root Directory**: repository root (where this `package.json` lives), unless the app is in a monorepo subfolder.

4. **Environment variables**  
   Add **Production** (and optionally **Preview**) variables from **Part 2 — Frontend exact list**.  
   **Critical:** `VITE_API_URL` must be the **public Render API URL** (no trailing slash), e.g. `https://evsavari-api.onrender.com`.

5. **Deploy**  
   Deploy production. Confirm build log ends with Vite success and static files under `dist/`.

6. **`vercel.json`**  
   Already in repo: SPA **rewrite** `/(.*)` → `/` so deep links (`/compare`, `/admin`, `/dealer`, `/cars`, etc.) load `index.html`. **Do not remove** for client-side routing.

---

### Phase D — Production domain (Vercel + DNS)

1. **Vercel → Domains**  
   Add **`evsavari.com`** and **`www.evsavari.com`** (or your final hostnames). Follow Vercel’s DNS instructions (usually **A** / **CNAME** to Vercel).

2. **Redirect (recommended)**  
   Choose one canonical host (e.g. apex `evsavari.com` or `www`) and configure redirect in Vercel so SEO and cookies stay consistent.

3. **Backend custom domain (optional)**  
   If the API uses a **custom domain** (e.g. `api.evsavari.com`) on Render, point DNS per Render docs and set **`VITE_API_URL`** on Vercel to that HTTPS origin (no trailing slash).

---

### Phase E — API connection verification

1. **Browser (production site)**  
   Open the live frontend → DevTools → **Network**. Reload. Confirm XHR/fetch to **`/cars`**, `/leads`, etc. hit your **`VITE_API_URL`** host and return **200** (not CORS errors).

2. **CORS on Render**  
   Default allowed origins in backend include `https://evsavari.com`, `https://www.evsavari.com`, `http://localhost:5173`, `https://zyvev-frontend.vercel.app`.  
   For **Vercel preview** URLs or a **new** production project URL, set **`CORS_ORIGINS`** on Render (comma-separated, no spaces required). Example:  
   `https://evsavari-abc123.vercel.app,https://staging.evsavari.com`

3. **Direct API check**  
   ```bash
   curl -sS -o /dev/null -w "%{http_code}" "https://YOUR-API-HOST/cars"
   ```  
   Expect **200** (or **401/403** only on protected routes — `/cars` should be public).

---

## Part 2 — Exact environment variable lists

### Frontend — Vercel (and any `vite build` CI)

| Variable | Required | Value (example) | Notes |
|----------|----------|-----------------|--------|
| `VITE_API_URL` | **Strongly recommended** | `https://evsavari-api.onrender.com` | Public API base URL, **no trailing slash**. Baked in at **build** time. If omitted in production build, `src/config.js` uses **`PROD_FALLBACK`** (`https://evsavari-api.onrender.com`) — set explicitly if your API host differs. |
| `VITE_GA_ID` | No | `G-XXXXXXXXXX` | Google Analytics 4. Omit to disable GA (see `GoogleAnalytics.jsx`). |

**Preview deployments:** Set the same variables under **Preview** in Vercel, or point `VITE_API_URL` at a **staging** API. Remember each preview **origin** must be allowed by backend CORS (`CORS_ORIGINS` or defaults).

---

### Backend — Render

| Variable | Required | Notes |
|----------|----------|--------|
| `MONGO_URI` | **Yes** | MongoDB connection string (validated at startup). |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs. |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret. |
| `NODE_ENV` | **Recommended** | Set to **`production`** for production (disables dev-only Morgan logging, quieter CORS rejection logs, enables `trust proxy`). |
| `PORT` | No | Render injects automatically; server uses `process.env.PORT \|\| 5000`. |
| `CORS_ORIGINS` | No | Comma-separated extra browser origins (e.g. Vercel preview URLs). Merged with server defaults: `http://localhost:5173`, `https://zyvev-frontend.vercel.app`, `https://evsavari.com`, `https://www.evsavari.com`. |
| `SEED_DATA` | No | If set to **`true`**, triggers seed path in server (only use intentionally in non-production or one-off bootstrap). |

Copy template: backend repository **`.env.example`** (if present).

---

## Part 3 — Compatibility verification (this stack)

| Check | Result |
|--------|--------|
| **Frontend build output vs Vercel** | Vite writes to **`dist/`** with hashed assets under `dist/assets/`. Vercel’s default Vite preset uses **`dist`** as output — **compatible**. |
| **Backend start vs Render** | **`npm start`** → **`node server.js`** — **compatible** with Render Web Service. |
| **SPA routing after deploy** | **`vercel.json`** rewrites all non-file routes to **`/`**, so React Router handles `/compare`, `/cars`, `/admin`, `/dealer`, etc. **Compatible** with static hosting. |
| **API base URL in production** | Resolved as **`import.meta.env.VITE_API_URL`** trimmed, else **`PROD_FALLBACK`** in `src/config.js` when `import.meta.env.PROD` — ensure **`VITE_API_URL`** matches your live API to avoid drift from fallback. |

**Local verification commands (run before tagging a release):**

```bash
# Frontend (from frontend repo root)
npm ci
npm run build

# Backend (from backend repo root)
node --check server.js
```

---

## Part 4 — Production smoke test checklist

Run on the **live production URLs** after deploy. Use a clean browser profile or incognito where useful.

| # | Flow | Pass criteria |
|---|------|----------------|
| 1 | **Homepage** | Loads; no persistent console errors; featured/latest sections populate if API returns data. |
| 2 | **Listing** | `/cars` (and category routes if used) load; filters/search do not blank the app; vehicles visible. |
| 3 | **Compare** | Select 2–3 vehicles → `/compare` shows table; **Clear comparison** returns empty state; re-add works. |
| 4 | **Lead submission** | Inquiry / lead form submits; success or validation message; Network shows **POST** to `{API_URL}/leads` (or configured path) with **2xx** or clear **4xx** validation. |
| 5 | **Admin login** | Staff login succeeds; `/admin` loads; logout and protected redirect behave as expected. |
| 6 | **Dealer login** | `/dealer/login` → dealer dashboard for `dealer` role; non-dealer cannot access dealer routes. |
| 7 | **CRM flows** | Kanban / sales dashboard: load leads, change status, add note or follow-up; refresh persists data. |
| 8 | **Notifications** | Notification bell opens; list loads; no infinite error loop on empty or error response. |

---

## Part 5 — Launch sequence (ordered)

Execute in order; do not skip CORS/API verification before announcing go-live.

| Step | Action | Owner |
|------|--------|--------|
| **1** | Deploy **backend** on Render with all **required** env vars; confirm logs show DB connected and no crash loop. | Backend |
| **2** | Set **`NODE_ENV=production`** on Render production service. | Backend |
| **3** | Configure **`CORS_ORIGINS`** for every frontend origin that will call this API (production + previews if needed). | Backend |
| **4** | Copy **public API base URL** (Render default or custom domain). | Backend |
| **5** | Deploy **frontend** on Vercel with **`VITE_API_URL`** set to that API URL; confirm build green. | Frontend |
| **6** | **Verify API** from deployed site (Network tab: no CORS failures; `/cars` etc. succeed). | Full stack |
| **7** | Attach **production domain** on Vercel; update DNS; wait for SSL **Ready**. | Frontend / DNS |
| **8** | **Verify SEO**: `robots.txt`, `sitemap.xml`, canonical and OG meta on homepage (see `index.html` / Helmet pages). | Frontend |
| **9** | **Verify analytics**: if `VITE_GA_ID` set, confirm GA Realtime or Tag Assistant; if unset, confirm no script errors. | Frontend |
| **10** | Run **Part 4** smoke checklist on production URLs; fix CORS or env if any item fails. | QA |

---

## Quick reference — where things live

| Concern | Location |
|---------|-----------|
| Frontend build | `npm run build` → `dist/` |
| Vercel SPA rewrite | `vercel.json` |
| Frontend API config | `src/config.js` (`VITE_API_URL`, fallbacks) |
| Backend entry | `server.js`, `npm start` |
| Backend required env | `config/env.js` |
| Backend CORS defaults + `CORS_ORIGINS` | `server.js` |

---

*Document version: deployment execution only — no feature changes implied.*
