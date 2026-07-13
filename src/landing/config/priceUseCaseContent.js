/**

 * Price and use-case landing editorial — Sprint 2.6.

 * Evidence-based buying guidance; consumed by landing definitions only.

 */



/** @type {Record<string, import('../types.js').LandingBuyingAdvice>} */

export const PRICE_BUYING_ADVICE = Object.freeze({

  "under-10-lakh": {

    title: "Buying an EV under ₹10 lakh",

    sections: [

      {

        heading: "Who this budget suits",

        paragraphs: [

          "Sub-₹10 lakh EVs (Tiago EV, Punch EV, Comet EV, Citroën eC3) target first-time EV owners, second-car households, and city commuters with predictable daily km. You trade maximum range and highway comfort for lowest entry price and running cost.",

        ],

      },

      {

        heading: "Realistic expectations",

        bullets: [

          "Certified range often 250–320 km; plan daily use on 150–220 km real-world",

          "Smaller packs mean slower DC sessions — fine if you charge at home overnight",

          "Boot space and rear seat comfort vary — compare before assuming SUV practicality",

        ],

      },

      {

        heading: "Alternatives if this band feels tight",

        paragraphs: [

          "Stretch to under ₹15 lakh if you need regular highway trips or faster DC charging. Consider CNG/hybrid ICE only if home charging is impossible — EV running cost advantage disappears without overnight charging.",

        ],

      },

    ],

  },

  "under-15-lakh": {

    title: "Buying an EV under ₹15 lakh",

    sections: [

      {

        heading: "Sweet spot for Indian buyers",

        paragraphs: [

          "This band captures Nexon EV, Punch EV upper trims, ZS EV entry variants, XUV400, and eC3 — the highest cross-shop volume in India. You get usable range for mixed city-highway use without premium badge pricing.",

        ],

      },

      {

        heading: "Trade-offs versus under ₹10 lakh",

        bullets: [

          "Higher insurance and finance cost — model EMI against fuel savings at your km/year",

          "More variants mean more confusion — match battery size to your longest weekly trip, not brochure max",

          "Service quality still matters more than 10 km extra ARAI range",

        ],

      },

      {

        heading: "Recommended buyer profile",

        paragraphs: [

          "Single-car households doing 40–80 km daily with home or workplace charging. Less ideal as a primary highway tourer without planning DC stops.",

        ],

      },

    ],

  },

  "under-20-lakh": {

    title: "Buying an EV under ₹20 lakh",

    sections: [

      {

        heading: "What opens up here",

        paragraphs: [

          "Under ₹20 lakh you access larger batteries, faster DC charging, and models like Curvv EV, Windsor EV, Kona Electric, Atto 3, and upper Nexon/XUV trims. This is the practical ceiling for many family EV upgrades from ICE compact SUVs.",

        ],

      },

      {

        heading: "Charging expectations",

        bullets: [

          "Target variants with 100+ kW DC peak if you drive inter-city monthly",

          "Home 7.2 kW AC still covers 90% of energy cost savings",

          "Map chargers on your longest route before buying — infrastructure still uneven outside corridors",

        ],

      },

      {

        heading: "When to step up to premium",

        paragraphs: [

          "Move above ₹30 lakh only if you need 800V charging, luxury NVH, or corporate lease benefits — not for marginal range gains alone.",

        ],

      },

    ],

  },

  premium: {

    title: "Buying a premium EV in India",

    sections: [

      {

        heading: "Who premium EVs suit",

        paragraphs: [

          "Premium EVs (Ioniq 5, EV6, iX1, EQA/EQB, EX40, Seal upper trims) suit high-km executives, corporate fleet users, and buyers prioritising charging speed and cabin quality over lowest ticket price.",

        ],

      },

      {

        heading: "Trade-offs",

        bullets: [

          "Depreciation and insurance dominate TCO — electricity savings are secondary",

          "Tyre/brake service costs scale with vehicle mass and wheel size",

          "Resale liquidity varies by brand — factor hold period",

        ],

      },

      {

        heading: "Alternatives",

        paragraphs: [

          "A well-specced under-₹20 lakh EV plus home charger often delivers better value for mixed city-highway family use. Premium wins on time saved at fast chargers and ride refinement.",

        ],

      },

    ],

  },

});



