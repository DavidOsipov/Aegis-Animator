// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'], // Path to our setup file
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/types.ts', 'src/index.ts', 'src/tests'],
    },
    // Define a global constant for test-only code, per the constitution
    define: {
      __TEST__: true,
    },
  },
});
