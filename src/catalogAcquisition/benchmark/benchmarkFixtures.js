/**
 * Identical benchmark inputs per golden vehicle — shared across all providers.
 */

export const BENCHMARK_SAMPLE_HTML = Object.freeze({
  "tata-nexon-ev": `
    Tata Nexon EV — SUV
    Ex-showroom from ₹14,99,000 to ₹19,99,000
    Battery 30 kWh / 40 kWh / 45 kWh · Range 275–465 km MIDC
    AC 3.3 kW / 7.2 kW · DC 50 kW / 60 kW
    6 airbags · ADAS · 5 star Bharat NCAP
    Variants: Creative, Creative Plus, Fearless, Fearless Plus
  `,
  "tata-curvv-ev": `
    Tata Curvv EV SUV
    Starting ₹17,99,000 · Top ₹20,99,000
    Battery 45 kWh / 55 kWh · Range 502–585 km MIDC
    AC 7.2 kW · DC 150 kW · 6 airbags · ADAS
    Variants: Creative 45, Accomplished 45, Empowered 55
  `,
  "tata-punch-ev": `
    Tata Punch EV compact SUV
    From ₹9,99,000 · Battery 25 kWh / 35 kWh
    Range 315–421 km MIDC · AC 7.2 kW · DC 50 kW
    Variants: Smart, Smart Plus, Adventure, Empowered
  `,
  "mg-windsor-ev": `
    MG Windsor EV SUV
    Starting ₹9,99,000 · Top ₹16,89,000
    Battery 38 kWh · Range 331 km ARAI
    AC 7.4 kW · DC 45 kW · 6 airbags
    Variants: Excite, Exclusive, Essence
  `,
  "mahindra-be-6": `
    Mahindra BE 6 electric SUV
    From ₹18,90,000 · Pack Three 79 ₹26,90,000
    Battery 59 kWh / 79 kWh · Range 500–683 km MIDC
    AC 11 kW · DC 150 kW · ADAS
    Variants: Pack One 59, Pack Three 79, Pack Three 79 Select
  `,
  "mahindra-xev-9e": `
    Mahindra XEV 9e SUV
    From ₹21,90,000 · AWD Select ₹30,90,000
    Battery 79 kWh · Range 656 km MIDC
    AC 11 kW · DC 175 kW · ADAS
    Variants: Pack One 79, Pack Three 79, Pack Three 79 Select AWD
  `,
  "byd-atto-3": `
    BYD Atto 3 SUV
    From ₹24,99,000 · Special Edition ₹33,99,000
    Battery 60.48 kWh · Range 521 km ARAI
    AC 7 kW · DC 80 kW · 6 airbags · ADAS
    Variants: Dynamic, Superior, Special Edition
  `,
  "hyundai-creta-electric": `
    Hyundai Creta Electric SUV
    From ₹17,99,000 · Signature ₹24,99,000
    Battery 42 kWh / 51 kWh · Range 390–473 km ARAI
    AC 11 kW · DC 150 kW · ADAS
    Variants: Executive, Premium, Signature
  `,
});

export const BENCHMARK_PROVIDER_IDS = Object.freeze({
  HEURISTIC: "heuristic",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
});

export function getBenchmarkInput(goldenId) {
  return BENCHMARK_SAMPLE_HTML[goldenId] || null;
}
