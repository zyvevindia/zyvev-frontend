/**
 * Brand hub pages — grouped from tier-1 catalog families.
 */
import { SITE_ORIGIN, slugToDisplay, wrapSeoPage } from "./utils.mjs";

/** @type {{ slug: string, name: string, families: string[] }[]} */
export const BRAND_DEFS = [
  {
    slug: "tata",
    name: "Tata",
    families: ["tata-nexon-ev", "tata-curvv-ev", "tata-punch-ev", "tata-tiago-ev"],
  },
  {
    slug: "mg",
    name: "MG",
    families: ["mg-zs-ev", "mg-comet-ev"],
  },
  {
    slug: "mahindra",
    name: "Mahindra",
    families: ["mahindra-xuv400", "mahindra-be-6", "mahindra-xev-9e"],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    families: ["hyundai-kona-electric"],
  },
  {
    slug: "kia",
    name: "Kia",
    families: ["kia-ev6"],
  },
  {
    slug: "byd",
    name: "BYD",
    families: ["byd-atto-3"],
  },
  {
    slug: "citroen",
    name: "Citroen",
    families: ["citroen-ec3"],
  },
  {
    slug: "bmw",
    name: "BMW",
    families: ["bmw-ix1"],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    families: ["mercedes-eqb", "mercedes-eqa"],
  },
  {
    slug: "volvo",
    name: "Volvo",
    families: ["volvo-ex40"],
  },
];

function brandIntro(brand) {
  return `${brand.name} offers multiple electric model families in India. Use this hub to compare ${brand.name} EV line-ups, trims, and ownership fit before you shortlist a test drive. Rankings use EVSavari catalog intelligence — not paid placement.`;
}

export function generateBrandPage(brandDef) {
  const rankedVehicles = brandDef.families.map((familySlug, index) => ({
    rank: index + 1,
    slug: familySlug,
    displayName: slugToDisplay(familySlug),
    explanation: `Explore ${slugToDisplay(familySlug)} specs, variants, and EVSavari scores on the family page.`,
    detailPath: `/cars/${familySlug}`,
  }));

  const seoPage = {
    slug: `brand-${brandDef.slug}`,
    category: "brand",
    title: `${brandDef.name} Electric Cars in India — Models, Prices & Guides | EVSavari`,
    metaDescription: `Explore ${brandDef.name} electric cars in India — model families, pricing bands, range, and buyer guides on EVSavari.`,
    canonicalPath: `/brands/${brandDef.slug}`,
    canonicalUrl: `${SITE_ORIGIN}/brands/${brandDef.slug}`,
    intro: brandIntro(brandDef),
    recommendationLogic: {
      category: "brand",
      methodology:
        "Curated links to model families and EVSavari decision guides — rankings use catalog intelligence, not paid placement.",
    },
    rankedVehicles,
    tradeoffs: [
      `${brandDef.name} EV buyers should compare trims and real-world range for their commute before choosing a variant.`,
      "Service network density varies by city — verify local support when shortlisting.",
    ],
    faq: [
      {
        question: `Which ${brandDef.name} EV should I compare first?`,
        answer: `Start with the family that matches your budget and body style, then compare variants on EVSavari.`,
      },
      {
        question: `Where can I compare ${brandDef.name} EV variants?`,
        answer: "Open any family page on EVSavari to switch trims or use the compare tool for side-by-side specs.",
      },
    ],
    keywords: [
      `${brandDef.name} electric car India`,
      `${brandDef.name} EV`,
      "EVSavari",
      "electric car comparison",
    ],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: rankedVehicles.map((v, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: v.displayName,
        url: `${SITE_ORIGIN}${v.detailPath}`,
      })),
    },
  };

  return wrapSeoPage(seoPage);
}
