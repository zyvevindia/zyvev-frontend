/**
 * Launch validation CLI — API, Cloudinary, launch families.
 * Usage: npm run launch:validate
 *        VITE_API_URL=https://evsavari-api.onrender.com npm run launch:validate
 */

const API_URL = (
  process.env.VITE_API_URL || "https://evsavari-api.onrender.com"
).replace(/\/$/, "");

const CLOUD_NAME =
  process.env.VITE_CLOUDINARY_CLOUD_NAME || "dznvmumze";

const LAUNCH_FAMILIES = [
  "tata-nexon-ev",
  "tata-punch-ev",
  "tata-curvv-ev",
  "mg-comet-ev",
  "mg-zs-ev",
  "mahindra-be-6",
];

function familyUrl(family, file) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/evsavari/catalog/families/${family}/${file}`;
}

async function probeUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return { url, ok: res.ok, status: res.status };
  } catch (err) {
    return { url, ok: false, error: err?.message };
  }
}

async function main() {
  console.log("\n⚡ EVSavari launch validation\n");
  console.log(`API: ${API_URL}`);
  console.log(`Cloudinary: ${CLOUD_NAME}\n`);

  let allOk = true;

  // API
  const apiUrl = `${API_URL}/cars?limit=50`;
  let cars = [];
  try {
    const started = Date.now();
    const res = await fetch(apiUrl);
    const ms = Date.now() - started;
    if (!res.ok) {
      console.log(`❌ API: HTTP ${res.status} (${ms}ms)`);
      allOk = false;
    } else {
      const data = await res.json();
      cars = Array.isArray(data?.cars) ? data.cars : [];
      console.log(`✅ API: OK (${ms}ms) — ${cars.length} cars on page, total ${data?.total ?? "—"}`);
    }
  } catch (err) {
    console.log(`❌ API: ${err?.message}`);
    allOk = false;
  }

  // Launch families
  const slugs = new Set(cars.map((c) => String(c.slug || "").toLowerCase()));
  const missing = LAUNCH_FAMILIES.filter((f) => {
    if (slugs.has(f)) return false;
    return ![...slugs].some((s) => s.startsWith(`${f}-`));
  });
  if (missing.length === 0) {
    console.log(`✅ Launch families: ${LAUNCH_FAMILIES.length}/${LAUNCH_FAMILIES.length} in catalog`);
  } else {
    console.log(`❌ Launch families missing: ${missing.join(", ")}`);
    allOk = false;
  }

  // Cloudinary probe (hero + listing per family)
  const urls = LAUNCH_FAMILIES.flatMap((f) => [
    familyUrl(f, "hero.jpg"),
    familyUrl(f, "listing-thumb.jpg"),
  ]);
  const results = await Promise.all(urls.map(probeUrl));
  const broken = results.filter((r) => !r.ok);
  if (broken.length === 0) {
    console.log(`✅ Cloudinary: ${urls.length}/${urls.length} URLs OK`);
  } else {
    console.log(`❌ Cloudinary: ${broken.length} broken`);
    broken.slice(0, 5).forEach((b) => {
      console.log(`   ${b.url} (${b.status || b.error})`);
    });
    allOk = false;
  }

  // Env hints
  console.log("\nEnvironment (CLI):");
  console.log(`  VITE_API_URL=${process.env.VITE_API_URL || "(default prod)"}`);
  console.log(`  VITE_CLOUDINARY_CLOUD_NAME=${process.env.VITE_CLOUDINARY_CLOUD_NAME || "(default)"}`);
  console.log(`  VITE_BEHAVIORAL_INTELLIGENCE=${process.env.VITE_BEHAVIORAL_INTELLIGENCE || "(unset)"}`);
  console.log(`  VITE_WHATSAPP_SALES_NUMBER=${process.env.VITE_WHATSAPP_SALES_NUMBER ? "set" : "(unset)"}`);

  console.log(allOk ? "\n✅ Launch validation PASSED\n" : "\n❌ Launch validation FAILED\n");
  process.exit(allOk ? 0 : 1);
}

main();
