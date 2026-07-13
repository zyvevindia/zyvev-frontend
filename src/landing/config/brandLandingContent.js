/**

 * Brand landing editorial content — Sprint 2.6.

 * Practical, evidence-based copy keyed by brand slug. Consumed by buildBrandLandingConfig only.

 */



/** @typedef {import('../types.js').LandingBuyingAdvice} LandingBuyingAdvice */

/** @typedef {import('../types.js').LandingFaqItem} LandingFaqItem */



/**

 * @type {Record<string, {

 *   introTitle?: string,

 *   intro: string[],

 *   buyingAdvice: LandingBuyingAdvice,

 *   faq: LandingFaqItem[],

 * }>}

 */

export const BRAND_LANDING_CONTENT = Object.freeze({

  tata: {

    introTitle: "Tata EV lineup in India",

    intro: [

      "Tata Motors has the widest retail EV footprint in India — from the Tiago EV and Punch EV under ₹10 lakh to the Nexon EV and Curvv EV in the mid segment, plus the Harrier EV moving upmarket. Most buyers cross-shop within this lineup before looking at MG or Mahindra.",

      "Rankings on this page pull live catalog data: ex-showroom starting price, certified range, DC charging capability, and variant count. Use the grid to shortlist, then open model pages for real-world range notes and ownership cost breakdowns.",

    ],

    buyingAdvice: {

      title: "Buying a Tata EV",

      sections: [

        {

          heading: "Where Tata EVs fit",

          paragraphs: [

            "Tata EVs suit buyers who prioritise service reach and predictable running costs over maximum highway range. The Nexon EV and Punch EV dominate city and mixed-use budgets; Tiago EV covers entry ownership; Curvv EV and Harrier EV target buyers who want a larger Tata EV without switching brands.",

          ],

        },

        {

          heading: "Strengths to weigh",

          bullets: [

            "Pan-India service and parts network versus most EV-only entrants",

            "Competitive ex-showroom pricing on Nexon EV, Punch EV, and Tiago EV",

            "Long battery warranties (typically 8 years / 1.6 lakh km on core models — confirm per variant)",

            "Familiar ICE-to-EV upgrade path for existing Tata owners",

          ],

        },

        {

          heading: "Charging and ownership",

          paragraphs: [

            "Home AC charging (7.2 kW where supported) covers most daily use. DC fast charging times vary by variant and pack size — check the model page before assuming 30-minute stops on road trips. Running cost is usually ₹1–2/km versus ₹6–10/km for comparable petrol hatchbacks, depending on tariff and driving style.",

          ],

        },

        {

          heading: "Who should buy — and who should wait",

          bullets: [

            "Good fit: city commuters, first-time EV buyers, families already on Tata service",

            "Reconsider if: you need 400 km+ real highway range on a base variant, or your building has no home-charging approval yet",

            "Watch Harrier EV and Curvv EV variant spread if you need a single long-range family car",

          ],

        },

      ],

    },

    faq: [

      {

        question: "Which Tata EV is best for daily city use?",

        answer:

          "For tight budgets, Tiago EV and Punch EV. For more range and space, Nexon EV. Compare claimed range, real-world estimates, and DC charging speed on each model page — city suitability depends on your daily km and home charging access.",

      },

      {

        question: "How reliable are Tata EVs in India?",

        answer:

          "Tata leverages its mass-market service network, which matters more than brochure claims for long-term ownership. Check warranty terms per variant, local service load, and owner-reported battery health on model pages before deciding.",

      },

      {

        question: "What is Tata EV charging time at home and on DC fast chargers?",

        answer:

          "Home AC (7.2 kW) typically needs overnight for a full top-up on mid-size packs. DC times are variant-specific — from under an hour on some Nexon EV trims to longer on smaller packs. Always verify kW rating and charger compatibility on the variant you buy.",

      },

      {

        question: "What battery warranty does Tata offer?",

        answer:

          "Most Tata EVs ship with multi-year battery warranties (commonly 8 years / 1.6 lakh km on core models). Warranty coverage can differ by variant and registration date — confirm in the variant brochure and service booklet.",

      },

    ],

  },

  mahindra: {

    introTitle: "Mahindra EV lineup in India",

    intro: [

      "Mahindra’s EV portfolio spans the XUV400 (established mid-SUV), the BE 6 (new electric SUV architecture), and the XEV 9e (three-row electric SUV). Buyers usually compare Mahindra against Tata Nexon/Curvv and MG ZS EV before premium options.",

      "Use the live grid below for current starting prices and range figures. Mahindra’s newer platforms emphasise larger batteries and fast-charging claims — validate against your typical highway routes on individual model pages.",

    ],

    buyingAdvice: {

      title: "Buying a Mahindra EV",

      sections: [

        {

          heading: "Portfolio overview",

          paragraphs: [

            "XUV400 remains the volume play for buyers migrating from Mahindra ICE SUVs. BE 6 and XEV 9e target buyers who want newer electric-native platforms with stronger performance and tech packaging.",

          ],

        },

        {

          heading: "Strengths",

          bullets: [

            "SUV-centric positioning with usable ground clearance for Indian roads",

            "Competitive positioning on XUV400 versus other mid-size electric SUVs",

            "BE 6 / XEV 9e bring higher DC charging claims and larger battery options",

            "Mahindra dealer network in tier-2 and tier-3 cities",

          ],

        },

        {

          heading: "Trade-offs",

          bullets: [

            "Newer BE/XEV platforms have shorter on-road history than Nexon EV — factor service maturity in your city",

            "Real-world highway range still depends on speed, load, and climate — do not rely on ARAI figures alone",

            "Variant spread can change quickly; confirm inventory and on-road price locally",

          ],

        },

        {

          heading: "Recommended buyer profile",

          paragraphs: [

            "Mahindra EVs suit SUV-first buyers who want electric running costs without downsizing to a hatchback. Less ideal if you need the lowest entry price (see Tiago EV / Comet EV) or a luxury badge.",

          ],

        },

      ],

    },

    faq: [

      {

        question: "Mahindra XUV400 vs BE 6 — which should I pick?",

        answer:

          "XUV400 if you want a proven mid-SUV at a lower entry price. BE 6 if you prioritise newer architecture, faster DC charging, and updated tech — compare variant prices, range, and service availability in your city.",

      },

      {

        question: "Is the Mahindra XEV 9e suitable for large families?",

        answer:

          "On paper it addresses three-row EV demand, but verify third-row space, real range with a full load, and charging stops on your longest trips using the model page range and charging sections.",

      },

      {

        question: "What charging setup do Mahindra EVs need?",

        answer:

          "Plan for 7.2 kW AC at home for daily use. For inter-city travel, map DC fast chargers along your route and confirm the variant’s peak DC kW — not all trims charge at the same speed.",

      },

    ],

  },

  mg: {

    introTitle: "MG EV lineup in India",

    intro: [

      "MG Motor India sells the Comet EV (urban runabout), ZS EV (compact electric SUV), and Windsor EV (mid-size electric MPV/SUV crossover). MG often wins cross-shops against Tata Nexon EV and Hyundai Kona on features-per-rupee.",

      "Catalog rankings here reflect verified pricing and intelligence scores — not ad placement. Compare warranty terms and service centre density in your city before choosing MG over Tata or Hyundai.",

    ],

    buyingAdvice: {

      title: "Buying an MG EV",

      sections: [

        {

          heading: "Lineup positioning",

          paragraphs: [

            "Comet EV covers short urban trips and second-car duty. ZS EV is the mainstream family SUV alternative to Nexon EV. Windsor EV targets buyers who want more cabin space and highway range without German luxury pricing.",

          ],

        },

        {

          heading: "Strengths",

          bullets: [

            "Feature-rich variants (ADAS, connected tech on higher trims) relative to price",

            "Competitive battery warranties on several models — verify per variant",

            "Windsor EV fills a gap for larger family EVs under ₹20 lakh (variant dependent)",

          ],

        },

        {

          heading: "Ownership considerations",

          bullets: [

            "Service network is thinner than Tata in some districts — check nearest authorised centre",

            "Comet EV range is intentionally city-limited; not a highway car",

            "Resale data is still maturing versus Nexon EV — factor hold period if you upgrade often",

          ],

        },

      ],

    },

    faq: [

      {

        question: "MG ZS EV vs Tata Nexon EV — how to decide?",

        answer:

          "Compare variant-matched price, real-world range estimates, DC charging speed, and service distance. Nexon EV wins on network scale; ZS EV often wins on feature packaging at similar price points.",

      },

      {

        question: "Is the MG Comet EV enough for Mumbai or Bengaluru commuting?",

        answer:

          "For 30–50 km daily round trips with overnight home charging, yes. For frequent highway use or minimal charging access, choose ZS EV or Windsor EV instead.",

      },

      {

        question: "What warranty coverage do MG EV batteries get?",

        answer:

          "MG typically advertises long battery warranties on EV models, but terms vary by variant and purchase date. Confirm the exact km/year coverage in your proforma invoice.",

      },

    ],

  },

  hyundai: {

    introTitle: "Hyundai EV lineup in India",

    intro: [

      "Hyundai sells the Kona Electric (long-running compact SUV), Creta Electric (mass-market SUV EV), and Ioniq 5 (premium E-GMP platform). Hyundai buyers often cross-shop Kia (shared group tech) and Tata/MG in the mid segment.",

      "Ioniq 5 is the reference for 800V-class fast charging in this price band; Kona and Creta Electric cover more mainstream budgets. All listings below sync from the master catalog.",

    ],

    buyingAdvice: {

      title: "Buying a Hyundai EV",

      sections: [

        {

          heading: "Model selection",

          paragraphs: [

            "Creta Electric targets the largest addressable market — Creta ICE upgraders. Kona Electric suits buyers who want a compact EV with highway capability. Ioniq 5 is for buyers who value charging speed and premium ride quality over lowest ticket price.",

          ],

        },

        {

          heading: "Charging ecosystem",

          bullets: [

            "Ioniq 5 supports ultra-fast DC where 800V chargers exist — still map your routes",

            "Kona/Creta rely on more common 50–100 kW DC infrastructure for road trips",

            "Home 7.2 kW AC remains the cost baseline for daily km",

          ],

        },

        {

          heading: "Who should not buy Hyundai EV yet",

          bullets: [

            "Buyers needing the absolute lowest entry EV price (see Tiago, Comet, eC3)",

            "Markets with no Hyundai EV service within practical distance",

          ],

        },

      ],

    },

    faq: [

      {

        question: "Hyundai Creta Electric vs Kona Electric — which is better?",

        answer:

          "Creta Electric if you want latest SUV packaging and Creta brand familiarity. Kona if you prefer a smaller footprint with established EV track record. Compare variant prices and DC charging curves directly.",

      },

      {

        question: "Is Hyundai Ioniq 5 worth the premium?",

        answer:

          "Only if you will use its fast-charging advantage and need premium space/ride. For mostly city driving, Creta Electric or Kona deliver lower ownership cost per km.",

      },

      {

        question: "Hyundai EV service cost — what to expect?",

        answer:

          "Scheduled EV service is typically lower than ICE (fewer wear items), but out-of-warranty battery or electronics repairs can be expensive. Budget using the ownership cost section on each model page.",

      },

    ],

  },

  byd: {

    introTitle: "BYD EV lineup in India",

    intro: [

      "BYD India retail focus includes the Atto 3 (compact electric SUV) and Seal (electric sedan). BYD competes on battery technology (Blade Battery marketing) and feature density versus MG ZS EV, Hyundai Kona, and Tata Curvv EV.",

      "Dealer footprint is still expanding versus legacy OEMs — confirm delivery, service, and charging support locally before committing.",

    ],

    buyingAdvice: {

      title: "Buying a BYD EV",

      sections: [

        {

          heading: "Positioning",

          paragraphs: [

            "Atto 3 is the volume SKU for families cross-shopping MG ZS EV and Nexon/Curvv. Seal targets sedan buyers who want long range and performance without German pricing.",

          ],

        },

        {

          heading: "Strengths",

          bullets: [

            "Competitive battery sizes and efficiency claims on Atto 3",

            "Seal offers sedan aerodynamics and highway range for executive buyers",

            "Strong standard safety/feature lists on many variants",

          ],

        },

        {

          heading: "Ownership risks to model",

          bullets: [

            "Service network density still behind Tata/Hyundai in many cities",

            "Resale liquidity is less proven than Nexon EV or Kona",

            "Verify charger compatibility and software update policy at purchase",

          ],

        },

      ],

    },

    faq: [

      {

        question: "BYD Atto 3 vs MG ZS EV — key differences?",

        answer:

          "Compare variant-matched price, WLTP/ARAI range, DC peak kW, and warranty. Atto 3 often leads on battery size; ZS EV may win on service proximity — your city determines the practical choice.",

      },

      {

        question: "Is BYD Seal practical for Indian highways?",

        answer:

          "Seal has the range credentials for highway use, but success depends on DC charger spacing on your routes and realistic speeds. Model the trip using real-world range, not brochure maximum.",

      },

    ],

  },

  kia: {

    introTitle: "Kia EV lineup in India",

    intro: [

      "Kia’s primary EV in India is the EV6 — a premium E-GMP crossover sharing platform DNA with Hyundai Ioniq 5. Buyers cross-shop BMW iX1, Volvo EX40, Mercedes EQA/EQB, and top-trim Ioniq 5.",

      "EV6 emphasis is 800V fast charging, long-range touring, and performance variants. It is not a budget first EV — see price-segment guides if you are under ₹20 lakh.",

    ],

    buyingAdvice: {

      title: "Buying a Kia EV",

      sections: [

        {

          heading: "Who EV6 fits",

          paragraphs: [

            "EV6 suits buyers upgrading from premium ICE SUVs or sedans who want fast DC charging and strong highway range. Running cost savings versus diesel luxury SUVs can be meaningful at 20,000+ km/year.",

          ],

        },

        {

          heading: "Trade-offs",

          bullets: [

            "Higher acquisition cost and insurance versus mass-market EVs",

            "Tyre and wheel costs on larger variants add to maintenance",

            "Kia EV service centres are concentrated in metros — verify rural coverage",

          ],

        },

      ],

    },

    faq: [

      {

        question: "Kia EV6 vs Hyundai Ioniq 5 — how to choose?",

        answer:

          "Both share E-GMP hardware. Compare variant price, ride tuning, warranty offers, and dealer support. Test drive both — packaging and rear space differ even with similar specs.",

      },

      {

        question: "Real-world range on Kia EV6 for highway trips?",

        answer:

          "Expect less than ARAI/certified range at 100–120 km/h with climate control. Use EVSavari real-world range estimates and plan DC stops every 200–250 km depending on pack and driving style.",

      },

    ],

  },

  bmw: {

    introTitle: "BMW EV lineup in India",

    intro: [

      "BMW India’s accessible EV entry is the iX1 — a compact luxury electric SUV competing with Mercedes EQA, Volvo EX40, and Kia EV6. BMW buyers typically prioritise badge, driving dynamics, and lease-friendly ownership over lowest per-km cost.",

      "Premium EV economics depend on home charging, annual km, and corporate tax treatment — run TCO against diesel X1/X3 only if you drive enough km to offset upfront premium.",

    ],

    buyingAdvice: {

      title: "Buying a BMW EV",

      sections: [

        {

          heading: "iX1 positioning",

          paragraphs: [

            "iX1 targets urban luxury buyers and company-car users. Range is adequate for mixed city-highway use but not class-leading versus EV6/Ioniq 5 on value metrics.",

          ],

        },

        {

          heading: "Ownership considerations",

          bullets: [

            "Insurance and tyre costs run higher than mass-market EVs",

            "BMW service packages can cap maintenance — compare against pay-as-you-go",

            "Home wallbox installation often bundled — still confirm load and parking rights",

          ],

        },

        {

          heading: "Who should skip BMW iX1",

          bullets: [

            "Buyers needing lowest total cost of ownership",

            "Families requiring three rows (see XEV 9e or ICE alternatives)",

          ],

        },

      ],

    },

    faq: [

      {

        question: "BMW iX1 vs Mercedes EQA — which luxury EV entry wins?",

        answer:

          "Compare variant price, rear space, DC charging speed, and dealer service quality in your city. Spec sheets are close — test drive and on-road quote decide.",

      },

      {

        question: "Is BMW iX1 cost-effective versus diesel BMW?",

        answer:

          "Only at higher annual km with reliable home/office charging. Below ~15,000 km/year, fuel savings may not amortise the EV price premium within a typical hold period.",

      },

    ],

  },

  "mercedes-benz": {

    introTitle: "Mercedes-Benz EV lineup in India",

    intro: [

      "Mercedes-Benz EQ range in India includes EQA and EQB — compact and compact-plus luxury electric SUVs. They compete with BMW iX1, Volvo EX40, and occasionally Kia EV6 on feature-adjusted price.",

      "EQ buyers should model corporate lease benefits, insurance loadings, and charger access — luxury EV TCO is driven by depreciation and finance more than electricity savings.",

    ],

    buyingAdvice: {

      title: "Buying a Mercedes EQ",

      sections: [

        {

          heading: "EQA vs EQB",

          paragraphs: [

            "EQA is the entry luxury EV SUV; EQB adds optional third-row flexibility for small families. Neither is a volume commuter EV — compare against Ioniq 5/EV6 if you prioritise charging speed per rupee.",

          ],

        },

        {

          heading: "Strengths",

          bullets: [

            "Refined cabin and safety tech expected at this price",

            "Mercedes service and warranty programmes for EQ models",

            "Suitable for low-km urban luxury use with home charging",

          ],

        },

        {

          heading: "Limitations",

          bullets: [

            "High depreciation versus mass-market EVs",

            "Public DC charging costs matter less than acquisition cost at this segment",

            "Third row on EQB is occasional-use only — verify seat comfort in person",

          ],

        },

      ],

    },

    faq: [

      {

        question: "Mercedes EQB third row — is it usable?",

        answer:

          "Suitable for children or short trips only. For regular seven-seat duty, test fit and boot space with all rows up before buying.",

      },

      {

        question: "Mercedes EQ warranty and battery coverage?",

        answer:

          "Mercedes advertises EQ-specific warranty packages — confirm high-voltage battery coverage duration and km cap in your sales contract, not just brochure summaries.",

      },

      {

        question: "EQA or EQB for city-only driving?",

        answer:

          "EQA if two rows suffice. EQB only if you need occasional third-row flexibility. Both assume home or office charging for sensible running costs.",

      },

    ],

  },

});



export function getBrandLandingContent(slug) {

  return BRAND_LANDING_CONTENT[slug] || null;

}


