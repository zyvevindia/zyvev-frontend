/**
 * Wikimedia Commons URL helpers and download (TLS-friendly for CI/dev).
 */

import { createHash } from "node:crypto";
import https from "node:https";

const INSECURE_AGENT = new https.Agent({ rejectUnauthorized: false });
const USER_AGENT =
  "EVSavari-PhotoReplacement/1.0 (https://github.com/zyvev; media ops bot)";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function commonsFilenameToPath(filename) {
  const normalized = filename.replace(/ /g, "_");
  const hash = createHash("md5").update(normalized).digest("hex");
  return `${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(normalized).replace(/%2C/g, ",")}`;
}

export function commonsDirectUrl(filename) {
  return `https://upload.wikimedia.org/wikipedia/commons/${commonsFilenameToPath(filename)}`;
}

export function commonsThumbUrl(filename, width = 1600) {
  const normalized = filename.replace(/ /g, "_");
  const path = commonsFilenameToPath(filename);
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${width}px-${encodeURIComponent(normalized).replace(/%2C/g, ",")}`;
}

export async function downloadBuffer(url, attempt = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    return await downloadBufferHttps(url, controller.signal);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("HTTP 429") && attempt < 6) {
      const waitMs = 1500 * 2 ** attempt;
      await sleep(waitMs);
      return downloadBuffer(url, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function downloadBufferHttps(url, signal) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent: INSECURE_AGENT,
        headers: {
          "User-Agent": USER_AGENT,
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadBufferHttps(res.headers.location, signal).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    if (signal) {
      signal.addEventListener("abort", () => {
        req.destroy(new Error("Download aborted"));
      });
    }
  });
}
