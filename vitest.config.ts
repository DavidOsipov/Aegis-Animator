// vitest.config.ts

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/types.ts", "src/index.ts"],
    },
    // Per RULE 5.1 of the Testing Constitution
    define: {
      __TEST__: true,
    },
  },
});
