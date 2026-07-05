#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const reportDir = process.argv[2];
const htmlPath = path.join(reportDir, "playwright-report/index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const match = html.match(
  /<template id="playwrightReportBase64">data:application\/zip;base64,([^<]+)<\/template>/
);
if (!match) {
  console.error("No embedded zip in", htmlPath);
  process.exit(1);
}

const entries = unzipSync(new Uint8Array(Buffer.from(match[1], "base64")));
const reportPath = Object.keys(entries).find((n) => n.endsWith("report.json"));
if (!reportPath) {
  console.error("No report.json in zip");
  process.exit(1);
}

const report = JSON.parse(Buffer.from(entries[reportPath]).toString("utf8"));

function walkSuites(suites, project = "", order = { n: 0 }) {
  const results = [];
  for (const suite of suites || []) {
    const title = [project, suite.title].filter(Boolean).join(" › ");
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        order.n += 1;
        const result = test.results?.[0];
        results.push({
          order: order.n,
          project: test.projectName,
          title: spec.title,
          file: spec.file,
          line: spec.line,
          status: result?.status,
          error: result?.error,
          attachments: result?.attachments,
          stdout: result?.stdout,
          stderr: result?.stderr,
        });
      }
    }
    results.push(...walkSuites(suite.suites, title, order));
  }
  return results;
}

const all = walkSuites(report.suites);
const failed = all.filter((t) => t.status === "failed" || t.status === "timedOut");
failed.sort((a, b) => a.order - b.order);
const first = failed[0];
console.log("TOTAL", all.length, "FAILED", failed.length);
console.log("FIRST_FAIL", JSON.stringify(first, null, 2));
