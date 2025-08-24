// /tests/e2e/header.e2e.spec.ts

import { test, expect, type Page } from "@playwright/test";

const getHeaderStyles = async (page: Page) => {
  const header = page.locator("#main-header");
  return await header.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      backgroundColor: style.backgroundColor,
      backdropFilter: style.backdropFilter,
    };
  });
};

const getLogoTransform = async (page: Page) => {
  const logo = page.locator("#header-logo");
  return await logo.evaluate((el) => window.getComputedStyle(el).transform);
};

test.describe("E2E: Scroll-Triggered Header Animation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the JS to initialize
    await page.waitForSelector("#main-header[data-animation-ready='true']");
  });

  test("should be in the initial (expanded) state on page load", async ({ page }) => {
    const styles = await getHeaderStyles(page);
    expect(styles.backgroundColor).toBe("rgba(255, 255, 255, 0.1)");

    const transform = await getLogoTransform(page);
    expect(transform).toBe("matrix(1, 0, 0, 1, 0, 0)"); // scale(1)
  });

  test("should transition to the compact state on scroll down", async ({ page }) => {
    await page.mouse.wheel(0, 300); // Scroll down
    await page.waitForTimeout(500); // Wait for animation to complete

    const styles = await getHeaderStyles(page);
    expect(styles.backgroundColor).toBe("rgba(0, 0, 0, 0.5)");

    const transform = await getLogoTransform(page);
    expect(transform).toBe("matrix(0.85, 0, 0, 0.85, 0, 0)"); // scale(0.85)
  });

  test("should revert to expanded state when hovered in compact state", async ({ page }) => {
    await page.mouse.wheel(0, 300); // Enter compact state
    await page.waitForTimeout(500);

    await page.locator("#main-header").hover();
    await page.waitForTimeout(500);

    const styles = await getHeaderStyles(page);
    expect(styles.backgroundColor).toBe("rgba(255, 255, 255, 0.1)"); // Reverted

    const transform = await getLogoTransform(page);
    expect(transform).toBe("matrix(1, 0, 0, 1, 0, 0)"); // Reverted
  });

  test("should return to compact state when mouse leaves after hover", async ({ page }) => {
    await page.mouse.wheel(0, 300); // Compact state
    await page.waitForTimeout(500);

    const header = page.locator("#main-header");
    await header.hover();
    await page.waitForTimeout(500);

    // Move mouse away to trigger mouseleave
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500); // Wait for debounce + animation

    const styles = await getHeaderStyles(page);
    expect(styles.backgroundColor).toBe("rgba(0, 0, 0, 0.5)"); // Back to compact

    const transform = await getLogoTransform(page);
    expect(transform).toBe("matrix(0.85, 0, 0, 0.85, 0, 0)"); // Back to compact
  });
});
