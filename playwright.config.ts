import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Expects a production build (`pnpm test:e2e` builds first). Uses its own
// database file and port, so it never touches a dev server or dev data.
export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `rm -f data/e2e.db* && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: "data/e2e.db",
      BETTER_AUTH_URL: `http://localhost:${PORT}`,
      BETTER_AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else",
    },
  },
});
