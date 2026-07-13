/**

 * Production price-segment landing definitions — Sprint 2.4 / 2.6 content.

 * Adding "Under ₹25 lakh" is a single object in this array only.

 */



export const PRICE_LANDING_DEFINITIONS = Object.freeze([

  {

    slug: "under-10-lakh",

    category: "price",

    h1: "Best Electric Cars Under ₹10 Lakh",

    linkLabel: "Electric cars under ₹10 lakh",

    shortDescription:

      "Compare affordable electric cars under ₹10 lakh in India — ex-showroom price, certified range, home charging, and running cost from the live EVSavari catalog.",

    longDescription: [

      "This segment covers India’s entry EVs: Tata Tiago EV, Tata Punch EV, MG Comet EV, and Citroën eC3. Buyers here prioritise lowest acquisition cost and city running economics over long highway range.",

      "Listings rank by verified starting price and ownership affordability scores. Expect 250–320 km certified range — plan daily use on roughly 60–70% of that figure with AC and traffic.",

    ],

    filters: {

      priceRange: "under_10",

      intelligenceFilterIds: ["price_under_10"],

      sortBy: "priceLow",

    },

    heroBadge: "Price guide",

    ctaLabel: "Browse budget EVs",

    ctaHref: "/cars",

    faq: [

      {

        question: "Best EV under ₹10 lakh for daily commuting?",

        answer:

          "Tiago EV and Punch EV offer the most space per rupee; Comet EV suits ultra-short city hops. Match variant battery size to your longest weekday trip plus 20% buffer.",

      },

      {

        question: "Cheapest EV to maintain in India?",

        answer:

          "Entry hatchbacks with wide service networks (Tata) usually win on predictable maintenance. Compare warranty terms and nearest service centre before choosing on price alone.",

      },

      {

        question: "Can I take a sub-₹10 lakh EV on highway trips?",

        answer:

          "Occasional trips are possible with DC charging stops, but these models are optimised for city duty. If you drive highways weekly, consider the under-₹15 lakh SUV EV segment instead.",

      },

    ],

  },

  {

    slug: "under-15-lakh",

    category: "price",

    h1: "Best Electric Cars Under ₹15 Lakh",

    linkLabel: "Electric cars under ₹15 lakh",

    shortDescription:

      "Discover electric cars under ₹15 lakh in India — compare ex-showroom price, range, DC charging, variants, and ownership cost from live catalog rankings.",

    longDescription: [

      "Under ₹15 lakh is India’s highest-volume EV band: Tata Nexon EV, MG ZS EV entry trims, Mahindra XUV400, and upper Punch EV variants. This is the default cross-shop range for first-time family EV buyers.",

      "Rankings combine price filters with intelligence scores for mixed city-highway use. Verify DC peak kW on the variant you buy — it affects road-trip stop frequency more than brochure range.",

    ],

    filters: {

      intelligenceFilterIds: ["price_under_15"],

      sortBy: "priceLow",

    },

    heroBadge: "Price guide",

    ctaLabel: "Compare affordable EVs",

    ctaHref: "/compare",

    faq: [

      {

        question: "Best EV under ₹15 lakh for families?",

        answer:

          "Nexon EV and ZS EV lead on space and service reach; XUV400 suits Mahindra loyalists. Compare real-world range with a full load on each model page.",

      },

      {

        question: "Fastest-charging EV under ₹15 lakh?",

        answer:

          "DC peak kW varies by variant, not model name alone. Sort the grid by charging convenience or open compare guides for Nexon EV vs ZS EV charging curves.",

      },

      {

        question: "Are ex-showroom prices on this page final?",

        answer:

          "No — they are catalog starting prices. Add insurance, registration, and home charger installation for true on-road cost in your state.",

      },

    ],

  },

  {

    slug: "under-20-lakh",

    category: "price",

    h1: "Best Electric Cars Under ₹20 Lakh",

    linkLabel: "Electric cars under ₹20 lakh",

    shortDescription:

      "Explore electric cars under ₹20 lakh in India — larger batteries, faster DC charging, and family SUV options ranked from verified catalog data.",

    longDescription: [

      "This band adds Curvv EV, Windsor EV, Hyundai Kona Electric, BYD Atto 3, and upper trims of Nexon EV and XUV400. Buyers typically upgrade from ICE compact SUVs and need credible highway range.",

      "Expect meaningful DC charging improvements versus sub-₹15 lakh variants. Still map chargers on your longest route — infrastructure gaps remain outside major corridors.",

    ],

    filters: {

      intelligenceFilterIds: ["price_under_20"],

      sortBy: "priceLow",

    },

    heroBadge: "Price guide",

    ctaLabel: "Browse mid-range EVs",

    ctaHref: "/cars",

    faq: [

      {

        question: "Best long-range EV under ₹20 lakh?",

        answer:

          "Sort by range and open model pages for real-world highway estimates. Atto 3, Windsor EV, and upper Nexon/Curvv trims often lead — variant battery size decides.",

      },

      {

        question: "Is ₹20 lakh enough for regular Mumbai–Pune or Delhi–Jaipur trips?",

        answer:

          "Yes with planning, if your variant supports 100+ kW DC and you stop at 10–80%. Model the trip using real-world range, not ARAI maximum.",

      },

    ],

  },

  {

    slug: "premium",

    category: "price",

    h1: "Best Premium Electric Cars in India",

    linkLabel: "Premium electric cars",

    shortDescription:

      "Compare premium electric cars above ₹30 lakh in India — luxury EVs ranked by range, DC charging speed, ownership costs, and catalog intelligence.",

    longDescription: [

      "Premium EVs here include Hyundai Ioniq 5, Kia EV6, BMW iX1, Mercedes EQA/EQB, Volvo EX40, and BYD Seal upper trims. Buyers trade higher depreciation for charging speed, refinement, and corporate lease benefits.",

      "TCO is driven by finance and insurance more than electricity savings below 15,000 km/year. Compare against diesel luxury only if you drive enough km to offset upfront premium.",

    ],

    filters: {

      priceRange: "above_30",

      sortBy: "composite",

    },

    heroBadge: "Price guide",

    ctaLabel: "Compare premium EVs",

    ctaHref: "/compare",

    faq: [

      {

        question: "Best premium EV for highway travel in India?",

        answer:

          "Ioniq 5 and EV6 lead on 800V-class charging where infrastructure exists. Compare real stop times on your routes, not peak kW alone.",

      },

      {

        question: "Premium EV vs under-₹20 lakh SUV — when is premium worth it?",

        answer:

          "When you value fast-charging time savings, NVH, and lease/tax treatment over lowest ticket price. For mixed family use, a well-specced under-₹20 lakh EV plus home charger often wins on TCO.",

      },

    ],

  },

]);


