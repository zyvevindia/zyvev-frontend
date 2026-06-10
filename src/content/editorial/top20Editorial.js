/**
 * Human-reviewed editorial layer for SEO Agent v1 top-20 pages.
 * Applied at content generation — not LLM-generated at runtime.
 */
const REVIEWED_AT = "2026-06-10";

function guideEditorial(fields) {
  return { humanReviewed: true, reviewedAt: REVIEWED_AT, ...fields };
}

/** @type {Record<string, object>} */
export const TOP20_EDITORIAL_BY_SLUG = {
  "best-evs-under-15-lakh-agent": guideEditorial({
    pros: [
      "Strong value EVs with verified ex-showroom prices under ₹15 lakh",
      "Tiago EV and Punch EV offer usable range for daily Indian commutes",
      "Lower running cost vs petrol hatchbacks at this price band",
    ],
    cons: [
      "Fast-charging infrastructure still uneven outside metro corridors",
      "Entry trims may lack ADAS or long-range battery options",
      "Resale data for mass-market EVs is still maturing",
    ],
    whoShouldBuy: [
      "First-time EV buyers upgrading from a petrol hatchback",
      "City commuters with predictable daily driving under 60 km",
      "Buyers prioritising low EMI and running cost over premium features",
    ],
    whoShouldAvoid: [
      "Frequent highway travellers needing 400+ km per day",
      "Buyers who need three-row seating or heavy towing",
      "Apartment owners with no society charging approval yet",
    ],
    bestAlternative: {
      label: "Best budget EVs (broader list)",
      href: "/best-evs/budget-agent",
      reason:
        "If your budget is flexible up to ₹12 lakh, the dedicated budget guide compares more entry-level options side by side.",
    },
    relatedLinks: [
      { label: "Best city EVs", href: "/best-evs/city-agent" },
      { label: "EV running cost guide", href: "/ownership-guides/running-cost" },
      { label: "Home charger install", href: "/ownership-guides/home-charger-install" },
    ],
  }),

  "best-evs-for-family-agent": guideEditorial({
    pros: [
      "Rankings weight space, safety, and highway practicality together",
      "Several options offer 400+ km ARAI range for weekend trips",
      "Family-focused EVs increasingly include connected features and ADAS",
    ],
    cons: [
      "Larger battery packs push prices above compact EVs",
      "Third-row EVs remain limited in India at mainstream prices",
      "Monsoon range and AC load can reduce real-world range",
    ],
    whoShouldBuy: [
      "Families of four to five needing regular inter-city travel",
      "Buyers replacing a compact SUV or MPV with an EV",
      "Parents prioritising safety ratings and boot space",
    ],
    whoShouldAvoid: [
      "Single commuters with tight parking and minimal luggage needs",
      "Buyers on a strict sub-₹10 lakh budget",
      "Those without home or workplace charging access",
    ],
    bestAlternative: {
      label: "Best highway EVs",
      href: "/best-evs/highway-agent",
      reason:
        "If your family drives mostly on highways, the highway-focused list weights range and DC charging more heavily.",
    },
    relatedLinks: [
      { label: "Large family EVs", href: "/best-evs/large-family" },
      { label: "Insurance & TCO", href: "/ownership-guides/insurance-tco" },
      { label: "Monsoon driving", href: "/ownership-guides/monsoon-driving" },
    ],
  }),

  "best-evs-for-city-agent": guideEditorial({
    pros: [
      "Compact footprints suit Indian city parking and U-turns",
      "Lower battery sizes keep purchase price and charging time manageable",
      "Strong scores for efficiency in stop-go traffic",
    ],
    cons: [
      "Highway range may feel tight on unplanned long drives",
      "Smaller boots vs similarly priced ICE crossovers",
      "Public charger availability varies by city ward",
    ],
    whoShouldBuy: [
      "Daily office commuters in Bengaluru, Mumbai, Delhi, or Hyderabad",
      "Buyers with dedicated parking and overnight AC charging",
      "Two-wheeler upgraders wanting four-wheel weather protection",
    ],
    whoShouldAvoid: [
      "Weekly highway travellers between distant cities",
      "Buyers needing maximum ground clearance for bad roads",
      "Families needing three rows of seating",
    ],
    bestAlternative: {
      label: "Best EVs under ₹15 lakh",
      href: "/best-evs/under-15-lakh-agent",
      reason:
        "City buyers on a budget should cross-check the under-₹15 lakh list for the strongest value scores.",
    },
    relatedLinks: [
      { label: "Compact parking EVs", href: "/best-evs/compact-parking" },
      { label: "Apartment charging setup", href: "/ownership-guides/society-rwa" },
      { label: "Public charging guide", href: "/charging-guides/public-charging" },
    ],
  }),

  "best-evs-for-highway-agent": guideEditorial({
    pros: [
      "Prioritises claimed range, DC peak kW, and highway efficiency",
      "Better suited for Pune–Mumbai, Delhi–Jaipur, and similar corridors",
      "Higher-confidence picks for fast-charging network compatibility",
    ],
    cons: [
      "Highway-capable EVs usually cost more than city-only options",
      "Real range drops with speed, payload, and AC use",
      "Planning stops on NH networks still requires app research",
    ],
    whoShouldBuy: [
      "Inter-city professionals driving 150–300 km regularly",
      "Weekend travellers who can plan DC stops",
      "Buyers replacing a diesel SUV used mostly on highways",
    ],
    whoShouldAvoid: [
      "Pure city runabouts with no highway need",
      "Buyers unwilling to plan charging on long trips",
      "Those without access to overnight charging at either end",
    ],
    bestAlternative: {
      label: "Longest range EVs",
      href: "/best-evs/longest-range-agent",
      reason:
        "If range anxiety is your main concern, the longest-range list ranks purely on battery and efficiency metrics.",
    },
    relatedLinks: [
      { label: "Highway ownership guide", href: "/ownership-guides/highway-ownership" },
      { label: "Fast vs slow charging", href: "/charging-guides/fast-vs-slow" },
      { label: "Compare Nexon vs XUV400", href: "/compare/tata-nexon-ev-vs-mahindra-xuv400" },
    ],
  }),

  "best-evs-premium-agent": guideEditorial({
    pros: [
      "Premium EVs lead on ADAS, cabin tech, and charging speeds",
      "Strong brand cachet and feature lists vs ICE luxury rivals",
      "Better highway range and performance in this segment",
    ],
    cons: [
      "Higher upfront cost and insurance premiums",
      "Service network density varies by luxury brand",
      "Depreciation patterns still evolving for premium EVs",
    ],
    whoShouldBuy: [
      "Early adopters wanting latest tech and performance",
      "Buyers cross-shopping luxury ICE SUVs with EV alternatives",
      "Professionals with home charging and multi-car households",
    ],
    whoShouldAvoid: [
      "Budget-first buyers — value scores favour mass-market EVs",
      "Buyers in cities with sparse brand service centres",
      "Those needing maximum resale certainty today",
    ],
    bestAlternative: {
      label: "Best luxury EVs (editorial list)",
      href: "/best-evs/luxury-buyers",
      reason:
        "The editorial luxury-buyers guide adds lifestyle and ownership context beyond raw scores.",
    },
    relatedLinks: [
      { label: "Kia EV6 vs BYD Atto 3", href: "/compare/kia-ev6-vs-byd-atto-3" },
      { label: "Resale value guide", href: "/ownership-guides/resale-value" },
      { label: "Warranty coverage", href: "/ownership-guides/warranty-coverage" },
    ],
  }),

  "best-evs-budget-agent": guideEditorial({
    pros: [
      "Focuses on lowest entry prices with verified catalog data",
      "Highlights EVs with strong budget scores, not just sticker price",
      "Good starting point for first EV purchase research",
    ],
    cons: [
      "Budget trims may omit fast charging or advanced safety",
      "Range can be modest on base battery packs",
      "Waiting periods and discounts vary by city",
    ],
    whoShouldBuy: [
      "Cost-conscious buyers switching from CNG or petrol hatchbacks",
      "Second-car households adding an EV for city duties",
      "Fleet buyers evaluating TCO for urban routes",
    ],
    whoShouldAvoid: [
      "Buyers needing maximum range without budget compromise",
      "Those requiring premium safety or ADAS at any cost",
      "Highway-heavy users who should look at mid-segment EVs",
    ],
    bestAlternative: {
      label: "Best EVs under ₹15 lakh",
      href: "/best-evs/under-15-lakh-agent",
      reason:
        "The under-₹15 lakh guide narrows the pool further if you have a hard ceiling.",
    },
    relatedLinks: [
      { label: "College student EVs", href: "/best-evs/college-students" },
      { label: "Tax benefits", href: "/ownership-guides/tax-benefits" },
      { label: "Used EV buying", href: "/ownership-guides/used-ev-buying" },
    ],
  }),

  "tata-curvv-ev-vs-mahindra-be-6-agent": guideEditorial({
    pros: [
      "Side-by-side score breakdown for two new-gen Indian EVs",
      "Compares range, charging, features, and value objectively",
      "Links to live catalog specs for both models",
    ],
    cons: [
      "Launch pricing and variant mix may change scores over time",
      "Real-world range depends on trim and driving style",
      "Service network experience differs by city",
    ],
    whoShouldBuy: [
      "Buyers cross-shopping new Tata and Mahindra electric crossovers",
      "Early adopters comparing BE 6 tech vs Curvv EV packaging",
      "Families wanting a fresh alternative to Nexon EV / XUV400",
    ],
    whoShouldAvoid: [
      "Buyers needing proven long-term resale data on both nameplates",
      "Those prioritising the lowest possible entry price",
      "Shoppers who need delivery within days — check waitlists",
    ],
    bestAlternative: {
      label: "Nexon EV vs XUV400",
      href: "/compare/tata-nexon-ev-vs-mahindra-xuv400",
      reason:
        "If you prefer established models with more ownership feedback, compare the previous-generation rivals.",
    },
    relatedLinks: [
      { label: "Tata brand hub", href: "/brands/tata" },
      { label: "Mahindra brand hub", href: "/brands/mahindra" },
      { label: "Compare hub", href: "/compare" },
    ],
  }),

  "tata-punch-ev-vs-mg-windsor-ev-agent": guideEditorial({
    pros: [
      "Contrasts compact Tata packaging vs MG Windsor space and features",
      "Useful for buyers debating micro-SUV vs mid-size EV value",
      "Score-weighted comparison reduces spec-sheet noise",
    ],
    cons: [
      "Different size classes — boot and rear seat comfort differ materially",
      "MG and Tata service experiences vary regionally",
      "Promotional pricing can shift value perception quickly",
    ],
    whoShouldBuy: [
      "Urban buyers choosing between compact and mid-size EVs",
      "Families comparing Punch EV range vs Windsor cabin space",
      "Buyers who want MG feature load vs Tata value pricing",
    ],
    whoShouldAvoid: [
      "Buyers with fixed parking length limits — measure before choosing Windsor",
      "Those needing maximum ground clearance for rural roads",
      "Shoppers who only need a two-seater city runabout",
    ],
    bestAlternative: {
      label: "Punch EV vs Nexon EV",
      href: "/compare/tata-punch-ev-vs-tata-nexon-ev",
      reason:
        "Staying within Tata? Compare Punch against Nexon EV for a same-brand size and range trade-off.",
    },
    relatedLinks: [
      { label: "Best city EVs", href: "/best-evs/city-agent" },
      { label: "MG brand hub", href: "/brands/mg" },
      { label: "Insurance & TCO", href: "/ownership-guides/insurance-tco" },
    ],
  }),

  "byd-atto-3-vs-hyundai-creta-electric-agent": guideEditorial({
    pros: [
      "Compares established Atto 3 against Hyundai's Creta Electric entry",
      "Highlights charging speed, range, and feature differences",
      "Useful for premium compact SUV EV shoppers",
    ],
    cons: [
      "Creta Electric availability and variant mix may evolve",
      "Brand service density differs between BYD and Hyundai",
      "Price positioning may overlap with ICE Creta trims",
    ],
    whoShouldBuy: [
      "Buyers familiar with Creta sizing considering their first EV",
      "Tech-forward shoppers comparing BYD Blade battery positioning",
      "Families wanting ADAS-rich compact SUVs",
    ],
    whoShouldAvoid: [
      "Strict budget buyers — both sit above mass-market EV pricing",
      "Buyers in cities without nearby brand service",
      "Those needing proven Creta Electric long-term reliability data",
    ],
    bestAlternative: {
      label: "Atto 3 vs MG ZS EV",
      href: "/compare/byd-atto-3-vs-mg-zs-ev",
      reason:
        "If Hyundai availability is uncertain, the Atto 3 vs ZS EV comparison covers a similar buyer profile.",
    },
    relatedLinks: [
      { label: "BYD brand hub", href: "/brands/byd" },
      { label: "Hyundai brand hub", href: "/brands/hyundai" },
      { label: "Safest EVs", href: "/best-evs/safest-agent" },
    ],
  }),

  "top-10-evs-agent": guideEditorial({
    pros: [
      "Composite score ranks overall capability across categories",
      "Balanced list for buyers without a single dominant use case",
      "Good discovery entry point for new EV researchers",
    ],
    cons: [
      "Composite ranking may not match your personal priority (range vs price)",
      "Top 10 shifts as catalog and scores update",
      "Does not replace trim-level or variant-specific research",
    ],
    whoShouldBuy: [
      "Researchers starting their EV shortlist from scratch",
      "Buyers who want a balanced all-rounder before narrowing use case",
      "Readers comparing EVSavari scores across segments",
    ],
    whoShouldAvoid: [
      "Buyers with a fixed budget band — use budget or under-15L guides",
      "Commercial fleet buyers with specialised duty cycles",
      "Shoppers who already know they need a micro EV only",
    ],
    bestAlternative: {
      label: "Best family EVs",
      href: "/best-evs/family-agent",
      reason:
        "If you already know family use is primary, the family guide weights the right signals.",
    },
    relatedLinks: [
      { label: "Best highway EVs", href: "/best-evs/highway-agent" },
      { label: "How EVs work", href: "/ownership-guides/how-evs-work" },
      { label: "Browse all EVs", href: "/cars" },
    ],
  }),

  "fastest-charging-evs-agent": guideEditorial({
    pros: [
      "Ranks DC peak kW and estimated DC time from verified specs",
      "Ideal for road-trip planners and fast-charging priority buyers",
      "Surfaces EVs that minimise stop time on highways",
    ],
    cons: [
      "Peak kW rarely sustained for full session — real times vary",
      "Charger compatibility and curve shape matter as much as peak",
      "Fast-charging EVs often cost more than slower-charging peers",
    ],
    whoShouldBuy: [
      "Highway commuters who stop at DC chargers regularly",
      "Buyers comparing road-trip practicality across models",
      "Fleet operators optimising turnaround time",
    ],
    whoShouldAvoid: [
      "Pure overnight home chargers who rarely use DC",
      "Budget buyers — fast charge hardware adds cost",
      "City-only drivers with sub-30 km daily use",
    ],
    bestAlternative: {
      label: "Fastest charging variants",
      href: "/best-evs/fastest-charging-variants-agent",
      reason:
        "Trim choice affects charging hardware — see variant-level picks within each family.",
    },
    relatedLinks: [
      { label: "Fast vs slow charging", href: "/charging-guides/fast-vs-slow" },
      { label: "Highway EVs", href: "/best-evs/highway-agent" },
      { label: "Public charging", href: "/charging-guides/public-charging" },
    ],
  }),

  "longest-range-evs-agent": guideEditorial({
    pros: [
      "Prioritises ARAI range and efficiency from catalog data",
      "Helps reduce range anxiety for long-distance buyers",
      "Useful benchmark before choosing battery size",
    ],
    cons: [
      "ARAI figures exceed typical real-world mixed driving",
      "Larger batteries increase price and charging time",
      "Range alone ignores charging speed and service network",
    ],
    whoShouldBuy: [
      "Inter-city drivers who want fewer charging stops",
      "Buyers comparing battery sizes within a model line",
      "Weekend travellers in regions with sparse chargers",
    ],
    whoShouldAvoid: [
      "City commuters who over-buy battery they rarely use",
      "Tight-budget buyers paying for range they do not need",
      "Those who should prioritise charging speed instead",
    ],
    bestAlternative: {
      label: "Longest range variants",
      href: "/best-evs/longest-range-variants-agent",
      reason:
        "Within a family, the longest-range trim may differ — check variant-level rankings.",
    },
    relatedLinks: [
      { label: "Rain & range", href: "/ownership-guides/rain-range" },
      { label: "Highway ownership", href: "/ownership-guides/highway-ownership" },
      { label: "Battery health", href: "/ownership-guides/battery-health" },
    ],
  }),

  "safest-evs-agent": guideEditorial({
    pros: [
      "Weights safety-related signals available in catalog data",
      "Useful for family buyers prioritising crash and ADAS features",
      "Complements NCAP research with EVSavari scoring",
    ],
    cons: [
      "Not all models have public NCAP ratings at every trim",
      "Safety feature availability varies by variant",
      "Active safety depends on driver engagement and road conditions",
    ],
    whoShouldBuy: [
      "Families with young children prioritising safety tech",
      "Buyers cross-shopping ADAS-equipped EVs",
      "Corporate fleet managers with safety KPIs",
    ],
    whoShouldAvoid: [
      "Buyers for whom price is the only decision factor",
      "Those buying base trims without safety packs",
      "Shoppers who need commercial durability over passenger safety features",
    ],
    bestAlternative: {
      label: "Best family EVs",
      href: "/best-evs/family-agent",
      reason:
        "Family guide blends safety with space and practicality for a fuller picture.",
    },
    relatedLinks: [
      { label: "Women safety EVs", href: "/best-evs/women-safety" },
      { label: "Insurance guide", href: "/ownership-guides/insurance-tco" },
      { label: "First-time buyer guide", href: "/ownership-guides/first-time-buyer" },
    ],
  }),

  "best-value-ev-variants-agent": guideEditorial({
    pros: [
      "Compares trims on price-per-range and feature value",
      "Helps avoid overpaying for unused battery or features",
      "Catalog-wide variant scan across tier-1 families",
    ],
    cons: [
      "Best value trim can change with discounts and facelifts",
      "Lowest price trim may lack DC fast charge or ADAS",
      "Stock availability varies by city and colour",
    ],
    whoShouldBuy: [
      "Buyers deciding which trim to book within a shortlisted model",
      "Value seekers who want maximum capability per rupee",
      "Fleet buyers standardising on cost-efficient trims",
    ],
    whoShouldAvoid: [
      "Buyers who want top-spec features regardless of price",
      "Those who need immediate delivery of a rare trim",
      "Shoppers who have not yet chosen the model family",
    ],
    bestAlternative: {
      label: "Nexon EV best value variant",
      href: "/best-evs/tata-nexon-ev-best-value-variant-agent",
      reason:
        "If Nexon EV is on your shortlist, the single-family variant guide goes deeper.",
    },
    relatedLinks: [
      { label: "Budget EVs", href: "/best-evs/budget-agent" },
      { label: "Nexon vs Curvv", href: "/compare/tata-nexon-ev-vs-tata-curvv-ev" },
      { label: "Browse EVs", href: "/cars" },
    ],
  }),

  "fastest-charging-ev-variants-agent": guideEditorial({
    pros: [
      "Identifies trims with highest DC capability per model line",
      "Saves money vs guessing which variant includes faster charging",
      "Pairs well with highway and road-trip guides",
    ],
    cons: [
      "Not all variants publish full charging curves publicly",
      "Fast-charge hardware sometimes tied to top trims only",
      "Regional spec differences can affect peak kW",
    ],
    whoShouldBuy: [
      "Buyers configuring a new EV order online or at dealer",
      "Highway users who want minimum DC stop duration",
      "Readers comparing Nexon, Punch, and other multi-trim families",
    ],
    whoShouldAvoid: [
      "Home-only chargers on slow AC who never use DC",
      "Buyers locked into a single available trim in their city",
      "Those prioritising lowest purchase price over charge speed",
    ],
    bestAlternative: {
      label: "Nexon EV fastest charging variant",
      href: "/best-evs/tata-nexon-ev-fastest-charging-variant-agent",
      reason:
        "For India's best-selling EV family, see the dedicated Nexon variant pick.",
    },
    relatedLinks: [
      { label: "Fastest charging EVs", href: "/best-evs/fastest-charging-agent" },
      { label: "Charging types", href: "/charging-guides/charging-types" },
      { label: "Compare hub", href: "/compare" },
    ],
  }),

  "longest-range-ev-variants-agent": guideEditorial({
    pros: [
      "Shows which trim delivers maximum range per family",
      "Prevents buying a base pack when long-range trim fits budget",
      "Uses verified battery and range fields from catalog",
    ],
    cons: [
      "Long-range trims cost more and charge slower on same charger",
      "Real range still varies with driving and climate",
      "Some families have minimal trim differentiation on range",
    ],
    whoShouldBuy: [
      "Buyers debating battery size within one model",
      "Inter-city users who need the longest single-charge distance",
      "Research-heavy shoppers before dealer negotiation",
    ],
    whoShouldAvoid: [
      "City drivers who rarely exceed 80 km per day",
      "Budget buyers where base trim is the only option",
      "Those who should prioritise charge speed over pack size",
    ],
    bestAlternative: {
      label: "Punch EV longest range variant",
      href: "/best-evs/tata-punch-ev-longest-range-variant-agent",
      reason:
        "Compact SUV buyers should check Punch EV trim-level range before ordering.",
    },
    relatedLinks: [
      { label: "Longest range EVs", href: "/best-evs/longest-range-agent" },
      { label: "Battery lifespan", href: "/ownership-guides/battery-health" },
      { label: "Punch vs Tiago EV", href: "/compare/tata-punch-ev-vs-tata-tiago-ev" },
    ],
  }),

  "tata-nexon-ev-best-value-variant-agent": guideEditorial({
    pros: [
      "Single-family focus on India's popular Nexon EV line",
      "Value score accounts for price, range, and features per trim",
      "Clear pick before dealer upsell conversations",
    ],
    cons: [
      "Variant names and packs change with model year updates",
      "Dealer inventory may not match the optimal value trim",
      "Waiting periods differ by battery size and city",
    ],
    whoShouldBuy: [
      "Nexon EV shoppers unsure which trim to book",
      "Buyers balancing range needs vs monthly EMI",
      "First-time Tata EV customers comparing Fearless vs Empowered trims",
    ],
    whoShouldAvoid: [
      "Buyers who have already locked a specific top-spec trim",
      "Those cross-shopping entirely different segments (e.g. Comet EV)",
      "Fleet buyers with fixed spec requirements from headquarters",
    ],
    bestAlternative: {
      label: "Nexon EV vs XUV400",
      href: "/compare/tata-nexon-ev-vs-mahindra-xuv400",
      reason:
        "If you have not committed to Nexon yet, compare against XUV400 at the family level first.",
    },
    relatedLinks: [
      { label: "Tata brand hub", href: "/brands/tata" },
      { label: "Best value variants (all models)", href: "/best-evs/best-value-variants-agent" },
      { label: "Nexon EV detail", href: "/cars/tata-nexon-ev" },
    ],
  }),

  "tata-punch-ev-best-value-variant-agent": guideEditorial({
    pros: [
      "Trim-level value analysis for the compact Punch EV",
      "Helps match battery size to urban use without overspending",
      "Uses live catalog pricing where available",
    ],
    cons: [
      "Compact boot and rear seat vs larger Nexon EV",
      "Base trims may omit features you expect at this price",
      "Discounts and exchange offers vary by dealer",
    ],
    whoShouldBuy: [
      "Urban buyers set on Punch EV but unsure of trim",
      "Upgrade from Tiago EV considering space vs price",
      "Second-car households optimising city runabout cost",
    ],
    whoShouldAvoid: [
      "Families needing regular highway trips with full luggage",
      "Buyers who need maximum rear-seat comfort for adults",
      "Those who prefer MG Comet for minimal parking footprint only",
    ],
    bestAlternative: {
      label: "Punch EV vs Tiago EV",
      href: "/compare/tata-punch-ev-vs-tata-tiago-ev",
      reason:
        "If price is tight, compare Punch against Tiago EV before choosing a Punch trim.",
    },
    relatedLinks: [
      { label: "Best city EVs", href: "/best-evs/city-agent" },
      { label: "Punch vs Windsor", href: "/compare/tata-punch-ev-vs-mg-windsor-ev-agent" },
      { label: "Punch EV detail", href: "/cars/tata-punch-ev" },
    ],
  }),

  "tata-nexon-ev-fastest-charging-variant-agent": guideEditorial({
    pros: [
      "Identifies Nexon EV trim with best DC performance",
      "Useful for highway-heavy Nexon buyers",
      "Grounded in catalog charging fields, not brochure claims alone",
    ],
    cons: [
      "Fastest trim may not be best value for city-only use",
      "Charging speed depends on charger quality and SOC band",
      "Not all public chargers deliver advertised kW",
    ],
    whoShouldBuy: [
      "Nexon EV buyers who DC charge weekly or more",
      "Inter-city Nexon shoppers minimising stop time",
      "Buyers comparing Fearless+ vs other battery packs on charge speed",
    ],
    whoShouldAvoid: [
      "Pure overnight AC home chargers in city-only duty",
      "Budget buyers where base trim is the only affordable option",
      "Those who have not yet confirmed Nexon over Curvv or XUV400",
    ],
    bestAlternative: {
      label: "Fastest charging EVs (all models)",
      href: "/best-evs/fastest-charging-agent",
      reason:
        "Cross-check whether another model family charges faster before locking Nexon trim.",
    },
    relatedLinks: [
      { label: "Fast vs slow charging", href: "/charging-guides/fast-vs-slow" },
      { label: "Nexon best value variant", href: "/best-evs/tata-nexon-ev-best-value-variant-agent" },
      { label: "Highway EVs", href: "/best-evs/highway-agent" },
    ],
  }),

  "tata-punch-ev-longest-range-variant-agent": guideEditorial({
    pros: [
      "Shows which Punch EV trim maximises range",
      "Helps compact SUV buyers avoid range shortfall on weekends",
      "Pairs with city and budget guides for full context",
    ],
    cons: [
      "Longest-range Punch trim costs more than base",
      "Compact class still limits absolute range vs mid-size EVs",
      "Real-world range drops in heat, rain, and highway speed",
    ],
    whoShouldBuy: [
      "Punch EV buyers with occasional highway use",
      "Urban families wanting extra buffer for AC and traffic",
      "Buyers debating standard vs extended range pack",
    ],
    whoShouldAvoid: [
      "Pure city drivers who never exceed 50 km daily",
      "Buyers who should step up to Nexon EV for family space",
      "Those prioritising lowest EMI over range headroom",
    ],
    bestAlternative: {
      label: "Longest range EVs (all models)",
      href: "/best-evs/longest-range-agent",
      reason:
        "If Punch range is insufficient, see which model classes deliver materially more distance.",
    },
    relatedLinks: [
      { label: "Punch best value variant", href: "/best-evs/tata-punch-ev-best-value-variant-agent" },
      { label: "Rain & range", href: "/ownership-guides/rain-range" },
      { label: "Punch EV detail", href: "/cars/tata-punch-ev" },
    ],
  }),
};

/** @param {string} slug */
export function getTop20Editorial(slug) {
  return TOP20_EDITORIAL_BY_SLUG[slug] || null;
}
