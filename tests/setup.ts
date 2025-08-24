// src/tests/setup.ts
import { afterEach } from 'vitest';

// Clean up the JSDOM environment after each test to ensure isolation
afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});
