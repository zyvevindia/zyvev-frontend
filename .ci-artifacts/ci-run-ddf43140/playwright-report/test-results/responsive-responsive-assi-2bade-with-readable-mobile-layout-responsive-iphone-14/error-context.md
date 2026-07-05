# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive/responsive-assistant.spec.js >> Responsive assistant journey >> completes assistant flow with readable mobile layout
- Location: tests/responsive/responsive-assistant.spec.js:18:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.assistant-page')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.assistant-page')

```

```yaml
- text: ⚡
- heading "Something Went Wrong" [level=1]
- paragraph: EVSavari encountered an unexpected issue. Please refresh the page and try again.
- button "Reload Website"
- button "Go To Homepage"
- group: Technical Details
```

# Test source

```ts
  1   | import { expect } from "@playwright/test";
  2   | 
  3   | import { assertHealthyPage } from "./assertHealthyPage.js";
  4   | 
  5   | /** @typedef {Record<string, string>} AssistantAnswerLabels */
  6   | 
  7   | export const ASSISTANT_FLOW_FAMILY_VALUE = Object.freeze({
  8   |   budget: "15–20L",
  9   |   usage: "Mixed",
  10  |   family: "Family",
  11  |   charging: "Home",
  12  |   priority: "Value",
  13  | });
  14  | 
  15  | export const ASSISTANT_FLOW_BUDGET_COMMUTER = Object.freeze({
  16  |   budget: "<15L",
  17  |   usage: "City",
  18  |   family: "Single",
  19  |   charging: "Apartment",
  20  |   priority: "Running Cost",
  21  | });
  22  | 
  23  | export const ASSISTANT_FLOW_PREMIUM_HIGHWAY = Object.freeze({
  24  |   budget: "30L+",
  25  |   usage: "Highway",
  26  |   family: "Couple",
  27  |   charging: "Home",
  28  |   priority: "Premium Experience",
  29  | });
  30  | 
  31  | const FLOW_LABEL_ORDER = ["budget", "usage", "family", "charging", "priority"];
  32  | 
  33  | /**
  34  |  * Wait until the assistant welcome screen is hydrated and interactive.
  35  |  *
  36  |  * @param {import("@playwright/test").Page} page
  37  |  */
  38  | export async function waitForAssistantWelcome(page) {
  39  |   await assertHealthyPage(page);
> 40  |   await expect(page.locator(".assistant-page")).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  41  |   await expect(
  42  |     page.getByRole("heading", { name: "Find EVs that match how you actually drive" })
  43  |   ).toBeVisible();
  44  |   await expect(page.getByRole("button", { name: "Get started" })).toBeEnabled();
  45  | }
  46  | 
  47  | /**
  48  |  * @param {import("@playwright/test").Page} page
  49  |  * @param {{ navigate?: boolean }} [options]
  50  |  */
  51  | export async function startAssistant(page, options = {}) {
  52  |   const { navigate = true } = options;
  53  | 
  54  |   if (navigate) {
  55  |     await page.goto("/assistant", { waitUntil: "domcontentloaded" });
  56  |   }
  57  | 
  58  |   await waitForAssistantWelcome(page);
  59  |   await page.getByRole("button", { name: "Get started" }).click();
  60  |   await expectFirstQuestion(page);
  61  | }
  62  | 
  63  | /**
  64  |  * @param {import("@playwright/test").Page} page
  65  |  * @param {AssistantAnswerLabels} answers
  66  |  */
  67  | export async function answerAssistantFlow(page, answers) {
  68  |   for (const key of FLOW_LABEL_ORDER) {
  69  |     const label = answers[key];
  70  |     if (!label) {
  71  |       throw new Error(`Missing assistant answer label for ${key}`);
  72  |     }
  73  | 
  74  |     const option = page.getByRole("radio", { name: label, exact: true });
  75  |     await expect(option).toBeVisible();
  76  |     await expect(option).toBeEnabled();
  77  |     await option.click();
  78  |   }
  79  | }
  80  | 
  81  | /**
  82  |  * @param {import("@playwright/test").Page} page
  83  |  * @param {AssistantAnswerLabels} answers
  84  |  */
  85  | export async function completeAssistantToResults(page, answers, options = {}) {
  86  |   await startAssistant(page, options);
  87  |   await answerAssistantFlow(page, answers);
  88  |   await expectAssistantResults(page);
  89  | }
  90  | 
  91  | /**
  92  |  * @param {import("@playwright/test").Page} page
  93  |  */
  94  | export async function expectAssistantResults(page) {
  95  |   await expect(
  96  |     page.getByRole("heading", { name: "EVs that fit your brief" })
  97  |   ).toBeVisible();
  98  |   await expect(page.locator(".assistant-vehicle-card").first()).toBeVisible();
  99  |   await assertHealthyPage(page);
  100 | }
  101 | 
  102 | /**
  103 |  * @param {import("@playwright/test").Page} page
  104 |  */
  105 | export async function expectStrongMatchesSection(page) {
  106 |   await expect(page.getByRole("heading", { name: "Strong Matches" })).toBeVisible();
  107 | }
  108 | 
  109 | /**
  110 |  * @param {import("@playwright/test").Page} page
  111 |  * @param {string[]} vehicleNames
  112 |  */
  113 | export async function expectVehiclesVisible(page, vehicleNames) {
  114 |   for (const name of vehicleNames) {
  115 |     await expect(page.locator(".assistant-vehicle-card__name", { hasText: name })).toBeVisible();
  116 |   }
  117 | }
  118 | 
  119 | /**
  120 |  * @param {import("@playwright/test").Page} page
  121 |  */
  122 | export async function restartAssistant(page) {
  123 |   await page.getByRole("button", { name: "Restart" }).click();
  124 | }
  125 | 
  126 | /**
  127 |  * @param {import("@playwright/test").Page} page
  128 |  */
  129 | export async function expectAssistantWelcome(page) {
  130 |   await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
  131 | }
  132 | 
  133 | /**
  134 |  * @param {import("@playwright/test").Page} page
  135 |  */
  136 | export async function expectFirstQuestion(page) {
  137 |   await expect(
  138 |     page.getByRole("heading", { name: "What is your budget range?" })
  139 |   ).toBeVisible();
  140 |   await expect(page.getByLabel("Step 1 of 5")).toBeVisible();
```