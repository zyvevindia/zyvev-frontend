import { expect } from "@playwright/test";

/**
 * Assert the global React ErrorBoundary did not render.
 */
export async function assertHealthyPage(page) {
  await expect(page.getByRole("heading", { name: "Something Went Wrong" })).toHaveCount(
    0
  );
  await expect(page.getByRole("button", { name: "Reload Website" })).toHaveCount(0);
}
