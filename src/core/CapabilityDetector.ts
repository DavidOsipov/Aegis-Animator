// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

import {
  secureDevLog,
  environment,
  sanitizeErrorForLogs,
} from "../utils/security_kit";
import type { AnimationCapabilities } from "../types";

/**
 * @summary Detects and caches browser animation capabilities to determine the optimal animation level.
 * This class uses static methods and a private cache for high performance, ensuring detection logic
 * runs only once per page load.
 */
export class CapabilityDetector {
  private static cache: AnimationCapabilities | null = null;

  public static detect(): AnimationCapabilities {
    if (this.cache) {
      return this.cache;
    }

    const capabilities: Omit<AnimationCapabilities, "level"> & {
      level: AnimationCapabilities["level"];
    } = {
      webAnimations: this.testWebAnimations(),
      viewTransitions: this.testViewTransitions(),
      intersectionObserver: this.testIntersectionObserver(),
      reducedMotion: this.testReducedMotion(),
      composite: false,
      supportsNegativePlaybackRate: false,
      level: "fallback",
    };

    try {
      capabilities.composite = this._testComposite();
      capabilities.supportsNegativePlaybackRate = this._testNegativePlaybackRate();
    } catch (error: unknown) {
      secureDevLog("warn", "CapabilityDetector", "Advanced capability detection failed", { error: sanitizeErrorForLogs(error) });
    }

    if (environment.isDevelopment && capabilities.webAnimations && !capabilities.supportsNegativePlaybackRate) {
      secureDevLog("info", "CapabilityDetector", "Negative playbackRate not supported — seek fallback will be used", {});
    }

    if (capabilities.viewTransitions && capabilities.webAnimations) {
      capabilities.level = "premium";
    } else if (capabilities.webAnimations && capabilities.composite) {
      capabilities.level = "enhanced";
    } else if (capabilities.webAnimations) {
      capabilities.level = "standard";
    }

    this.cache = Object.freeze(capabilities);

    if (environment.isDevelopment) {
      secureDevLog("info", "CapabilityDetector", "Capabilities detected", this.cache);
    }

    return this.cache;
  }

  private static _withTestElement<T>(callback: (el: HTMLDivElement) => T): T | false {
    if (typeof document === 'undefined') return false;

    const testEl = document.createElement("div");
    testEl.style.setProperty("position", "absolute");
    testEl.style.setProperty("left", "-9999px");

    const parent = document.body ?? document.documentElement;
    parent.appendChild(testEl);

    try {
      return callback(testEl);
    } catch {
      return false;
    } finally {
      if (testEl.parentNode) {
        testEl.parentNode.removeChild(testEl);
      }
    }
  }

  private static testWebAnimations = (): boolean => typeof Element !== "undefined" && typeof Element.prototype.animate === "function";

  private static testViewTransitions = (): boolean => {
    interface DocumentWithViewTransition extends Document {
      startViewTransition(callback: () => unknown): unknown;
    }
    return typeof document !== "undefined" && typeof (document as DocumentWithViewTransition).startViewTransition === "function";
  };

  private static testIntersectionObserver = (): boolean => typeof IntersectionObserver !== "undefined";

  private static testReducedMotion = (): boolean => {
    try {
      return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  };

  private static _testComposite = (): boolean => {
    if (!this.testWebAnimations()) return false;
    return this._withTestElement(testEl => {
      const animation = testEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, composite: "replace" });
      const hasComposite = !!animation.effect && typeof (animation.effect as KeyframeEffect).composite !== "undefined";
      animation.cancel();
      return hasComposite;
    }) || false;
  };

  private static _testNegativePlaybackRate = (): boolean => {
    if (!this.testWebAnimations()) return false;
    return this._withTestElement(testEl => {
      const animation = testEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1 });
      animation.playbackRate = -1;
      animation.cancel();
      return true;
    }) || false;
  };
}
