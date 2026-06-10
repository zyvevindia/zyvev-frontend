/**
 * EVSavari photo replacement tracker — golden fleet local assets.
 */

export const TRACKER_IMAGE_TYPES = Object.freeze([
  "listing",
  "compare",
  "front",
  "rear",
  "side",
  "interior",
  "dashboard",
]);

export const TRACKER_VEHICLE_SLUGS = Object.freeze([
  "hyundai-kona-electric",
  "mahindra-xev-9e",
  "mahindra-xuv400",
  "mahindra-be-6",
  "tata-nexon-ev",
  "tata-curvv-ev",
  "tata-punch-ev",
  "tata-tiago-ev",
  "tata-tigor-ev",
  "tata-harrier-ev",
  "mg-comet-ev",
  "mg-zs-ev",
  "mg-windsor-ev",
  "hyundai-creta-electric",
  "hyundai-ioniq-5",
  "maruti-e-vitara",
  "kia-ev6",
  "byd-atto-3",
  "byd-seal",
  "bmw-ix1",
  "mercedes-eqa",
  "mercedes-eqb",
  "volvo-ex40",
  "mini-cooper-se",
  "citroen-ec3",
]);

const DISPLAY_NAMES = Object.freeze({
  "hyundai-kona-electric": "Hyundai Kona Electric",
  "mahindra-xev-9e": "Mahindra XEV 9e",
  "mahindra-xuv400": "Mahindra XUV400",
  "mahindra-be-6": "Mahindra BE 6",
  "tata-nexon-ev": "Tata Nexon EV",
  "tata-curvv-ev": "Tata Curvv EV",
  "tata-punch-ev": "Tata Punch EV",
  "tata-tiago-ev": "Tata Tiago EV",
  "tata-tigor-ev": "Tata Tigor EV",
  "tata-harrier-ev": "Tata Harrier EV",
  "mg-comet-ev": "MG Comet EV",
  "mg-zs-ev": "MG ZS EV",
  "mg-windsor-ev": "MG Windsor EV",
  "hyundai-creta-electric": "Hyundai Creta Electric",
  "hyundai-ioniq-5": "Hyundai Ioniq 5",
  "maruti-e-vitara": "Maruti Suzuki e Vitara",
  "kia-ev6": "Kia EV6",
  "byd-atto-3": "BYD Atto 3",
  "byd-seal": "BYD Seal",
  "bmw-ix1": "BMW iX1",
  "mercedes-eqa": "Mercedes-Benz EQA",
  "mercedes-eqb": "Mercedes-Benz EQB",
  "volvo-ex40": "Volvo EX40",
  "mini-cooper-se": "MINI Cooper SE",
  "citroen-ec3": "Citroen eC3",
});

export function localAssetPath(slug, imageType) {
  return `/images/cars/${slug}/${imageType}.webp`;
}

export function displayNameForSlug(slug) {
  return (
    DISPLAY_NAMES[slug] ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export function buildPlaceholderAsset(slug, imageType) {
  return {
    imageType,
    filename: `${imageType}.webp`,
    path: localAssetPath(slug, imageType),
    status: "placeholder",
    replacedAt: null,
    notes: "",
  };
}

export function buildPhotoReplacementTracker() {
  const vehicles = TRACKER_VEHICLE_SLUGS.map((slug) => {
    const assets = Object.fromEntries(
      TRACKER_IMAGE_TYPES.map((type) => [
        type,
        buildPlaceholderAsset(slug, type),
      ])
    );
    return {
      slug,
      displayName: displayNameForSlug(slug),
      assets,
    };
  });

  const totalSlots =
    TRACKER_VEHICLE_SLUGS.length * TRACKER_IMAGE_TYPES.length;

  return {
    version: "photo-replacement-v1",
    generatedAt: new Date().toISOString(),
    purpose:
      "Track replacement of generated/placeholder local car photos with production photography",
    imageTypes: [...TRACKER_IMAGE_TYPES],
    statusLegend: {
      placeholder: "Generated or seed asset — awaiting real photo replacement",
      in_progress: "Shoot/edit in progress",
      replaced: "Production photo uploaded to public/images/cars/",
      approved: "Ops-approved for buyer-facing use",
    },
    vehicles,
    summary: {
      vehicleCount: TRACKER_VEHICLE_SLUGS.length,
      imageTypesPerVehicle: TRACKER_IMAGE_TYPES.length,
      totalSlots,
      byStatus: {
        placeholder: totalSlots,
        in_progress: 0,
        replaced: 0,
        approved: 0,
      },
    },
  };
}

export function formatPhotoReplacementMarkdown(report) {
  const lines = [
    "# EVSavari Photo Replacement Tracker",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Track production photography replacing placeholder WebP assets under `public/images/cars/{slug}/`.",
    "",
    "## Summary",
    "",
    `- Vehicles: **${report.summary.vehicleCount}**`,
    `- Image types per vehicle: **${report.summary.imageTypesPerVehicle}**`,
    `- Total slots: **${report.summary.totalSlots}**`,
    `- Placeholder: **${report.summary.byStatus.placeholder}**`,
    `- In progress: **${report.summary.byStatus.in_progress}**`,
    `- Replaced: **${report.summary.byStatus.replaced}**`,
    `- Approved: **${report.summary.byStatus.approved}**`,
    "",
    "## Image types",
    "",
    ...report.imageTypes.map(
      (t) => `- \`${t}.webp\` — ${t === "listing" ? "card / browse" : t === "compare" ? "compare column" : "detail gallery / hero"}`
    ),
    "",
    "## Status legend",
    "",
  ];

  for (const [key, desc] of Object.entries(report.statusLegend)) {
    lines.push(`- **${key}:** ${desc}`);
  }

  lines.push("", "## Fleet tracker", "");
  lines.push(
    "| Vehicle | listing | compare | front | rear | side | interior | dashboard |"
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const row of report.vehicles) {
    const cells = report.imageTypes.map(
      (t) => row.assets[t]?.status || "—"
    );
    lines.push(
      `| ${row.displayName} (\`${row.slug}\`) | ${cells.join(" | ")} |`
    );
  }

  lines.push("", "## Paths", "");
  lines.push(
    "All assets live at `public/images/cars/{familySlug}/{type}.webp` and serve as `/images/cars/{familySlug}/{type}.webp`."
  );
  lines.push("");
  lines.push(
    "Update statuses in `docs/media/photo-replacement-tracker.json`, then re-run `npm run media:photo-tracker` to refresh this table."
  );

  return lines.join("\n");
}
