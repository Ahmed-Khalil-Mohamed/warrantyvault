import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
import { projects } from "../../src/projects";
const ids = projects.map((p) => p.id);
async function demo(page: Page, id: string) {
  await page.goto("/" + id);
  await page
    .getByRole("button", { name: "Explore with sample data", exact: true })
    .click();
  await expect(page.locator(".record-card").first()).toBeVisible();
}
test("workspace render, search, export and remain accessible in both languages", async ({
  page,
}) => {
  const jsErrors: string[] = [];
  page.on("pageerror", (e) => jsErrors.push(e.message));
  await demo(page, projects[0].id);
  mkdirSync("docs/screenshots", { recursive: true });
  for (const id of ids) {
    await page.goto("/" + id);
    await expect(page.locator(".record-card").first()).toBeVisible();
    await expect(page.locator(".metric")).toHaveCount(3);
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await page
      .getByRole("textbox", { name: "Search records" })
      .fill("a-query-with-no-results");
    await expect(page.getByText("No matches this time.")).toBeVisible();
    await page.getByRole("textbox", { name: "Search records" }).clear();
    await expect(page.locator(".record-card").first()).toBeVisible();
    await page.locator(".record-tools summary").click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV", exact: true }).click();
    expect((await download).suggestedFilename()).toBe(id + "-export.csv");
    await page.locator(".record-tools summary").click();
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      accessibility.violations,
      JSON.stringify(accessibility.violations, null, 2),
    ).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `docs/screenshots/${id}-en.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "العربية", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const arabic = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      arabic.violations,
      JSON.stringify(arabic.violations, null, 2),
    ).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `docs/screenshots/${id}-ar.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "English", exact: true }).click();
  }
  expect(jsErrors).toEqual([]);
});
test("responsive workspace and entry page fit 375, 414, 768, 1024 and 1440px", async ({
  page,
}) => {
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.screenshot({ path: "docs/screenshots/entry.png", fullPage: true });
  for (const width of [375, 414, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await demo(page, projects[0].id);
  for (const width of [375, 414, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ids) {
      await page.goto("/" + id);
      await expect(page.locator(".record-card").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${id} at ${width}`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/" + projects[0].id);
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/mobile-ar.png",
    fullPage: true,
  });
});
test("creation form persist validated records", async ({ page }) => {
  await demo(page, projects[0].id);
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    today = new Date().toISOString().slice(0, 10);
  const records: Record<string, Record<string, string>> = {
    queuewise: { name: "E2E new visitor", notes: "A test note" },
    fixlane: { title: "E2E new repair", location: "Unit 6" },
    rescuetable: {
      title: "E2E food batch",
      donor: "Kitchen",
      location: "Collection desk",
      portions: "10",
      expiresAt: future,
    },
    scopedesk: {
      title: "E2E client project",
      client: "Client",
      budget: "1200.50",
      dueDate: future.slice(0, 10),
      scope: "First deliverable\nSecond deliverable",
    },
    givetime: {
      title: "E2E volunteer shift",
      location: "Library",
      startsAt: future,
      hours: "2",
      capacity: "6",
    },
    filenest: {
      title: "E2E sorting rule",
      extensions: "md,txt",
      folder: "Notes",
    },
    warrantyvault: {
      title: "E2E purchase",
      retailer: "Shop",
      serial: "TEST-001",
      purchasedAt: today,
      expiresAt: future.slice(0, 10),
      price: "1250.25",
    },
    stockroom: {
      title: "E2E new product",
      sku: "E2E-SKU",
      quantity: "20",
      reorder: "5",
      unitCost: "12.50",
    },
    fairshare: {
      title: "E2E household bill",
      amount: "100.01",
      paidBy: "Nour",
      participants: "Nour,Omar,Salma",
      date: today,
    },
    recall: {
      question: "E2E study question",
      answer: "An answer",
      topic: "Testing",
    },
  };
  for (const p of projects) {
    await page.goto("/" + p.id);
    await expect(page.locator(".record-card").first()).toBeVisible();
    await page
      .getByRole("button", { name: p.createLabel.en, exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    for (const [key, value] of Object.entries(records[p.id]))
      await dialog.locator(`[name="${key}"]`).fill(value);
    await dialog
      .getByRole("button", { name: "Save record", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    const title =
      records[p.id].title ?? records[p.id].name ?? records[p.id].question;
    await expect(
      page.locator(".record-card").filter({ hasText: title }),
    ).toHaveCount(1);
    await page.reload();
    await expect(
      page.locator(".record-card").filter({ hasText: title }),
    ).toHaveCount(1);
  }
});
