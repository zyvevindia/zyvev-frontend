/**
 * Verify local backend is up before frontend dev.
 * Usage: npm run check:api
 */

const API_URL = (
  process.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const url = `${API_URL}/cars?limit=1`;

try {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    console.error(`\n❌ API returned HTTP ${res.status} for GET ${url}\n`);
    process.exit(1);
  }

  const data = await res.json();
  const count = Array.isArray(data?.cars) ? data.cars.length : 0;
  const total = data?.total ?? count;

  console.log(`\n✅ Local API OK — ${API_URL}`);
  console.log(`   GET /cars → ${count} item(s) on page (total catalog: ${total})`);
  console.log(`   catalogMode: ${data?.catalogMode ?? "(n/a)"}\n`);
} catch (err) {
  console.error(`\n❌ Cannot reach local API at ${url}`);
  console.error(`   ${err?.message || err}`);
  console.error(`
Start the backend first (separate terminal):

  cd ../zyvev-backend
  npm run dev

Expected: Server running on port 5000, MongoDB Connected.
Frontend VITE_API_URL should be ${API_URL} (.env or .env.local).
\n`);
  process.exit(1);
}
