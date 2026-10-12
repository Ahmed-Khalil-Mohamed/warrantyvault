import { test, expect } from "@playwright/test";
test("a warranty claim retains its reference and resolution", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore with sample data", exact: true })
    .click();
  await page
    .locator(".record-card")
    .filter({ hasText: "In warranty" })
    .first()
    .locator(".record-title")
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Open a claim", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Claim reference / issue")
    .fill("TEST-WARRANTY");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".status")).toHaveText(
    "Claim open",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Resolve claim", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Resolution")
    .fill("Replacement collected");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Replacement collected", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("TEST-WARRANTY", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog").locator(".status")).toHaveText(
    "In warranty",
  );
});
