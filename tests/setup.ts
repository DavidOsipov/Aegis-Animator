// src/tests/setup.ts
import { afterEach, vi } from 'vitest';

// Mock IntersectionObserver
const intersectionObserverMock = () => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(intersectionObserverMock));

// Mock window.matchMedia for reduced-motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, // Default to no reduced motion
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Web Animations API on Element.prototype
if (typeof Element.prototype.animate === 'undefined') {
  Element.prototype.animate = vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    reverse: vi.fn(),
    finish: vi.fn(),
    playbackRate: 1,
    currentTime: 0,
    effect: {
      getTiming: () => ({ duration: 300 }),
    },
  }));
}

// Ensure the DOM is cleaned up after each test
afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  vi.clearAllMocks();
});
