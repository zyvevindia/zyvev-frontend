/**
 * EV myths editorial pages — calm, trust-first, India-focused.
 */

const DISCLAIM =
  "Outcomes vary by model, city, and usage — verify warranty and service terms locally.";

function myths(pairs) {
  return pairs.map(([myth, reality]) => ({ myth, reality }));
}

function mythPage(cfg) {
  return {
    category: "authority",
    routeFamily: "ownership",
    vehiclePickSeed: cfg.id,
    learningPathwayId: "ev_myths",
    ...cfg,
    tradeoffs: cfg.tradeoffs || [
      "No EV removes every constraint — charging access and km pattern still decide fit.",
      DISCLAIM,
    ],
    compareSupportHrefs: cfg.compareSupportHrefs || [
      { label: "EV myths hub", href: "/ownership-guides/ev-myths" },
      { label: "Compare EVs", href: "/compare" },
      { label: "How EVs work", href: "/ownership-guides/how-evs-work" },
    ],
  };
}

export const AUTHORITY_MYTH_TOPICS = [
  {
    id: "ev-myths-hub",
    contentSlug: "authority-ev-myths-hub",
    segment: "ev-myths",
    path: "/ownership-guides/ev-myths",
    category: "authority",
    routeFamily: "ownership",
    vehiclePickSeed: "ev-myths-hub",
    learningPathwayId: "ev_myths",
    h1: "EV Myths vs Reality — Calm Guide for Indian Buyers",
    intro:
      "Social media amplifies extreme EV stories. This hub separates common myths from practical reality — with limitations acknowledged — so you can compare models with less anxiety.",
    editorialSections: [
      {
        id: "introduction",
        title: "Why myths spread",
        type: "introduction",
        paragraphs: [
          "EVs are new to many Indian households. A single viral fire clip or one bad charging experience gets shared as if it applies to every model.",
          "Use these short explainers before you reject — or buy — an EV based on fear alone.",
        ],
      },
      {
        id: "myth-index",
        title: "Explore by concern",
        type: "practical",
        links: [
          { label: "Do batteries die quickly?", href: "/ownership-guides/myth-battery-dies-quickly" },
          { label: "Rain and flood safety", href: "/ownership-guides/myth-rain-flood-safety" },
          { label: "Fire risk", href: "/ownership-guides/myth-fire-risk" },
          { label: "Highway practicality", href: "/ownership-guides/myth-highway-practicality" },
          { label: "Apartment charging", href: "/ownership-guides/myth-apartment-charging-impossible" },
          { label: "Maintenance cost", href: "/ownership-guides/myth-maintenance-expensive" },
          { label: "Battery replacement cost", href: "/ownership-guides/myth-battery-replacement-cost" },
          { label: "Resale value", href: "/ownership-guides/myth-resale-value-loss" },
        ],
      },
      {
        id: "ownership-realism",
        title: "What we will not claim",
        type: "ownership_realism",
        paragraphs: [
          "EVs are not perfect for every parking situation or budget. Our goal is accurate expectations — not winning an argument online.",
        ],
      },
      {
        id: "compare-support",
        title: "Next step: compare with context",
        type: "compare_support",
        links: [
          { label: "First-time buyer guide", href: "/ownership-guides/first-time-buyers" },
          { label: "Open compare", href: "/compare" },
        ],
      },
    ],
    faq: [
      { question: "Should I believe every negative EV post?", answer: "Treat viral clips as signals to research — not final verdicts on all EVs." },
      { question: "Are EVs ready for India?", answer: "Many owners succeed in cities with planned charging — others wait until parking is solved." },
      { question: "Where to start?", answer: "Pick the myth closest to your worry, then shortlist two models to compare." },
      { question: "Is this legal or financial advice?", answer: "No — educational guidance only." },
      { question: "How does EVSavari compare?", answer: "We show tradeoffs and label estimates — not paid winners." },
    ],
    relatedHrefs: [
      { label: "Beginner: how EVs work", href: "/ownership-guides/how-evs-work" },
      { label: "Charging types", href: "/charging-guides/charging-types" },
    ],
    compareSupportHrefs: [
      { label: "Compare EVs", href: "/compare" },
      { label: "First-time buyer guide", href: "/ownership-guides/first-time-buyers" },
      { label: "Apartment suitability", href: "/ownership-guides/apartment-suitability" },
    ],
  },
  mythPage({
    id: "myth-battery-dies-quickly",
    contentSlug: "authority-myth-battery-dies-quickly",
    segment: "myth-battery-dies-quickly",
    path: "/ownership-guides/myth-battery-dies-quickly",
    h1: "Do EV Batteries Die Quickly? Myth vs Reality",
    intro:
      "The myth: EV batteries become useless within a few years. The reality: packs age gradually; warranties and habits matter more than viral anecdotes.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["You may hear that all EV batteries ‘die’ after three years. That generalisation ignores warranty terms, climate, and how the car is charged."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Gradual capacity loss is normal — it is not usually sudden total failure.",
          "Manufacturers publish warranty thresholds — read your variant’s document.",
          "Heat and frequent unnecessary DC fast charging can accelerate wear.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Limitations to accept",
        type: "ownership_realism",
        paragraphs: [
          "A 8–10 year old EV may suit low km buyers differently than a heavy highway user — inspect used packs carefully.",
        ],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["All packs fail at the same rate", "Chemistry, thermal management, and usage differ by model."],
          ["Software fixes all degradation", "Software manages health — physical ageing still occurs."],
        ]),
      },
      {
        id: "beginner",
        title: "Beginner guidance",
        type: "practical",
        bullets: ["Track your weekly km before buying kWh you will never use.", "Ask the dealer for warranty transfer rules on used EVs."],
      },
      {
        id: "compare-support",
        title: "Compare with battery context",
        type: "compare_support",
        links: [
          { label: "Battery lifespan guide", href: "/ownership-guides/battery-lifespan" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    faq: [
      { question: "Will my battery die in three years?", answer: "Unlikely as a sudden total failure — plan for gradual range change over years." },
      { question: "Does fast charging ruin batteries?", answer: "Occasional DC is fine for many owners — constant fast charging without need may add stress." },
      { question: "What does warranty usually cover?", answer: "Capacity or defect thresholds for a period — terms vary by brand." },
      { question: "Used EV risk?", answer: "Request service history and a drive that matches your km needs." },
      { question: "Next step?", answer: "Compare battery sizes only after your commute pattern is clear." },
    ],
    relatedHrefs: [
      { label: "Battery health ownership", href: "/ownership-guides/battery-health" },
      { label: "Replacement cost myth", href: "/ownership-guides/myth-battery-replacement-cost" },
    ],
  }),
  mythPage({
    id: "myth-rain-flood-safety",
    contentSlug: "authority-myth-rain-flood-safety",
    segment: "myth-rain-flood-safety",
    path: "/ownership-guides/myth-rain-flood-safety",
    h1: "Are EVs Safe in Rain and Floods? Myth vs Reality",
    intro:
      "The myth: EVs are unsafe in monsoon. The reality: roadworthy EVs meet insulation standards — but deep flooding is dangerous for any vehicle, petrol or electric.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["Rainy-season posts suggest EVs shock easily or fail in puddles. Certified high-voltage systems are designed with weather in mind — misuse still creates risk."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Normal rain driving is part of everyday ownership for many Indian EV users.",
          "Avoid driving through deep, moving flood water — same guidance as petrol cars.",
          "Charging equipment must be rated and installed for its location (covered, outdoor-rated, etc.).",
        ],
      },
      {
        id: "ownership-realism",
        title: "When caution is wise",
        type: "ownership_realism",
        paragraphs: ["Submerged pack damage can be serious and expensive — insurance and safety rules apply to any vehicle type."],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["You cannot charge in rain", "Rated outdoor gear exists — follow OEM and installer guidance."],
          ["EVs always short in puddles", "Roadworthy systems are tested — avoid unapproved wiring."],
        ]),
      },
      {
        id: "compare-support",
        title: "Related guides",
        type: "compare_support",
        links: [
          { label: "Monsoon driving", href: "/ownership-guides/monsoon-driving" },
          { label: "Overnight charging safety", href: "/charging-guides/overnight-safety" },
        ],
      },
    ],
    faq: [
      { question: "Can I drive in heavy rain?", answer: "Yes with a maintained roadworthy car — avoid deep floods." },
      { question: "Is home charging safe in monsoon?", answer: "Use certified install — not ad-hoc extensions." },
      { question: "What if water enters the cabin?", answer: "Stop, assess, and follow insurer/OEM guidance — do not DIY high-voltage work." },
      { question: "Are floods different from rain?", answer: "Yes — deep flooding is a serious hazard for any vehicle." },
      { question: "Compare next?", answer: "Factor monsoon range habits when you compare range estimates." },
    ],
    relatedHrefs: [
      { label: "Rain range impact", href: "/ownership-guides/rain-range" },
      { label: "Fire risk myth", href: "/ownership-guides/myth-fire-risk" },
    ],
  }),
  mythPage({
    id: "myth-fire-risk",
    contentSlug: "authority-myth-fire-risk",
    segment: "myth-fire-risk",
    path: "/ownership-guides/myth-fire-risk",
    h1: "Do EVs Catch Fire Easily? Myth vs Reality",
    intro:
      "The myth: EVs are inherently fire-prone. The reality: thermal incidents get disproportionate attention; causes are often investigated case-by-case — safety still requires proper repair and charging practice.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["High-profile fire videos create fear. All cars carry energy — EV incidents are visible in media but not the whole ownership story."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Use authorised service for battery or high-voltage work.",
          "Avoid damage to the pack from scrapes or unauthorised modifications.",
          "Follow recall and software advisories from the brand.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Limitations",
        type: "ownership_realism",
        paragraphs: ["When incidents occur, causes matter — charging setup, collision damage, or defects. Blanket fear is not a buying method."],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["Every EV is one spark away", "Millions of km are driven daily — media highlights rare events."],
          ["Home charging is always the cause", "Investigations vary — certified install reduces risk."],
        ]),
      },
      {
        id: "compare-support",
        title: "Stay calm, stay informed",
        type: "compare_support",
        links: [
          { label: "Extension board risks", href: "/charging-guides/extension-board-risks" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    faq: [
      { question: "Are EVs less safe than petrol?", answer: "Roadworthy EVs meet safety standards — risk depends on use, damage, and maintenance." },
      { question: "Can I park in sun?", answer: "Normal parking is fine — follow OEM guidance for extreme heat." },
      { question: "Should I avoid fast charging?", answer: "Use DC when needed — follow brand guidance." },
      { question: "What after a crash?", answer: "Insurer and authorised workshop assessment — do not ignore pack inspections." },
      { question: "Next?", answer: "Compare safety features on variants you actually consider buying." },
    ],
    relatedHrefs: [{ label: "Rain safety myth", href: "/ownership-guides/myth-rain-flood-safety" }],
  }),
  mythPage({
    id: "myth-highway-practicality",
    contentSlug: "authority-myth-highway-practicality",
    segment: "myth-highway-practicality",
    path: "/ownership-guides/myth-highway-practicality",
    h1: "Are EVs Practical for Highways? Myth vs Reality",
    intro:
      "The myth: EVs cannot do highways. The reality: many EVs handle inter-city trips with planning — some owners rarely need highways; others should choose range and charging accordingly.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["Short clips of stranded cars ignore the many completed highway trips with planned DC stops."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Plan DC stops using apps — verify live status.",
          "Carry buffer range — heat and speed affect km.",
          "Smaller packs need more frequent stops — match car to your trip pattern.",
        ],
      },
      {
        id: "ownership-realism",
        title: "When highways are hard",
        type: "ownership_realism",
        paragraphs: [
          "Sparse corridors or tight timelines can make an EV stressful — that is a fit problem, not a universal EV failure.",
        ],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["Brochure range equals highway range", "High speed and AC load reduce km."],
          ["One failed charger means EVs fail", "Planning alternate stops is part of ownership."],
        ]),
      },
      {
        id: "compare-support",
        title: "Highway-ready compare",
        type: "compare_support",
        links: [
          { label: "Highway ownership guide", href: "/ownership-guides/highway-ownership" },
          { label: "Public charging guide", href: "/charging-guides/public-charging" },
          { label: "Highway discovery", href: "/discover/highway-evs" },
        ],
      },
    ],
    faq: [
      { question: "Can I do Mumbai–Pune in an EV?", answer: "Many owners do with planning — confirm charger availability on your date." },
      { question: "Do I need the biggest battery?", answer: "Only if your trips need it — city-only owners may overpay for kWh." },
      { question: "How much buffer?", answer: "Experienced owners leave margin for heat, traffic, and charger queues." },
      { question: "Family trips?", answer: "See family ownership guide for space and charging stops." },
      { question: "Compare?", answer: "Compare highway usability and DC peak kW on shortlisted models." },
    ],
    relatedHrefs: [
      { label: "Fast vs slow charging", href: "/charging-guides/fast-vs-slow" },
      { label: "City commute guide", href: "/ownership-guides/city-commute" },
    ],
  }),
  mythPage({
    id: "myth-apartment-charging-impossible",
    contentSlug: "authority-myth-apartment-charging-impossible",
    segment: "myth-apartment-charging-impossible",
    path: "/ownership-guides/myth-apartment-charging-impossible",
    h1: "Is EV Charging Impossible in Apartments? Myth vs Reality",
    intro:
      "The myth: apartments block EV ownership. The reality: society approvals and shared infrastructure take time — many owners use workplace or public backup while RWAs progress.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["Frustrating RWA meetings are real — but ‘impossible’ ignores societies that have approved points and owners using mixed strategies."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Start RWA conversations before you buy — not after.",
          "Shared basement points with metering reduce conflict.",
          "Workplace charging can carry weekday km for some owners.",
        ],
      },
      {
        id: "ownership-realism",
        title: "When to wait",
        type: "ownership_realism",
        paragraphs: ["If you have no parking, no society path, and no reliable public backup near your routine, an EV may feel harder than petrol today."],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["Every apartment bans EVs", "Policies differ building to building."],
          ["Public charging replaces home always", "It can work for some — others need patience with queues."],
        ]),
      },
      {
        id: "compare-support",
        title: "Apartment compare support",
        type: "compare_support",
        links: [
          { label: "Apartment suitability", href: "/ownership-guides/apartment-suitability" },
          { label: "Apartment setup guide", href: "/charging-guides/apartment-setup" },
        ],
      },
    ],
    faq: [
      { question: "Should I buy before RWA approval?", answer: "Risky — get clarity on the approval path first." },
      { question: "Renters?", answer: "Get landlord/building clarity in writing." },
      { question: "Street parking?", answer: "Often the hardest — map public AC/DC near home." },
      { question: "Extension cord from window?", answer: "Avoid unsafe shortcuts — see extension board guide." },
      { question: "Compare?", answer: "Compare lower charging-stress models if public backup is your plan." },
    ],
    relatedHrefs: [
      { label: "Society & RWA", href: "/ownership-guides/society-rwa" },
      { label: "Apartment discovery", href: "/discover/apartment-living" },
    ],
  }),
  mythPage({
    id: "myth-maintenance-expensive",
    contentSlug: "authority-myth-maintenance-expensive",
    segment: "myth-maintenance-expensive",
    path: "/ownership-guides/myth-maintenance-expensive",
    h1: "Is EV Maintenance Expensive? Myth vs Reality",
    intro:
      "The myth: EV servicing costs the same as luxury petrol bills. The reality: fewer engine items exist — tyres, brakes, filters, and software still need care.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["Dealer quotes for unfamiliar parts can look high — compare what is actually scheduled vs petrol equivalents."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Regen can slow brake wear — inspections still matter.",
          "Tyre costs remain — EV weight affects wear.",
          "Authorised workshops matter for warranty and high-voltage work.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Where costs can rise",
        type: "ownership_realism",
        paragraphs: ["Out-of-warranty high-voltage repairs can be costly — read warranty before purchase."],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["Zero maintenance forever", "Schedules are lighter, not absent."],
          ["Any garage is equal", "Battery-related work needs authorised capability."],
        ]),
      },
      {
        id: "compare-support",
        title: "Learn more",
        type: "compare_support",
        links: [
          { label: "Maintenance basics", href: "/ownership-guides/maintenance-basics" },
          { label: "Service network guide", href: "/ownership-guides/service-network" },
        ],
      },
    ],
    faq: [
      { question: "Are EVs cheaper to maintain?", answer: "Often lower routine engine work — budget tyres and scheduled checks." },
      { question: "Software updates?", answer: "May be included or billed — ask the brand." },
      { question: "Independent garages?", answer: "Fine for some items — not for all high-voltage jobs." },
      { question: "Warranty void?", answer: "Skipping authorised service can affect claims — read terms." },
      { question: "Compare?", answer: "Factor service network in your city when comparing brands." },
    ],
    relatedHrefs: [{ label: "Low-maintenance picks", href: "/ownership-guides/low-maintenance" }],
  }),
  mythPage({
    id: "myth-battery-replacement-cost",
    contentSlug: "authority-myth-battery-replacement-cost",
    segment: "myth-battery-replacement-cost",
    path: "/ownership-guides/myth-battery-replacement-cost",
    h1: "Are EV Batteries Extremely Expensive to Replace? Myth vs Reality",
    intro:
      "The myth: every owner will pay lakhs for a new pack soon. The reality: warranty covers many defect cases; out-of-warranty replacements are rare in young fleets — but quotes can be high when needed.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["Replacement headlines ignore that most owners sell or trade before needing a pack — and warranties cover many early-life issues."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Read warranty capacity/defect clauses for your variant.",
          "Used EV buyers should verify pack health and remaining warranty.",
          "Driving habits influence long-term health — see battery lifespan guide.",
        ],
      },
      {
        id: "ownership-realism",
        title: "If a quote appears",
        type: "ownership_realism",
        paragraphs: ["Out-of-warranty pack quotes can be a large bill — that risk matters more for older high-km cars than new city commuters."],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["Every owner replaces battery once", "Many vehicles change hands before that point."],
          ["Third-party packs are always cheap", "Compatibility, safety, and warranty matter — proceed carefully."],
        ]),
      },
      {
        id: "compare-support",
        title: "Compare responsibly",
        type: "compare_support",
        links: [
          { label: "Battery lifespan", href: "/ownership-guides/battery-lifespan" },
          { label: "Used EV buying", href: "/ownership-guides/used-ev-buying" },
        ],
      },
    ],
    faq: [
      { question: "Typical replacement cost?", answer: "Varies widely by model and era — ask authorised centres for your variant, not rumours." },
      { question: "Will warranty cover me?", answer: "If terms are met — yes for qualifying defects; wear may differ." },
      { question: "Can I insure pack risk?", answer: "Check policies available in your market — terms vary." },
      { question: "Buy extended warranty?", answer: "Compare cost vs how long you will keep the car." },
      { question: "Next?", answer: "Prioritise models with clear warranty language if anxiety is high." },
    ],
    relatedHrefs: [
      { label: "Battery dies quickly myth", href: "/ownership-guides/myth-battery-dies-quickly" },
      { label: "Resale myth", href: "/ownership-guides/myth-resale-value-loss" },
    ],
  }),
  mythPage({
    id: "myth-resale-value-loss",
    contentSlug: "authority-myth-resale-value-loss",
    segment: "myth-resale-value-loss",
    path: "/ownership-guides/myth-resale-value-loss",
    h1: "Do EVs Lose Resale Value Quickly? Myth vs Reality",
    intro:
      "The myth: EV resale is always terrible. The reality: the used EV market is still maturing — some models hold value well; others fall faster when new tech or charging worry dominates.",
    editorialSections: [
      {
        id: "myth-intro",
        title: "The myth",
        type: "introduction",
        paragraphs: ["Early adopters faced thin used markets. Today, more data exists — but EV resale still varies more than mature petrol segments."],
      },
      {
        id: "reality",
        title: "Practical reality",
        type: "practical",
        bullets: [
          "Battery health documentation helps used pricing.",
          "Popular city models with strong service may retain better.",
          "Rapid new launches can pressure older variants.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Plan your hold period",
        type: "ownership_realism",
        paragraphs: [
          "If you swap cars every 3–4 years, research resale for your exact variant now — not after purchase.",
        ],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["All EVs are worthless used", "Demand exists for well-documented city commuters."],
          ["Resale equals petrol curves", "EV secondary markets are younger — expect volatility."],
        ]),
      },
      {
        id: "compare-support",
        title: "Ownership cost context",
        type: "compare_support",
        links: [
          { label: "Resale value guide", href: "/ownership-guides/resale-value" },
          { label: "Running cost guide", href: "/ownership-guides/running-cost" },
        ],
      },
    ],
    faq: [
      { question: "Will I lose more than petrol?", answer: "Depends on model, km, battery perception, and local demand — research your variant." },
      { question: "Improve resale?", answer: "Service history, battery health reports, and realistic km." },
      { question: "Lease vs buy?", answer: "Leasing shifts resale risk — compare total cost." },
      { question: "Buy used instead?", answer: "See used EV buying guide — verify pack and warranty." },
      { question: "Compare?", answer: "Balance running savings vs resale uncertainty for your hold period." },
    ],
    relatedHrefs: [
      { label: "Insurance & TCO", href: "/ownership-guides/insurance-tco" },
      { label: "Battery replacement myth", href: "/ownership-guides/myth-battery-replacement-cost" },
    ],
  }),
];
