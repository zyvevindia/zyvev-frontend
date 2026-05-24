/**
 * Operational env bootstrap — MUST be the first import in every scripts/*.mjs file.
 * Contains only dotenv loading (no backend modules that read env at import time).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadNodeEnvCore } from "../../src/backend/env/loadNodeEnvCore.js";

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

loadNodeEnvCore({ root: PROJECT_ROOT, diagnostics: true });
