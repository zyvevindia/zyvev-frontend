/**
 * Cloudinary env normalization for Node operational scripts.
 * Supports CLOUDINARY_URL and discrete CLOUDINARY_* / VITE_CLOUDINARY_* vars.
 */

/**
 * @param {string} url
 * @returns {{ apiKey: string, apiSecret: string, cloudName: string } | null}
 */
export function parseCloudinaryUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "cloudinary:") return null;

    const apiKey = decodeURIComponent(parsed.username || "");
    const apiSecret = decodeURIComponent(parsed.password || "");
    const cloudName = parsed.hostname || "";

    if (!apiKey || !apiSecret || !cloudName) return null;

    return { apiKey, apiSecret, cloudName };
  } catch {
    return null;
  }
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function normalizeCloudinaryEnv(env = process.env) {
  const urlParsed = env.CLOUDINARY_URL
    ? parseCloudinaryUrl(env.CLOUDINARY_URL)
    : null;

  if (urlParsed) {
    if (!env.CLOUDINARY_API_KEY) env.CLOUDINARY_API_KEY = urlParsed.apiKey;
    if (!env.CLOUDINARY_API_SECRET) env.CLOUDINARY_API_SECRET = urlParsed.apiSecret;
    if (!env.CLOUDINARY_CLOUD_NAME) env.CLOUDINARY_CLOUD_NAME = urlParsed.cloudName;
  }

  const cloudName = String(
    env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || urlParsed?.cloudName || ""
  ).trim();

  if (cloudName) {
    if (!env.CLOUDINARY_CLOUD_NAME) env.CLOUDINARY_CLOUD_NAME = cloudName;
    if (!env.VITE_CLOUDINARY_CLOUD_NAME) env.VITE_CLOUDINARY_CLOUD_NAME = cloudName;
  }

  return env;
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function getCloudinaryEnvState(env = process.env) {
  normalizeCloudinaryEnv(env);

  const cloudName = String(
    env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || ""
  ).trim();
  const apiKey = String(env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(env.CLOUDINARY_API_SECRET || "").trim();
  const cloudinaryUrl = String(env.CLOUDINARY_URL || "").trim();

  const configured = Boolean(cloudName && apiKey && apiSecret);

  return {
    configured,
    cloudName,
    apiKey,
    apiSecret,
    cloudinaryUrl,
    hasUrl: Boolean(cloudinaryUrl),
  };
}

/**
 * @param {import('cloudinary').v2} cloudinary
 * @param {NodeJS.ProcessEnv} [env]
 */
export function applyCloudinarySdkConfig(cloudinary, env = process.env) {
  const state = getCloudinaryEnvState(env);
  if (!state.configured) {
    return { ok: false, state };
  }

  cloudinary.config({
    cloud_name: state.cloudName,
    api_key: state.apiKey,
    api_secret: state.apiSecret,
    secure: true,
  });

  return { ok: true, state };
}