/** @type {Record<string, import('../types.js').LandingBuyingAdvice>} */

export const USE_CASE_BUYING_ADVICE = Object.freeze({

  city: {

    title: "Choosing a city EV",

    sections: [

      {

        heading: "Selection methodology",

        paragraphs: [

          "City rankings weight low-speed efficiency, turning radius, parking footprint, and charging convenience scores from catalog intelligence — not top speed or maximum range alone.",

        ],

      },

      {

        heading: "Ideal ownership profile",

        bullets: [

          "Daily commute under 60 km with home or dedicated parking charging",

          "Frequent stop-start traffic where regen recovers energy",

          "Minimal monthly highway km",

        ],

      },

      {

        heading: "Trade-offs",

        paragraphs: [

          "Compact city EVs sacrifice highway range and crash mass versus larger SUVs. If you rent highway capacity twice a month, consider a under-₹15 lakh SUV EV instead of the smallest hatch.",

        ],

      },

    ],

  },

  family: {

    title: "Choosing a family EV",

    sections: [

      {

        heading: "Why these models qualify",

        paragraphs: [

          "Family-friendly scores combine rear space, safety feature availability, boot volume proxies, and range adequate for weekend getaways with a full load — not just five-seat labels.",

        ],

      },

      {

        heading: "Practical checks",

        bullets: [

          "Install child seats and still fit adult passengers — visit showroom",

          "Boot space with stroller/luggage for your typical trip",

          "Range with AC on and four occupants — use real-world estimates",

        ],

      },

      {

        heading: "Recommendations",

        paragraphs: [

          "Nexon EV, ZS EV, XUV400, Curvv EV, and Windsor EV dominate this list for most budgets. Comet EV is a second car, not primary family transport.",

        ],

      },

    ],

  },

  highway: {

    title: "Choosing a highway-capable EV",

    sections: [

      {

        heading: "Qualification criteria",

        paragraphs: [

          "Highway suitability requires sufficient usable range at 100–110 km/h, stable DC charging curves, and intelligence scores for long-distance usability — not ARAI range alone.",

        ],

      },

      {

        heading: "Trip planning reality",

        bullets: [

          "Plan 20–30 minute DC stops every 200–280 km depending on model",

          "Avoid 100% charging on road trips — charge 10–80% for speed",

          "Summer and monsoon cut range 10–20% — buffer accordingly",

        ],

      },

    ],

  },

  "long-range": {

    title: "Long-range EV selection",

    sections: [

      {

        heading: "How we rank range",

        paragraphs: [

          "Long-range lists sort by certified range and highway usability scores. Always cross-check with real-world range notes — a 450 km ARAI figure may mean 280–320 km at highway speeds.",

        ],

      },

      {

        heading: "Who benefits",

        bullets: [

          "Inter-city commuters who cannot charge mid-week",

          "Owners with irregular home charging who rely on fewer weekly top-ups",

          "Highway-heavy km without time for frequent short stops",

        ],

      },

    ],

  },

  "fast-charging": {

    title: "Fast-charging EV selection",

    sections: [

      {

        heading: "Why charging speed matters",

        paragraphs: [

          "Peak DC kW only helps if your routes have compatible chargers and the battery accepts high power in the 10–80% window. Rankings here weight charging convenience scores and verified DC specs.",

        ],

      },

      {

        heading: "Ownership profile",

        bullets: [

          "Road warriors without home charging who depend on public DC",

          "Fleet operators minimising downtime",

          "Buyers pairing EV with apartment charging but needing quick top-ups",

        ],

      },

    ],

  },

  budget: {

    title: "Best value EV selection",

    sections: [

      {

        heading: "Methodology",

        paragraphs: [

          "Budget rankings combine sub-₹15 lakh pricing with ownership affordability scores — running cost, service predictability, and warranty coverage — not lowest ex-showroom price alone.",

        ],

      },

      {

        heading: "Trade-offs",

        bullets: [

          "Lowest price variants may omit DC charging or safety features — compare trim sheets",

          "Cheapest EV is not cheapest if service centre is 200 km away",

          "Battery size affects resale — undersized packs depreciate faster in growing market",

        ],

      },

    ],

  },

});


