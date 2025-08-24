// /tests/e2e/hover.e2e.spec.ts

import { test, expect, type Page } from "@playwright/test";

const getButtonStyles = async (page: Page) => {
  const button = page.locator("#hover-button");
  return await button.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      transform: style.transform,
      boxShadow: style.boxShadow,
    };
  });
};

test.describe("E2E: Hover-Triggered Animation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#hover-button[data-animation-ready='true']");
  });

  test("should have initial styles", async ({ page }) => {
    const styles = await getButtonStyles(page);
    expect(styles.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(styles.boxShadow).toContain("rgba(0, 0, 0, 0.125)"); // Corresponds to #0002
  });

  test("should apply hover styles on mouseenter", async ({ page }) => {
    await page.locator("#hover-button").hover();
    await page.waitForTimeout(300);

    const styles = await getButtonStyles(page);
    expect(styles.transform).toBe("matrix(1.05, 0, 0, 1.05, 0, 0)");
    expect(styles.boxShadow).toContain("rgba(0, 0, 0, 0.25)"); // Corresponds to #0004
  });

  test("should revert to initial styles on mouseleave", async ({ page }) => {
    const button = page.locator("#hover-button");
    await button.hover();
    await page.waitForTimeout(300);

    await page.mouse.move(0, 0); // Move mouse away
    await page.waitForTimeout(300);

    const styles = await getButtonStyles(page);
    expect(styles.transform).toBe("matrix(1, 0, 0, 1, 0, 0)");
  });
});
