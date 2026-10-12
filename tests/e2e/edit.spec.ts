import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { projects } from "../../src/projects";
const p = projects[0];
test("editing descriptions preserves records, keyboard behavior and theme accessibility", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore with sample data", exact: true })
    .click();
  await expect(page.locator(".record-card").first()).toBeVisible();
  await page.locator(".record-card .record-title").first().click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Edit details", exact: true })
    .click();
  const dialog = page.getByRole("dialog"),
    key =
      p.id === "queuewise" ? "name" : p.id === "recall" ? "question" : "title";
  await dialog.locator(`[name="${key}"]`).fill("Corrected from the UI");
  await dialog
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Corrected from the UI", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.locator(".record-card").filter({ hasText: "Corrected from the UI" }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Use dark theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual(
    [],
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `docs/screenshots/${p.id}-dark.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
