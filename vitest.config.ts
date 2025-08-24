// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable globals (describe, test, expect) for convenience
    globals: true,
    // Use JSDOM to simulate a browser environment for our tests
    environment: 'jsdom',
    // Include all files ending in .test.ts or .spec.ts
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // Setup file to run before each test file (optional but good practice)
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/types.ts', 'src/index.ts', 'src/**/*.test.ts'],
    },
  },
});
