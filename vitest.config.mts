import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Each test file gets its own module graph, so its own empty database
    env: { DATABASE_PATH: ":memory:" },
  },
});
