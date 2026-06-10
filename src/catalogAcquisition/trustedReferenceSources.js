/**
 * Config-driven allowlist for trusted reference site connectors.
 */

export const TRUSTED_REFERENCE_SOURCES = Object.freeze([
  {
    id: "cardekho",
    name: "CarDekho",
    domains: ["cardekho.com", "www.cardekho.com"],
  },
  {
    id: "zigwheels",
    name: "ZigWheels",
    domains: ["zigwheels.com", "www.zigwheels.com"],
  },
  {
    id: "carwale",
    name: "CarWale",
    domains: ["carwale.com", "www.carwale.com"],
  },
]);

/**
 * @param {string} url
 * @returns {{ id: string, name: string } | null}
 */
export function matchTrustedReferenceSource(url = "") {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  for (const source of TRUSTED_REFERENCE_SOURCES) {
    if (source.domains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return { id: source.id, name: source.name };
    }
  }
  return null;
}

export function isTrustedReferenceUrl(url = "") {
  return Boolean(matchTrustedReferenceSource(url));
}
