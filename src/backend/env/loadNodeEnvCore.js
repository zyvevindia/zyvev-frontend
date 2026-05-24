/**
 * Minimal dotenv bootstrap — no backend imports (safe for bootstrapEnv.mjs).
 */

import { config as dotenvConfig } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let loaded = false;
/** @type {import('./loadNodeEnv.js').NodeEnvLoadResult | null} */
let loadResult = null;

/**
 * @param {string} [startDir]
 */
export function findProjectRoot(startDir = __dirname) {
  let dir = startDir;

  for (let i = 0; i < 12; i += 1) {
    if (existsSync(join(dir, "package.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return join(__dirname, "../../..");
}

function safeUrlHost(url = "") {
  try {
    return new URL(String(url)).host;
  } catch {
    return "(invalid-url)";
  }
}

function countParsedKeys(parsed) {
  return parsed && typeof parsed === "object" ? Object.keys(parsed).length : 0;
}

/**
 * @param {{ root?: string, force?: boolean, diagnostics?: boolean }} [options]
 */
export function loadNodeEnvCore(options = {}) {
  if (loaded && !options.force) {
    return loadResult;
  }

  const root = options.root || findProjectRoot();
  const diagnostics = options.diagnostics !== false;
  const loadedFiles = [];
  const parseStats = [];

  const envPath = join(root, ".env");
  const localPath = join(root, ".env.local");

  if (existsSync(envPath)) {
    const result = dotenvConfig({ path: envPath, quiet: true });
    loadedFiles.push(".env");
    parseStats.push({
      file: ".env",
      keys: countParsedKeys(result?.parsed),
      error: result?.error?.message || null,
    });
  }

  if (existsSync(localPath)) {
    const result = dotenvConfig({ path: localPath, override: true, quiet: true });
    loadedFiles.push(".env.local");
    parseStats.push({
      file: ".env.local",
      keys: countParsedKeys(result?.parsed),
      error: result?.error?.message || null,
    });
  }

  if (diagnostics) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    console.log(
      [
        "bootstrap-env:",
        `cwd=${process.cwd()}`,
        `root=${root}`,
        `.env=${existsSync(envPath) ? envPath : "(missing)"}`,
        `.env.local=${existsSync(localPath) ? localPath : "(missing)"}`,
        `VITE_SUPABASE_URL=${supabaseUrl ? `set (${safeUrlHost(supabaseUrl)})` : "MISSING"}`,
        `VITE_SUPABASE_ANON_KEY=${supabaseAnon ? "set" : "MISSING"}`,
        `SUPABASE_SERVICE_ROLE_KEY=${serviceRole ? "set" : "MISSING"}`,
        `CLOUDINARY_URL=${cloudinaryUrl ? "set" : "MISSING"}`,
        `parsed=${parseStats.map((s) => `${s.file}:${s.keys}keys${s.error ? ":err" : ""}`).join(", ") || "none"}`,
      ].join(" ")
    );
  }

  loaded = true;
  loadResult = {
    ok: true,
    root,
    loadedFiles,
    parseStats,
    supabaseUrlSet: Boolean(process.env.VITE_SUPABASE_URL),
    supabaseAnonSet: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
  };
  return loadResult;
}

export function isNodeEnvCoreLoaded() {
  return loaded;
}

export function getNodeEnvCoreLoadResult() {
  return loadResult;
}
