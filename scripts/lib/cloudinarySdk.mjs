/**
 * Cloudinary SDK bootstrap for Node operational scripts.
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyCloudinarySdkConfig } from "../../src/backend/env/cloudinaryEnv.js";
import {
  formatOperationalEnvErrors,
  validateOperationalEnv,
} from "../../src/backend/envValidation.js";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

export function loadCloudinaryV2() {
  try {
    return require("cloudinary").v2;
  } catch {
    const backendPath = join(root, "../zyvev-backend/node_modules/cloudinary");
    if (existsSync(backendPath)) {
      return require(backendPath).v2;
    }
    throw new Error("cloudinary package not found. Run: npm install");
  }
}

export function configureCloudinaryOrExit() {
  const env = validateOperationalEnv({ requireCloudinary: true });
  if (!env.cloudinary.configured) {
    console.error(
      `Cloudinary env missing:\n${formatOperationalEnvErrors(env.issues)}`
    );
    process.exit(1);
  }

  const cloudinary = loadCloudinaryV2();
  const applied = applyCloudinarySdkConfig(cloudinary);
  if (!applied.ok) {
    console.error("Cloudinary SDK configuration failed");
    process.exit(1);
  }

  return { cloudinary, cloudName: applied.state.cloudName };
}
