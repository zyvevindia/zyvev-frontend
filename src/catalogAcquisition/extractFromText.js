/**
 * Heuristic text/HTML extraction — v1 rules engine (AI hook ready).
 * OEM source text → raw key-value candidates before normalization.
 */

function stripHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function num(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).replace(/[,₹]/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function firstMatch(text, patterns) {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function allMatches(text, re) {
  const out = [];
  let m;
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  while ((m = g.exec(text)) !== null) {
    out.push(m[1]?.trim());
  }
  return out;
}

/**
 * @param {string} rawContent HTML or plain text from OEM source
 * @param {{ sourceType?: string, sourceUrl?: string }} context
 */
export function extractCandidatesFromContent(rawContent, context = {}) {
  const plain = rawContent.includes("<") ? stripHtml(rawContent) : String(rawContent);
  const lower = plain.toLowerCase();

  const brand = firstMatch(plain, [
    /(?:brand|manufacturer)[:\s]+([A-Za-z][A-Za-z0-9\s&.-]{1,40})/i,
    /\b(Tata|Mahindra|Hyundai|Kia|MG|BYD|Mercedes|BMW|Volvo|Citro[eë]n)\b/i,
  ]);

  const model = firstMatch(plain, [
    /(?:model|vehicle)[:\s]+([A-Za-z0-9][A-Za-z0-9\s.+/-]{1,48})/i,
    /\b(Nexon EV|Punch EV|Tiago EV|Atto 3|ZS EV|Kona Electric|XUV400|Comet EV)\b/i,
  ]);

  const bodyType = firstMatch(plain, [
    /body\s*type[:\s]+([A-Za-z\s]+)/i,
    /\b(SUV|Hatchback|Sedan|MPV|Crossover|Compact SUV)\b/i,
  ]);

  const priceMatches = allMatches(
    plain,
    /(?:₹|rs\.?\s*|inr\s*)?([\d,]+(?:\.\d+)?)\s*(?:lakh|lac|ex[-\s]?showroom)?/gi
  )
    .map((p) => num(p.replace(/,/g, "")))
    .filter((n) => n && n >= 300_000 && n <= 50_000_000);

  const startingPrice = priceMatches.length ? Math.min(...priceMatches) : null;
  const topVariantPrice = priceMatches.length ? Math.max(...priceMatches) : null;

  const batteryCapacityKwh = num(
    firstMatch(plain, [
      /(\d+(?:\.\d+)?)\s*kwh/i,
      /battery[:\s]+(\d+(?:\.\d+)?)/i,
    ])
  );

  const claimedRangeKm = num(
    firstMatch(plain, [
      /(\d{2,4})\s*km\s*(?:range|mIDC|certified|ARAI)?/i,
      /range[:\s]+(\d{2,4})\s*km/i,
    ])
  );

  const acChargingKw = num(firstMatch(plain, [/(\d+(?:\.\d+)?)\s*kW\s*AC/i, /AC[:\s]+(\d+(?:\.\d+)?)\s*kW/i]));
  const dcChargingKw = num(firstMatch(plain, [/(\d+(?:\.\d+)?)\s*kW\s*DC/i, /DC[:\s]+(\d+(?:\.\d+)?)\s*kW/i, /fast\s*charge[:\s]+(\d+(?:\.\d+)?)\s*kW/i]));

  const powerPs = num(firstMatch(plain, [/(\d+(?:\.\d+)?)\s*(?:PS|bhp)/i, /power[:\s]+(\d+(?:\.\d+)?)/i]));
  const torqueNm = num(firstMatch(plain, [/(\d+(?:\.\d+)?)\s*Nm/i, /torque[:\s]+(\d+(?:\.\d+)?)/i]));

  const lengthMm = num(firstMatch(plain, [/length[:\s]+(\d{3,4})\s*mm/i]));
  const widthMm = num(firstMatch(plain, [/width[:\s]+(\d{3,4})\s*mm/i]));
  const heightMm = num(firstMatch(plain, [/height[:\s]+(\d{3,4})\s*mm/i]));
  const wheelbaseMm = num(firstMatch(plain, [/wheelbase[:\s]+(\d{3,4})\s*mm/i]));

  const airbags = num(firstMatch(plain, [/(\d+)\s*airbags?/i]));
  const adas = /\b(ADAS|autonomous|lane assist|AEB|acc)\b/i.test(plain);
  const ncapRating = num(firstMatch(plain, [/(\d)\s*star\s*NCAP/i, /NCAP[:\s]+(\d)/i]));

  const rangeTestStandard = firstMatch(plain, [
    /\b(MIDC|WLTP|ARAI|EPA|NEDC)\b/i,
  ]);

  const batteryChemistry = firstMatch(plain, [
    /\b(LFP|NMC|NCA|Lithium[\s-]?Ion|Li[\s-]?Ion)\b/i,
  ]);

  const acChargingTimeHours = num(
    firstMatch(plain, [/AC[:\s]+(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/i, /(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)\s*AC/i])
  );
  const dcChargingTimeMinutes = num(
    firstMatch(plain, [
      /(\d+(?:\.\d+)?)\s*(?:min(?:utes?)?)\s*(?:DC|fast)/i,
      /(?:DC|fast)[:\s]+(\d+(?:\.\d+)?)\s*(?:min(?:utes?)?)/i,
      /10\s*[–-]\s*80\s*[%\s]+(?:in\s+)?(\d+(?:\.\d+)?)\s*min/i,
    ])
  );

  const sunroof = /\b(panoramic\s+sunroof|sunroof|sky\s*view)\b/i.test(plain);
  const ventilatedSeats = /\bventilated\s+(?:front\s+)?seats?\b/i.test(plain);
  const camera360 = /\b(360[\s°]*\s*(?:camera|view)|surround\s+view)\b/i.test(plain);
  const connectedCar = /\b(connected\s+car|iRA|ZConnect|Kia\s+Connect|My\s+Tata)\b/i.test(plain);
  const v2l = /\b(V2L|vehicle[\s-]to[\s-]load)\b/i.test(plain);
  const v2v = /\b(V2V|vehicle[\s-]to[\s-]vehicle)\b/i.test(plain);

  const vehicleWarrantyYears = num(firstMatch(plain, [/(\d+)\s*(?:yr|year)s?\s*(?:vehicle|standard)\s*warranty/i]));
  const batteryWarrantyYears = num(firstMatch(plain, [/(\d+)\s*(?:yr|year)s?\s*battery\s*warranty/i]));

  const adasLevel = num(firstMatch(plain, [/ADAS\s*(?:level\s*)?(\d)/i]));

  const variantNames = allMatches(
    plain,
    /(?:variant|trim)[:\s]+([A-Za-z0-9][A-Za-z0-9\s+/.-]{2,32})/gi
  ).slice(0, 8);

  const variants = variantNames.map((name, i) => ({
    variantName: name,
    price: priceMatches[i] ?? startingPrice,
    battery: batteryCapacityKwh,
    range: claimedRangeKm,
    charging: [acChargingKw, dcChargingKw].filter(Boolean).join(" / ") || null,
  }));

  return {
    plainTextLength: plain.length,
    brand,
    model,
    bodyType,
    startingPrice,
    topVariantPrice,
    batteryCapacityKwh,
    claimedRangeKm,
    acChargingKw,
    dcChargingKw,
    powerPs,
    torqueNm,
    lengthMm,
    widthMm,
    heightMm,
    wheelbaseMm,
    airbags,
    adas,
    ncapRating,
    rangeTestStandard,
    batteryChemistry,
    acChargingTimeHours,
    dcChargingTimeMinutes,
    sunroof,
    ventilatedSeats,
    camera360,
    connectedCar,
    v2l,
    v2v,
    vehicleWarrantyYears,
    batteryWarrantyYears,
    adasLevel,
    variants,
    meta: {
      sourceType: context.sourceType || null,
      sourceUrl: context.sourceUrl || null,
      hasHtml: rawContent.includes("<"),
    },
  };
}

/**
 * Extract with AI provider hook — delegates to v3 AI engine when provider supplied.
 * @param {string} rawContent
 * @param {object} context
 * @param {Function|object} [aiProvider] async provider or config override
 */
export async function extractWithAiProvider(rawContent, context = {}, aiProvider) {
  if (typeof aiProvider === "function") {
    const prompt =
      "Extract EV vehicle catalog fields as JSON matching EVSavari schema: brand, model, pricing, battery, range, charging, performance, dimensions, safety, features, warranty, variants.";
    try {
      return await aiProvider({ prompt, content: rawContent, context });
    } catch {
      return null;
    }
  }

  const { extractSourceToEvidence } = await import("./ai/extractToEvidence.js");
  const r = await extractSourceToEvidence({
    importId: context.importId || "inline",
    content: rawContent,
    sourceType: context.sourceType,
    sourceName: context.sourceName,
    sourceUrl: context.sourceUrl,
    trustScore: context.trustScore,
    aiConfig: aiProvider,
  });
  return r.ok ? { fields: Object.fromEntries(r.records.map((rec) => [rec.fieldName, { value: rec.fieldValue, confidence: rec.extractionConfidence }])), variants: r.variants } : null;
}

export { stripHtml };
