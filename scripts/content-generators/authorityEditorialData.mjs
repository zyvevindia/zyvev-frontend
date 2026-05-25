/**
 * Authority editorial copy — calm, India-focused, human-review-ready.
 * No fabricated statistics or guaranteed savings.
 */

/** @typedef {import('./authorityPages.mjs').AuthorityTopicConfig} AuthorityTopicConfig */

const IN = "India";
const DISCLAIM =
  "Figures vary by city, tariff, and driving style — verify locally before deciding.";

function myths(pairs) {
  return pairs.map(([myth, reality]) => ({ myth, reality }));
}

/** @type {AuthorityTopicConfig[]} */
export const AUTHORITY_POPULATION_TOPICS = [
  {
    id: "how-evs-work",
    contentSlug: "authority-how-evs-work",
    segment: "how-evs-work",
    routeFamily: "ownership",
    path: "/ownership-guides/how-evs-work",
    h1: "How EVs Work — A Calm Beginner Guide for India",
    category: "authority",
    vehiclePickSeed: "how-evs-work",
    intro: `Electric cars in ${IN} still feel new to many buyers. This guide explains how an EV moves, stores energy, and differs from petrol day-to-day — without promising zero hassle or unlimited range.`,
    editorialSections: [
      {
        id: "introduction",
        title: "Beginner introduction",
        type: "introduction",
        paragraphs: [
          "An electric vehicle uses a battery pack and an electric motor instead of a petrol engine. When you press the accelerator, the motor draws energy from the battery. When you slow down, many EVs recover some energy through regenerative braking.",
          "For most owners, the meaningful change is not the motor alone — it is how you refuel (charge), plan range, and maintain the car over years.",
        ],
      },
      {
        id: "practical",
        title: "Practical explanation",
        type: "practical",
        bullets: [
          "Home or workplace AC charging covers many commutes if parking allows it.",
          "DC fast charging helps highway trips but should not be the only plan for daily life.",
          "Range on the dashboard is an estimate — traffic, heat, and speed shift real km.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Ownership realism",
        type: "ownership_realism",
        paragraphs: [
          "EVs can lower running cost for predictable km, but upfront price, insurance, and charging setup still matter.",
          "Apartment parking without a dedicated point often means slower adoption — plan charging before you shortlist models.",
        ],
      },
      {
        id: "concerns",
        title: "Common beginner concerns",
        type: "common_concerns",
        bullets: [
          "Will the battery fail soon? — Modern packs have warranties; habits and heat still matter.",
          "Is servicing zero? — Fewer moving parts, but tyres, brakes, coolant, and software updates remain.",
          "Can any electrician install charging? — Prefer OEM-approved or certified installers.",
        ],
      },
      {
        id: "misconceptions",
        title: "Misconceptions to avoid",
        type: "misconceptions",
        misconceptions: myths([
          ["Every EV pays for itself in one year", "Savings depend on km, tariff, and petrol prices — model carefully."],
          ["More kWh always means better for you", "A larger pack adds cost and weight — match range to your real commute."],
          ["Public chargers will cover daily needs", "Treat public DC as backup unless your parking cannot support AC."],
        ]),
      },
      {
        id: "compare-support",
        title: "How this connects to compare",
        type: "compare_support",
        paragraphs: [
          "After you understand basics, compare two or three model families on range bands, charging speed, and boot space — not marketing claims alone.",
        ],
        links: [
          { label: "Open EV compare", href: "/compare" },
          { label: "EVs under ₹15 lakh", href: "/discover/under-15-lakh" },
        ],
      },
    ],
    tradeoffs: [
      "Charging access in your building may limit which models feel easy to own.",
      "Highway-heavy users need honest DC planning — not just brochure range.",
      DISCLAIM,
    ],
    faq: [
      { question: "Do EVs have gears?", answer: "Most consumer EVs use a single drive ratio — you drive like an automatic without gear shifts." },
      { question: "Can I drive an EV in heavy rain?", answer: "Yes with roadworthy equipment — avoid unsafe extension charging setups." },
      { question: "How often do I charge?", answer: "Many owners charge overnight every few days based on km — not necessarily every night." },
      { question: "Is an EV harder to drive?", answer: "Usually easier in city traffic — the learning curve is charging and range planning." },
      { question: "Where should I go next?", answer: "Shortlist models, then compare on EVSavari with your real commute km in mind." },
    ],
    relatedHrefs: [
      { label: "EV charging types explained", href: "/charging-guides/charging-types" },
      { label: "First-time buyer guide", href: "/ownership-guides/first-time-buyers" },
    ],
    compareSupportHrefs: [
      { label: "Compare EVs", href: "/compare" },
      { label: "Home charging guide", href: "/charging-guides/home-charging" },
      { label: "Running cost reality", href: "/ownership-guides/running-cost" },
    ],
  },
  {
    id: "ev-charging-types-explained",
    contentSlug: "authority-ev-charging-types",
    segment: "charging-types",
    routeFamily: "charging",
    path: "/charging-guides/charging-types",
    h1: "EV Charging Types Explained — AC, DC & What You Actually Need",
    category: "authority",
    vehiclePickSeed: "charging-types",
    intro: `Confused by AC slow charging, DC fast charging, and connector names? This guide explains charging types in plain language for ${IN} buyers — focused on what fits your parking and commute.`,
    editorialSections: [
      {
        id: "introduction",
        title: "Beginner introduction",
        type: "introduction",
        paragraphs: [
          "Charging type is about speed and location: slow AC at home or work, faster DC at public stations. Your daily need is usually solved by AC if you can park long enough.",
        ],
      },
      {
        id: "practical",
        title: "AC vs DC in practice",
        type: "practical",
        bullets: [
          "AC (often 3.3–7.4 kW home): overnight top-ups for city commutes.",
          "DC fast (public): useful for trips and emergencies — not required every day for everyone.",
          "Connector compatibility: confirm what your shortlisted model accepts before buying.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Charging convenience realism",
        type: "ownership_realism",
        paragraphs: [
          "If you cannot charge where you park, daily life depends on public infrastructure — that may be improving but is not uniform in every city.",
        ],
      },
      {
        id: "misconceptions",
        title: "Charging myths",
        type: "misconceptions",
        misconceptions: myths([
          ["You must DC fast charge daily", "Most owners rely on AC for routine km."],
          ["Any socket is fine", "Uncertified extension setups carry fire risk — use proper equipment."],
        ]),
      },
      {
        id: "compare-support",
        title: "Compare with charging in mind",
        type: "compare_support",
        links: [
          { label: "Fast vs slow charging guide", href: "/charging-guides/fast-vs-slow" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    tradeoffs: [
      "Faster on-board charging hardware can cost more — match it to real travel, not brochure peaks.",
      "Apartment owners should read society/RWA guidance before assuming home AC.",
      DISCLAIM,
    ],
    faq: [
      { question: "What is AC charging?", answer: "Alternating current charging — typical home/workplace wallboxes and many society points." },
      { question: "What is DC fast charging?", answer: "Direct current at public stations for quicker sessions — useful on highways." },
      { question: "Do I need a fast charger at home?", answer: "Usually no — many Indian commutes suit overnight AC." },
      { question: "Will the wrong plug slow me down?", answer: "Yes — verify connector and on-board charger kW on your variant." },
      { question: "Next step?", answer: "Read fast vs slow guide, then compare models with your parking situation." },
    ],
    relatedHrefs: [
      { label: "Home charging explained", href: "/charging-guides/home-charging" },
      { label: "Apartment charging setup", href: "/charging-guides/apartment-setup" },
    ],
    compareSupportHrefs: [
      { label: "Home charging", href: "/charging-guides/home-charging" },
      { label: "Apartment setup", href: "/charging-guides/apartment-setup" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "ev-maintenance-explained",
    contentSlug: "authority-ev-maintenance",
    segment: "maintenance-basics",
    routeFamily: "ownership",
    path: "/ownership-guides/maintenance-basics",
    h1: "EV Maintenance Explained — What Still Needs Care in India",
    category: "authority",
    vehiclePickSeed: "ev-maintenance",
    intro: "EV maintenance is often described as ‘zero service’. In reality, fewer engine items exist — but tyres, brakes, filters, coolant, and software updates still matter for safe ownership.",
    editorialSections: [
      {
        id: "introduction",
        title: "What changes vs petrol",
        type: "introduction",
        paragraphs: [
          "You generally skip oil changes and exhaust-related parts. The battery and motor still need monitoring through service schedules and warnings.",
        ],
      },
      {
        id: "practical",
        title: "Practical service checklist",
        type: "practical",
        bullets: [
          "Tyre rotation and alignment — EV weight affects wear.",
          "Brake fluid and pads — regen reduces use but does not eliminate service.",
          "Cabin filter and wiper care — especially before monsoon.",
          "Software updates — follow brand guidance at authorised centres.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Ownership realism",
        type: "ownership_realism",
        paragraphs: [
          "Service network coverage in your city still matters — especially for warranty claims and high-voltage checks.",
        ],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["EVs never need service", "Schedules are lighter, not absent."],
          ["Any workshop can service high-voltage systems", "Use authorised networks for battery-related work."],
        ]),
      },
      {
        id: "compare-support",
        title: "Compare service access",
        type: "compare_support",
        links: [{ label: "Compare EVs", href: "/compare" }, { label: "Service network guide", href: "/ownership-guides/service-network" }],
      },
    ],
    tradeoffs: [
      "Out-of-town travel may need planning if service centres are sparse.",
      "Independent garages may lack specialised EV tooling — confirm before purchase.",
      DISCLAIM,
    ],
    faq: [
      { question: "How often should I service an EV?", answer: "Follow the brand schedule — often annual or km-based, lighter than many petrol cars." },
      { question: "Are brakes cheaper?", answer: "Often slower wear due to regen — still inspect regularly." },
      { question: "Does battery need ‘service’?", answer: "Health checks may be recommended — read warranty terms." },
      { question: "Monsoon preparation?", answer: "See monsoon driving guide for range and safety habits." },
      { question: "Compare next?", answer: "Shortlist brands with service presence in your city." },
    ],
    relatedHrefs: [
      { label: "Battery lifespan", href: "/ownership-guides/battery-lifespan" },
      { label: "Low-maintenance picks", href: "/ownership-guides/low-maintenance" },
    ],
    compareSupportHrefs: [
      { label: "Compare EVs", href: "/compare" },
      { label: "Running cost guide", href: "/ownership-guides/running-cost" },
    ],
  },
  {
    id: "ev-battery-lifespan",
    contentSlug: "authority-ev-battery-lifespan",
    segment: "battery-lifespan",
    routeFamily: "ownership",
    path: "/ownership-guides/battery-lifespan",
    h1: "EV Battery Lifespan Explained — Calm, Honest Guidance",
    category: "authority",
    vehiclePickSeed: "battery-lifespan",
    intro: "Battery lifespan is the heart of EV anxiety. This guide explains degradation in plain language — warranties, habits, and heat — without promising a ‘forever’ pack.",
    editorialSections: [
      {
        id: "introduction",
        title: "What ‘lifespan’ means",
        type: "introduction",
        paragraphs: [
          "Batteries slowly lose usable capacity over years. Manufacturers quote warranties with thresholds — read the fine print for your variant.",
        ],
      },
      {
        id: "practical",
        title: "Habits that matter in India",
        type: "practical",
        bullets: [
          "Frequent DC fast charging can add heat stress — balance with AC when possible.",
          "Parking in extreme heat — use shade where you can.",
          "Letting the pack sit at 100% for weeks — many owners stay between comfortable daily bands.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Resale and long-term value",
        type: "ownership_realism",
        paragraphs: [
          "Used EV pricing still reflects battery uncertainty — get documented service history when buying pre-owned.",
        ],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["Batteries die in three years", "Many packs age gradually; warranty terms define support."],
          ["Always charge to 100%", "Daily habits can favour a lower ceiling unless you need full range tomorrow."],
        ]),
      },
      {
        id: "compare-support",
        title: "Compare battery sizes honestly",
        type: "compare_support",
        links: [
          { label: "Battery health guide", href: "/ownership-guides/battery-health" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    tradeoffs: [
      "Larger packs cost more upfront — buy capacity you use, not brochure maximum.",
      "Climate and driving style change real-world retention.",
      DISCLAIM,
    ],
    faq: [
      { question: "What warranty should I look for?", answer: "Years and km on the traction battery — note exclusions and authorised service rules." },
      { question: "Does fast charging ruin batteries?", answer: "Occasional DC is normal — constant fast charging without need may accelerate wear." },
      { question: "Can software fix degradation?", answer: "Software manages health — physical wear still occurs gradually." },
      { question: "Used EV battery risk?", answer: "Request history, warranty transfer rules, and a drive that matches your km needs." },
      { question: "Next step?", answer: "Compare range bands on EVSavari, then read running cost guide." },
    ],
    relatedHrefs: [
      { label: "Battery health ownership", href: "/ownership-guides/battery-health" },
      { label: "Used EV buying", href: "/ownership-guides/used-ev-buying" },
    ],
    compareSupportHrefs: [
      { label: "Compare EVs", href: "/compare" },
      { label: "Running cost", href: "/ownership-guides/running-cost" },
    ],
  },
  {
    id: "fast-vs-slow-charging",
    contentSlug: "authority-fast-vs-slow",
    segment: "fast-vs-slow",
    routeFamily: "charging",
    path: "/charging-guides/fast-vs-slow",
    h1: "Fast Charging vs Slow Charging — What Indian Owners Need",
    category: "authority",
    vehiclePickSeed: "fast-vs-slow",
    intro: "Fast DC and slow AC solve different problems. This guide helps you choose habits that match your parking, commute, and occasional highway trips — without overbuilding home infrastructure.",
    editorialSections: [
      {
        id: "introduction",
        title: "Definitions without jargon overload",
        type: "introduction",
        paragraphs: [
          "Slow charging usually means AC overnight or during work hours. Fast charging means DC sessions at public stations for quicker top-ups.",
        ],
      },
      {
        id: "practical",
        title: "Real-world practicality",
        type: "practical",
        bullets: [
          "City commute under ~40–50 km/day: AC often sufficient if you park 6–8 hours.",
          "Monthly highway leg: plan DC stops using realistic range, not brochure peaks.",
          "Apartment without dedicated point: treat public AC/DC as backup — start RWA talks early.",
        ],
      },
      {
        id: "charging-safety",
        title: "Charging safety notes",
        type: "charging_safety",
        bullets: [
          "Use certified install for home AC — avoid ad-hoc extension boards.",
          "In rain, use equipment rated for outdoor use — follow OEM guidance.",
        ],
      },
      {
        id: "misconceptions",
        title: "Myths",
        type: "misconceptions",
        misconceptions: myths([
          ["Maximum DC kW is all that matters", "On-board limits and battery temperature still cap speed."],
          ["Home must match public DC speed", "Home AC is about convenience, not highway parity."],
        ]),
      },
      {
        id: "compare-support",
        title: "Still unsure?",
        type: "compare_support",
        links: [
          { label: "Charging types explained", href: "/charging-guides/charging-types" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    tradeoffs: [
      "Paying for the fastest charging hardware may not help if your parking cannot support daily AC.",
      "Frequent DC can cost more per kWh than home tariffs.",
      DISCLAIM,
    ],
    faq: [
      { question: "How long does home AC take?", answer: "Depends on kW, battery size, and start level — think hours, not minutes." },
      { question: "When is DC worth it?", answer: "Highway legs, urgent top-ups, or when home charging is unavailable." },
      { question: "Will slow charging damage the battery?", answer: "AC overnight is a common, gentle pattern — follow OEM guidance." },
      { question: "Apartment owners?", answer: "Read apartment setup guide and society/RWA explainer." },
      { question: "Compare models?", answer: "Compare on-board AC kW and connector support on EVSavari." },
    ],
    relatedHrefs: [
      { label: "Public charging guide", href: "/charging-guides/public-charging" },
      { label: "Overnight safety", href: "/charging-guides/overnight-safety" },
    ],
    compareSupportHrefs: [
      { label: "Home charging", href: "/charging-guides/home-charging" },
      { label: "Extension board risks", href: "/charging-guides/extension-board-risks" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "public-charging-guide",
    contentSlug: "authority-public-charging",
    segment: "public-charging",
    routeFamily: "charging",
    path: "/charging-guides/public-charging",
    h1: "Public EV Charging Guide for India — Planning, Not Promises",
    category: "authority",
    vehiclePickSeed: "public-charging",
    intro: "Public charging is improving but uneven. Use this guide to plan backup and highway legs without assuming every neighbourhood has reliable DC today.",
    editorialSections: [
      {
        id: "introduction",
        title: "What public charging is for",
        type: "introduction",
        paragraphs: [
          "Think of public networks as trip insurance and apartment backup — not always a full replacement for home AC.",
        ],
      },
      {
        id: "practical",
        title: "Planning a session",
        type: "practical",
        bullets: [
          "Use apps to check live status — stations can be busy or offline.",
          "Carry the right connector/adapters your model supports.",
          "Plan buffer time on highway days — charging plus queueing.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Limitations to accept",
        type: "ownership_realism",
        paragraphs: [
          "Rural corridors and smaller cities may still have gaps — verify routes before a long family trip.",
        ],
      },
      {
        id: "compare-support",
        title: "Highway compare support",
        type: "compare_support",
        links: [
          { label: "Highway ownership guide", href: "/ownership-guides/highway-ownership" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    tradeoffs: [
      "DC pricing can exceed home tariffs — budget trips accordingly.",
      "Not every listed charger fits your connector or payment app.",
      DISCLAIM,
    ],
    faq: [
      { question: "Can I rely only on public charging?", answer: "Some owners do in cities — it requires patience and app discipline." },
      { question: "How do I find chargers?", answer: "Use major network apps and plan alternative stops on highways." },
      { question: "Payment failures?", answer: "Keep a backup app/account and avoid last-km range margins." },
      { question: "Apartment backup?", answer: "Pair with society charging talks — see apartment setup guide." },
      { question: "Compare?", answer: "Compare DC peak kW and connector on shortlisted models." },
    ],
    relatedHrefs: [
      { label: "Fast vs slow", href: "/charging-guides/fast-vs-slow" },
      { label: "City commute ownership", href: "/ownership-guides/city-commute" },
    ],
    compareSupportHrefs: [
      { label: "Highway guidance", href: "/discover/highway-evs" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "overnight-charging-safety",
    contentSlug: "authority-overnight-safety",
    segment: "overnight-safety",
    routeFamily: "charging",
    path: "/charging-guides/overnight-safety",
    h1: "Overnight EV Charging Safety — Home & Society Basics",
    category: "authority",
    vehiclePickSeed: "overnight-safety",
    intro: "Overnight AC charging is common in India. This guide covers practical safety — wiring, certified hardware, and rain — without fearmongering or unsafe shortcuts.",
    editorialSections: [
      {
        id: "introduction",
        title: "Why overnight AC is popular",
        type: "introduction",
        paragraphs: [
          "Long parking windows at home or work suit AC charging — you wake up with enough km for the day without waiting at public stations.",
        ],
      },
      {
        id: "charging-safety",
        title: "Safety checklist",
        type: "charging_safety",
        bullets: [
          "Dedicated circuit and earthing checked by a qualified installer.",
          "OEM-approved or certified wallbox — avoid makeshift extension boards.",
          "Society cabling audited before shared points go live.",
          "Stop using damaged cables or adapters.",
        ],
      },
      {
        id: "misconceptions",
        title: "Rain and overnight myths",
        type: "misconceptions",
        misconceptions: myths([
          ["You cannot charge in rain", "Rated outdoor equipment is designed for weather — follow install guidance."],
          ["Any 15A socket is identical", "Load, earthing, and cable quality vary — get professional assessment."],
        ]),
      },
      {
        id: "compare-support",
        title: "Learn more",
        type: "compare_support",
        links: [
          { label: "Extension board risks", href: "/charging-guides/extension-board-risks" },
          { label: "Home charging guide", href: "/charging-guides/home-charging" },
        ],
      },
    ],
    tradeoffs: [
      "Shared society points need clear usage rules to avoid overload.",
      "Insurance and RWA approvals may take time — start early.",
      DISCLAIM,
    ],
    faq: [
      { question: "Is overnight charging safe at home?", answer: "With certified install and proper wiring, it is a mainstream pattern — not DIY guesswork." },
      { question: "Can I use a regular extension board?", answer: "Avoid makeshift setups — see extension board risk guide." },
      { question: "Society basement charging?", answer: "Requires electrical audit and agreed load limits." },
      { question: "Should I charge to 100% every night?", answer: "Follow OEM guidance — many owners use a daily ceiling unless a long trip is next day." },
      { question: "Next?", answer: "Compare models with home AC kW that matches your parking plan." },
    ],
    relatedHrefs: [
      { label: "Apartment setup", href: "/charging-guides/apartment-setup" },
      { label: "Monsoon habits", href: "/ownership-guides/monsoon-driving" },
    ],
    compareSupportHrefs: [
      { label: "Home charging", href: "/charging-guides/home-charging" },
      { label: "Apartment setup", href: "/charging-guides/apartment-setup" },
    ],
  },
  {
    id: "extension-board-charging-risks",
    contentSlug: "authority-extension-risks",
    segment: "extension-board-risks",
    routeFamily: "charging",
    path: "/charging-guides/extension-board-risks",
    h1: "Extension Board EV Charging Risks — Why Shortcuts Fail",
    category: "authority",
    vehiclePickSeed: "extension-risks",
    intro: "Running a portable charger through a household extension board is a common unsafe shortcut. This guide explains fire and overload risk — and safer paths for Indian homes and apartments.",
    editorialSections: [
      {
        id: "introduction",
        title: "The shortcut many try",
        type: "introduction",
        paragraphs: [
          "Long cables through cheap boards can overheat, especially under continuous EV loads. Certified wallboxes or dedicated points are designed for sustained draw.",
        ],
      },
      {
        id: "charging-safety",
        title: "What can go wrong",
        type: "charging_safety",
        bullets: [
          "Underrated cable gauge and poor contacts build heat.",
          "Shared circuits with ACs/geysers trip or overheat.",
          "Rain exposure on indoor-rated gear raises shock risk.",
        ],
      },
      {
        id: "practical",
        title: "Safer alternatives",
        type: "practical",
        bullets: [
          "Get a professional load assessment and dedicated point.",
          "In apartments, pursue society-approved install or vetted shared points.",
          "Until then, use reputable public AC/DC — not unsafe wiring.",
        ],
      },
      {
        id: "compare-support",
        title: "Still unsure?",
        type: "compare_support",
        links: [
          { label: "Overnight safety guide", href: "/charging-guides/overnight-safety" },
          { label: "Apartment setup", href: "/charging-guides/apartment-setup" },
        ],
      },
    ],
    tradeoffs: [
      "Safer install has upfront cost — weigh it against fuel savings over years, not weeks.",
      "Waiting for RWA approval is slower than a shortcut — but reduces serious risk.",
      DISCLAIM,
    ],
    faq: [
      { question: "Is any extension board okay for one night?", answer: "Risk remains — EV loads are sustained, not like briefly plugging a laptop." },
      { question: "Can society ban EV charging?", answer: "Policies vary — engage RWAs with certified plans." },
      { question: "Portable charger without wallbox?", answer: "Still needs a suitable dedicated circuit — ask an electrician." },
      { question: "Public charging instead?", answer: "Often safer than unsafe home wiring until proper install exists." },
      { question: "Next step?", answer: "Read home charging guide and compare models you can charge safely." },
    ],
    relatedHrefs: [
      { label: "Overnight safety", href: "/charging-guides/overnight-safety" },
      { label: "Society & RWA", href: "/ownership-guides/society-rwa" },
    ],
    compareSupportHrefs: [
      { label: "Home charging", href: "/charging-guides/home-charging" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "apartment-charging-setup",
    contentSlug: "authority-apartment-setup",
    segment: "apartment-setup",
    routeFamily: "charging",
    path: "/charging-guides/apartment-setup",
    h1: "Apartment EV Charging Setup in India — Society, Wiring & Backup",
    category: "authority",
    vehiclePickSeed: "apartment-setup",
    intro: "Apartment charging is a people and wiring problem as much as a car problem. This guide walks through RWA conversations, dedicated points, and realistic public backup.",
    editorialSections: [
      {
        id: "introduction",
        title: "Start with parking reality",
        type: "introduction",
        paragraphs: [
          "Confirm whether you have assigned parking, shared basement points, or only street parking — each path differs.",
        ],
      },
      {
        id: "practical",
        title: "Setup steps that work",
        type: "practical",
        bullets: [
          "Document load and earthing with a certified electrician.",
          "Propose society rules: timing, billing, and maintenance.",
          "Keep a public charging app as backup while approvals progress.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Honest limitations",
        type: "ownership_realism",
        paragraphs: [
          "Some buildings still block installs — do not buy an EV assuming permission will arrive in a week.",
        ],
      },
      {
        id: "compare-support",
        title: "Apartment-friendly compare",
        type: "compare_support",
        links: [
          { label: "Apartment suitability guide", href: "/ownership-guides/apartment-suitability" },
          { label: "Apartment discovery", href: "/discover/apartment-living" },
        ],
      },
    ],
    tradeoffs: [
      "Shared points need fair billing — unclear rules create conflict.",
      "Street-parking owners face the hardest path — plan public charging honestly.",
      DISCLAIM,
    ],
    faq: [
      { question: "Does every society allow wallboxes?", answer: "No — policies differ; get clarity in writing." },
      { question: "Who pays for wiring?", answer: "Varies — personal bay vs shared infrastructure." },
      { question: "Can I use a 15A socket?", answer: "Only if professionally assessed — avoid extension shortcuts." },
      { question: "Backup while waiting?", answer: "Public AC/DC near home or workplace." },
      { question: "Compare?", answer: "Compare compact EVs with lower charging stress for tight parking." },
    ],
    relatedHrefs: [
      { label: "Society & RWA", href: "/ownership-guides/society-rwa" },
      { label: "Extension board risks", href: "/charging-guides/extension-board-risks" },
    ],
    compareSupportHrefs: [
      { label: "Apartment suitability", href: "/ownership-guides/apartment-suitability" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "apartment-ev-suitability",
    contentSlug: "authority-apartment-suitability",
    segment: "apartment-suitability",
    routeFamily: "ownership",
    path: "/ownership-guides/apartment-suitability",
    h1: "Is an EV Suitable for Apartment Living in India?",
    category: "authority",
    vehiclePickSeed: "apartment-suitability",
    intro: "Apartment EV ownership can work — but only if you plan charging before you fall in love with a model. This guide covers suitability, society friction, and honest limitations.",
    editorialSections: [
      {
        id: "introduction",
        title: "Suitability starts with parking",
        type: "introduction",
        paragraphs: [
          "Assigned covered parking, open slots, or street parking each change how practical daily charging feels.",
        ],
      },
      {
        id: "suitability",
        title: "When an EV fits apartments",
        type: "suitability",
        bullets: [
          "You can secure AC charging at home, work, or reliable nearby public AC.",
          "Your daily km are moderate and predictable.",
          "You accept occasional public sessions while society work completes.",
        ],
      },
      {
        id: "ownership-realism",
        title: "When to pause",
        type: "ownership_realism",
        paragraphs: [
          "If RWAs forbid charging and no workable public backup exists near your routine, an EV may feel harder than petrol — be honest before purchase.",
        ],
      },
      {
        id: "misconceptions",
        title: "Misconceptions",
        type: "misconceptions",
        misconceptions: myths([
          ["Any EV is fine for apartments", "Compact cars may park easier — charging access matters more than size alone."],
          ["Public charging removes all apartment issues", "Availability and time still shape daily life."],
        ]),
      },
      {
        id: "compare-support",
        title: "Compare with charging context",
        type: "compare_support",
        links: [
          { label: "Apartment setup guide", href: "/charging-guides/apartment-setup" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    tradeoffs: [
      "Society politics can delay installs months — have a backup plan.",
      "Guest parking and valet rules may limit cable access.",
      DISCLAIM,
    ],
    faq: [
      { question: "Should I ask RWA before buying?", answer: "Yes — get indicative approval paths early." },
      { question: "Is a small EV better?", answer: "Parking helps, but charging permission matters more." },
      { question: "Workplace charging?", answer: "A strong enabler — confirm reliability and policies." },
      { question: "Renters?", answer: "Get landlord/building clarity in writing." },
      { question: "Next?", answer: "Use apartment discovery and compare with charging stress in mind." },
    ],
    relatedHrefs: [
      { label: "Apartment living picks", href: "/ownership-guides/apartment-living" },
      { label: "Apartment charging setup", href: "/charging-guides/apartment-setup" },
    ],
    compareSupportHrefs: [
      { label: "Apartment discovery", href: "/discover/apartment-living" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "ev-city-commute",
    contentSlug: "authority-city-commute",
    segment: "city-commute",
    routeFamily: "ownership",
    path: "/ownership-guides/city-commute",
    h1: "EV Ownership for City Commute in India",
    category: "authority",
    vehiclePickSeed: "city-commute",
    intro: "City commutes favour EVs when km are predictable and charging is stable. This guide sets realistic expectations for traffic, heat, and stop-start range — without urban hype.",
    editorialSections: [
      {
        id: "introduction",
        title: "Why city driving fits many EVs",
        type: "introduction",
        paragraphs: [
          "Low speeds and regen help efficiency in traffic. Overnight AC can cover weekday km if parking allows.",
        ],
      },
      {
        id: "suitability",
        title: "Suitability scenarios",
        type: "suitability",
        bullets: [
          "Office 20–50 km/day with home or workplace AC.",
          "Mixed errands with mid-day top-ups at work.",
          "Apartment owners with society point or trusted public AC nearby.",
        ],
      },
      {
        id: "ownership-realism",
        title: "City limitations",
        type: "ownership_realism",
        paragraphs: [
          "Heat and AC use reduce range in summer — plan buffer km.",
          "Peak-hour detours change daily use — track your real week, not one good day.",
        ],
      },
      {
        id: "compare-support",
        title: "City-friendly compare",
        type: "compare_support",
        links: [
          { label: "City driving discovery", href: "/discover/city-driving" },
          { label: "Running cost guide", href: "/ownership-guides/running-cost" },
        ],
      },
    ],
    tradeoffs: [
      "Frequent short trips still need tyre and brake care.",
      "Parking wars do not disappear — compact footprints may help.",
      DISCLAIM,
    ],
    faq: [
      { question: "How much range buffer for city?", answer: "Many owners keep a comfortable margin for AC use and diversions — track your week." },
      { question: "Is regen enough in traffic?", answer: "It helps efficiency — not a substitute for planning charging." },
      { question: "Office charging?", answer: "Valuable — confirm access hours and billing." },
      { question: "Highway once a month?", answer: "Read highway ownership guide before choosing a small pack." },
      { question: "Compare?", answer: "Use city discovery and compare city usability scores." },
    ],
    relatedHrefs: [
      { label: "City driving picks", href: "/best-evs/city-driving" },
      { label: "Running cost", href: "/ownership-guides/running-cost" },
    ],
    compareSupportHrefs: [
      { label: "City discovery", href: "/discover/city-driving" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "ev-family-ownership",
    contentSlug: "authority-family-ownership",
    segment: "family-ownership",
    routeFamily: "ownership",
    path: "/ownership-guides/family-ownership",
    h1: "EV Ownership for Families in India — Space, Safety & Trips",
    category: "authority",
    vehiclePickSeed: "family-ownership",
    intro: "Family EV ownership adds space, safety, and weekend trip needs. This guide balances school runs with honest highway planning — not just brochure seating rows.",
    editorialSections: [
      {
        id: "introduction",
        title: "Family needs beyond kWh",
        type: "introduction",
        paragraphs: [
          "Boot space, rear seat comfort, and safety features matter alongside range. Charging must fit school drops and office commutes.",
        ],
      },
      {
        id: "suitability",
        title: "Family suitability",
        type: "suitability",
        bullets: [
          "Daily km within comfortable AC charging at home or work.",
          "Weekend trips planned with DC stops where corridors are reliable.",
          "ISOFIX and safety tech verified on the variant you buy — not another trim.",
        ],
      },
      {
        id: "ownership-realism",
        title: "Realistic limitations",
        type: "ownership_realism",
        paragraphs: [
          "Single-car families cannot ignore highway range — a small pack with five occupants and luggage may need more planning than marketing suggests.",
        ],
      },
      {
        id: "compare-support",
        title: "Family compare support",
        type: "compare_support",
        links: [
          { label: "Family-friendly discovery", href: "/discover/family-friendly" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    tradeoffs: [
      "Larger vehicles may be harder to park in dense cities.",
      "Insurance and tyre costs scale with price band — budget holistically.",
      DISCLAIM,
    ],
    faq: [
      { question: "Is one EV enough for a family?", answer: "Often yes in cities if charging is stable — highway-heavy families should plan carefully." },
      { question: "Child seat fit?", answer: "Test physical fit at the dealer — specs alone are not enough." },
      { question: "School bus replacement?", answer: "Works when km and timing match charging windows." },
      { question: "Two cars?", answer: "Many households keep one EV and one ICE during transition — that is normal." },
      { question: "Compare?", answer: "Use family discovery and compare boot and range bands." },
    ],
    relatedHrefs: [
      { label: "Large family picks", href: "/best-evs/large-family" },
      { label: "Highway ownership", href: "/ownership-guides/highway-ownership" },
    ],
    compareSupportHrefs: [
      { label: "Family discovery", href: "/discover/family-friendly" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
  {
    id: "first-time-ev-buyer-guide",
    contentSlug: "authority-first-time-buyer",
    segment: "first-time-buyers",
    routeFamily: "ownership",
    path: "/ownership-guides/first-time-buyers",
    h1: "First-Time EV Buyer Guide for India — Calm, Step-by-Step",
    category: "authority",
    vehiclePickSeed: "first-time-buyer",
    intro: "Buying your first EV should feel informed, not rushed. This guide orders the decisions — charging, budget, range, safety — and points to compare tools without hype.",
    editorialSections: [
      {
        id: "introduction",
        title: "Beginner confidence",
        type: "introduction",
        paragraphs: [
          "Start with your parking and weekly km. Only then shortlist models — specs make more sense with your real pattern.",
        ],
      },
      {
        id: "practical",
        title: "Step-by-step path",
        type: "practical",
        bullets: [
          "1) Confirm charging (home, work, society, or public backup).",
          "2) Set a realistic budget including install and insurance.",
          "3) Shortlist two or three families, then compare variants.",
          "4) Test drive for visibility, parking, and boot — not just 0–100 claims.",
        ],
      },
      {
        id: "ownership-realism",
        title: "What not to overpromise yourself",
        type: "ownership_realism",
        paragraphs: [
          "No EV removes traffic, society paperwork, or monsoon planning. Savings on fuel can be real but vary — model with your tariff and km.",
        ],
      },
      {
        id: "misconceptions",
        title: "First-timer myths",
        type: "misconceptions",
        misconceptions: myths([
          ["Buy the longest range always", "Right-size range to avoid paying for unused kWh."],
          ["Skip the test drive", "Parking and visibility matter as much as battery size."],
        ]),
      },
      {
        id: "compare-support",
        title: "Still unsure?",
        type: "compare_support",
        links: [
          { label: "How EVs work", href: "/ownership-guides/how-evs-work" },
          { label: "Compare EVs", href: "/compare" },
        ],
      },
    ],
    tradeoffs: [
      "Dealer delivery timelines and variant availability change — confirm locally.",
      "Waiting for a better pack next year can be rational if charging is not ready today.",
      DISCLAIM,
    ],
    faq: [
      { question: "New vs used first EV?", answer: "New gives clearer warranty; used needs battery history — see used EV guide." },
      { question: "How many models to compare?", answer: "Two or three families keep decisions calm." },
      { question: "When to talk money?", answer: "After charging plan is clear — otherwise TCO guesses fail." },
      { question: "Finance?", answer: "Treat like any car purchase — read total cost, not EMI alone." },
      { question: "Ready to compare?", answer: "Open compare with your top two families side by side." },
    ],
    relatedHrefs: [
      { label: "Easiest first EV picks", href: "/ownership-guides/easiest-first-ev" },
      { label: "Under ₹15 lakh discovery", href: "/discover/under-15-lakh" },
    ],
    compareSupportHrefs: [
      { label: "How EVs work", href: "/ownership-guides/how-evs-work" },
      { label: "Running cost", href: "/ownership-guides/running-cost" },
      { label: "Compare EVs", href: "/compare" },
    ],
  },
];
