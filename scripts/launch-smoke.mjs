/**
 * Soft-launch smoke helpers — run: npm run launch:smoke
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

console.log("\n=== EVSavari launch smoke ===\n");
console.log("1/4 SEO QA…\n");

try {
  await run("npm", ["run", "seo:qa"]);
} catch {
  console.error("\nSEO QA reported issues — review before launch.\n");
  process.exit(1);
}

console.log("\n2/4 Launch validate…\n");

try {
  await run("npm", ["run", "launch:validate"]);
} catch {
  console.error("\nLaunch validate failed.\n");
  process.exit(1);
}

console.log("\n3/4 Soft-launch smoke…\n");

try {
  await run("npm", ["run", "soft-launch:smoke"]);
} catch {
  console.error("\nSoft-launch smoke failed.\n");
  process.exit(1);
}

console.log("\n4/4 Media audit…\n");

try {
  await run("npm", ["run", "media:audit"]);
} catch {
  console.error("\nMedia audit reported blocking issues.\n");
  process.exit(1);
}

console.log(
  "\nAutomated checks passed. Complete manual steps in docs/launch/production-smoke-test.md\n"
);
