# Aegis Animator

[![NPM version](https://img.shields.io/npm/v/aegis-animator.svg?style=flat)](https://www.npmjs.com/package/aegis-animator)
[![Build Status](https://img.shields.io/github/actions/workflow/status/your-username/aegis-animator/ci.yml?branch=main)](https://github.com/your-username/aegis-animator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A security-first, lifecycle-aware animation and DOM utility library for modern web applications.**

Aegis Animator provides a robust, resilient framework for creating performant animations with a focus on security and automatic cleanup, making it ideal for Single-Page Applications (SPAs), server-side rendering (SSR) environments like Astro or Next.js, and any project where stability and security are paramount.

---

## 🤔 Why Aegis Animator?

Modern web development is complex. Components mount and unmount, users have different browser capabilities, and security is a constant concern. Aegis Animator solves these common pain points out of the box:

*   🛡️ **Security-First by Default:** Built-in secure element validation prevents selector injection and restricts DOM manipulation to predefined boundaries.
*   ♻️ **Automatic Lifecycle Management:** Uses `AbortController` and a robust `destroy()` pattern to automatically clean up event listeners, Intersection Observers, and timeouts, preventing memory leaks in SPAs.
*   🚀 **Performant & Resilient:** Intelligently detects browser capabilities (Web Animations, View Transitions) to deliver the best possible experience without breaking on older browsers.
*   🧠 **Smart & Declarative API:** Define complex, trigger-based animations (like scroll-to-shrink headers) with a simple configuration object.
*   🏗️ **SSR-Safe:** All utilities are designed to run safely in both server-side and client-side environments.

## 🚀 Quick Start

1.  **Installation:**

    ```bash
    npm install aegis-animator
    ```

2.  **Basic Usage (Hover Effect):**

    Create a simple, performant hover animation on a button. Aegis handles all the event listeners and cleanup for you.

    ```typescript
    import Aegis from 'aegis-animator';

    Aegis.attach('#my-button', {
      trigger: { type: 'hover' },
      animations: {
        target: [
          { transform: 'scale(1)', boxShadow: '0 2px 4px #0002' },
          { transform: 'scale(1.05)', boxShadow: '0 4px 12px #0004' }
        ]
      },
      timing: {
        duration: 200,
        fill: 'forwards',
        easing: 'ease-out'
      }
    });
    ```

## Advanced Usage: Scroll-Triggered Header

This is the original use case that inspired the library. Create a header that shrinks on scroll, expands on hover when shrunk, and respects the user's motion preferences, all while being completely memory-safe.

See the full implementation in [`src/examples/header-animation.ts`](./src/examples/header-animation.ts).

```typescript
import Aegis from 'aegis-animator';
import { HEADER_ANIMATION_CONFIG } from './header-config';

// Initialize the header animation on page load
Aegis.attach('#main-header', HEADER_ANIMATION_CONFIG);

// In an SPA, you might re-initialize on navigation
document.addEventListener('astro:page-load', () => {
  Aegis.destroyAll(); // Clean up old instances
  Aegis.attach('#main-header', HEADER_ANIMATION_CONFIG);
});
```

## 📜 API Reference

### `Aegis.attach(selector, options)`

The primary method for creating and managing an animation.

*   `selector`: A CSS selector for the main target element.
*   `options`: A configuration object defining the trigger, animations, and timing.

### `Aegis.destroyAll()`

Destroys all active animator instances and cleans up their resources. Essential for SPA navigation.

### Core Utilities

For advanced use cases, you can import the core building blocks directly:

*   `AegisAnimator`: The core class that manages a single animated element.
*   `CapabilityDetector`: The static class for detecting browser features.
*   `ElementValidator`: The static class for secure DOM querying.

## 🏛️ Philosophy

This library is built on the principles of a strict **Security & Engineering Constitution**, prioritizing verifiable security, defense-in-depth, and performance as a core feature.

## 📄 License

MIT © 2025 David Osipov
