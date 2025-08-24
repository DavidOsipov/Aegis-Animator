// /playwright.config.ts

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Directory where the tests are located
  testDir: "./tests/e2e",

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Use multiple workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: "html",

  // Shared settings for all the projects below.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: "http://localhost:8080/tests/e2e/harness/",

    // Collect trace when retrying the failed test.
    trace: "on-first-retry",
  },

  // Configure projects for major browsers
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  // Run a local dev server before starting the tests
  webServer: {
    command: "npx http-server . -p 8080 --silent",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
  },
});playwright.config.ts
