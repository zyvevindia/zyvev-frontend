export function buildOwnershipSummary(topicLabel, bullets = []) {
  const defaults = [
    `Factor ${topicLabel} into your total cost of ownership alongside electricity rates and charging access.`,
    "Verify warranty terms and service network coverage in your city before purchase.",
    "Shortlist two to three model families, then compare variants on EVSavari.",
  ];

  return uniqueBulletStrings([...bullets, ...defaults]).slice(0, 5);
}

function uniqueBulletStrings(items) {
  const seen = new Set();
  return items.filter((b) => {
    const k = b.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
