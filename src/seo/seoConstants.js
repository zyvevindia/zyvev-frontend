/** Calendar year surfaced in SEO titles — update annually. */

export const SEO_CONTENT_YEAR = 2026;



/**

 * @param {string} baseTitle — without brand suffix

 * @param {string} subtitle — e.g. "Compare Price, Range & Charging"

 */

export function formatLandingSeoTitle(baseTitle, subtitle) {

  const base = String(baseTitle || "").trim();

  const sub = String(subtitle || "").trim();

  if (!sub) return `${base} (${SEO_CONTENT_YEAR})`;

  return `${base} (${SEO_CONTENT_YEAR}) – ${sub}`;

}


