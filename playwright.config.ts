import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.TEST_URL ?? "http://127.0.0.1:4417",
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node dist-server/main.js",
    url: "http://127.0.0.1:4417/api/health",
    reuseExistingServer: false,
    env: { PORT: "4417", DATA_DIR: "data/e2e" },
    timeout: 30000,
  },
});
