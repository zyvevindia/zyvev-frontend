/**

 * Production use-case landing definitions — Sprint 2.4 / 2.6 content.

 * Adding "Taxi EVs" or "7-Seater EVs" is a single object in this array only.

 */



export const USE_CASE_LANDING_DEFINITIONS = Object.freeze([

  {

    slug: "city",

    category: "use_case",

    h1: "Best Electric Cars for City Driving",

    linkLabel: "Best city EVs",

    shortDescription:

      "Compare electric cars suited to Indian city driving — commuting efficiency, parking footprint, home charging fit, and running cost from live suitability scores.",

    longDescription: [

      "City rankings prioritise low-speed efficiency, manoeuvrability, and charging convenience — not maximum highway range. Compact EVs dominate; larger SUVs appear when their city usability score stays high with acceptable running cost.",

      "Ideal if your weekday loop is under 60 km and you can charge overnight. If you share one car for city and monthly highway duty, cross-check the highway and under-₹15 lakh guides too.",

    ],

    filters: {

      intelligenceFilterIds: ["city_friendly"],

      sortBy: "cityUsability",

    },

    heroBadge: "Use case guide",

    ctaLabel: "Compare city EVs",

    ctaHref: "/compare",

    faq: [

      {

        question: "Best city EV for Bengaluru or Mumbai traffic?",

        answer:

          "Compact models (Comet EV, Tiago EV, Punch EV) minimise parking pain; Nexon EV balances space and efficiency. Prioritise home charging access over peak DC kW for pure city use.",

      },

      {

        question: "Is a small city EV safe on highways?",

        answer:

          "Legal and usable for occasional trips, but lighter cars feel less stable at 100 km/h+ and need more charging stops. Choose a larger pack if highways are weekly, not rare.",

      },

    ],

  },

  {

    slug: "family",

    category: "use_case",

    h1: "Best Electric Cars for Families",

    linkLabel: "Best family EVs",

    shortDescription:

      "Find practical family electric cars in India — rear space, safety features, weekend range, and ownership cost ranked from the live catalog.",

    longDescription: [

      "Family suitability scores weight rear space proxies, safety feature availability, boot practicality, and range with a full load — not seat count alone.",

      "Test-fit child seats and strollers in showrooms. A 5-star label does not guarantee third-row or large boot usability for your lifestyle.",

    ],

    filters: {

      intelligenceFilterIds: ["family_friendly"],

      sortBy: "practicality",

      enableEmptyFallback: true,

    },

    heroBadge: "Use case guide",

    ctaLabel: "Browse family EVs",

    ctaHref: "/cars",

    faq: [

      {

        question: "Best family EV under ₹15 lakh?",

        answer:

          "Nexon EV and ZS EV are the default cross-shop pair; XUV400 suits Mahindra buyers. Compare boot volume and rear legroom with your child seats installed.",

      },

      {

        question: "Are electric SUVs safe for family long drives?",

        answer:

          "Yes with trip planning — verify DC charger spacing, carry 20% range buffer in monsoon/summer, and prefer variants with stable highway range scores on model pages.",

      },

    ],

  },

  {

    slug: "highway",

    category: "use_case",

    h1: "Best Electric Cars for Highway Driving",

    linkLabel: "Best highway EVs",

    shortDescription:

      "Compare electric cars built for Indian highway travel — usable range at speed, DC fast charging, and long-distance suitability from verified catalog data.",

    longDescription: [

      "Highway lists filter for range confidence at 100–110 km/h and DC charging that restores usable miles quickly in the 10–80% window. ARAI range alone does not qualify a model here.",

      "Plan stops every 200–280 km depending on pack and driving style. Avoid relying on 100% charges on road trips — they are slower and stress the battery.",

    ],

    filters: {

      intelligenceFilterIds: ["highway_friendly"],

      sortBy: "highwayUsability",

    },

    heroBadge: "Use case guide",

    ctaLabel: "Compare highway EVs",

    ctaHref: "/compare",

    faq: [

      {

        question: "Which EV is most highway-suitable under ₹20 lakh?",

        answer:

          "Models with larger packs and 100+ kW DC peak lead — Curvv EV, Atto 3, Windsor EV, upper Nexon trims. Confirm your exact variant’s DC spec before buying.",

      },

      {

        question: "How much range should I assume on highways?",

        answer:

          "Typically 60–75% of certified range at 100 km/h with climate control. Use EVSavari real-world estimates per model, not brochure maximum.",

      },

    ],

  },

  {

    slug: "long-range",

    category: "use_case",

    h1: "Best Long-Range Electric Cars in India",

    linkLabel: "Best long-range EVs",

    shortDescription:

      "Discover long-range electric cars in India — compare certified and estimated real-world range, battery size, and charging from the live catalog.",

    longDescription: [

      "Long-range rankings sort by certified range and highway usability intelligence. High ARAI figures still drop at sustained highway speeds — always read real-world notes on model pages.",

      "Long range helps owners who cannot charge daily or who want fewer weekly top-ups. It does not remove the need for DC stops on 400+ km trips.",

    ],

    filters: {

      intelligenceFilterIds: ["range_long"],

      sortBy: "highwayUsability",

    },

    heroBadge: "Use case guide",

    ctaLabel: "Browse long-range EVs",

    ctaHref: "/cars",

    faq: [

      {

        question: "Which Indian EV has the longest real-world range?",

        answer:

          "Premium models (Ioniq 5, EV6, Seal) lead on pack size; among mass-market SUVs, check Atto 3, Windsor EV, and upper Nexon/Curvv trims. Variant matters more than badge.",

      },

      {

        question: "Does long range mean I can skip home charging?",

        answer:

          "No — home AC charging still delivers lowest cost per km. Large packs reduce anxiety and public charging spend but do not replace overnight charging economics.",

      },

    ],

  },

  {

    slug: "fast-charging",

    category: "use_case",

    h1: "Fastest-Charging Electric Cars in India",

    linkLabel: "Fastest-charging EVs",

    shortDescription:

      "Compare electric cars with the fastest DC charging in India — peak kW, 10–80% times, and charging convenience scores from live catalog intelligence.",

    longDescription: [

      "Fast-charging rankings weight peak DC kW, charging curve quality, and convenience scores — not AC overnight speed. 800V platforms (Ioniq 5, EV6) lead where compatible chargers exist.",

      "Peak kW is marketing unless your routes have working high-power DC. Map chargers you will actually use before paying for ultra-fast capability.",

    ],

    filters: {

      intelligenceFilterIds: ["charging_fast"],

      sortBy: "chargingConvenience",

    },

    heroBadge: "Use case guide",

    ctaLabel: "Compare charging speeds",

    ctaHref: "/compare",

    faq: [

      {

        question: "Fastest-charging EV under ₹20 lakh?",

        answer:

          "Upper trims of Nexon EV, Curvv EV, Atto 3, and BE 6 compete here — compare variant DC specs, not model names alone.",

      },

      {

        question: "Is 7.2 kW home charging enough if I buy a fast-charging EV?",

        answer:

          "Yes for daily km — DC speed matters for road trips and apartment dwellers relying on public networks. Most owners still do 80%+ of energy at home AC.",

      },

    ],

  },

  {

    slug: "budget",

    category: "use_case",

    h1: "Best Budget Electric Cars in India",

    linkLabel: "Best budget EVs",

    shortDescription:

      "Find the best-value electric cars in India — ranked by price, running cost, warranty, and ownership affordability from the live catalog.",

    longDescription: [

      "Budget value combines sub-₹15 lakh pricing with ownership affordability scores — service reach, warranty coverage, and running cost — not lowest ex-showroom sticker alone.",

      "The cheapest variant may omit DC charging or safety features you need. Compare trim sheets and nearest service centre before optimising purely on price.",

    ],

    filters: {

      intelligenceFilterIds: ["price_under_15", "ownership_affordable"],

      sortBy: "priceLow",

      enableEmptyFallback: true,

    },

    heroBadge: "Use case guide",

    ctaLabel: "Browse budget EVs",

    ctaHref: "/cars",

    faq: [

      {

        question: "Best budget EV for first-time buyers?",

        answer:

          "Tiago EV and Punch EV for tight budgets; Nexon EV if you need one car for city and occasional highway. Prioritise service network in your district.",

      },

      {

        question: "Cheapest EV to run per km?",

        answer:

          "Smaller packs charged at home overnight usually win. Calculate: (kWh per 100 km × your tariff) ÷ 100. Compare against your current petrol/diesel spend at your actual km/year.",

      },

    ],

  },

]);


