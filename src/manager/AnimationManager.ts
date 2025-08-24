// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

import { ResilientAnimator } from "../animator/ResilientAnimator";
import { ElementValidator } from "../core/ElementValidator";
import type { AnimatorOptions } from "../types";
import { secureDevLog, sanitizeErrorForLogs } from "../utils/security_kit";

/**
 * @summary A singleton manager to handle the lifecycle of ResilientAnimator instances.
 * This provides a simple, declarative API for attaching and cleaning up animations.
 */
export class AnimationManager {
  private static instances = new Map<Element, ResilientAnimator>();

  /**
   * Attaches a resilient animator to a target element. If an animator already exists
   * for this element, it will be destroyed before the new one is created.
   * @param selector The CSS selector for the target element.
   * @param options The configuration for the animator.
   * @returns A handle with a `destroy` method for manual cleanup, or undefined if the element is not found.
   */
  public static attach(
    selector: string,
    options: AnimatorOptions
  ): { destroy: () => void } | undefined {
    try {
      // Configure the validator with the root element as a safe boundary.
      ElementValidator.configure([selector]);

      const element = ElementValidator.queryElementSafely(selector);
      if (!element) {
        secureDevLog("warn", "AnimationManager", `Target element not found or invalid: ${selector}`, {});
        return;
      }

      // Clean up any existing instance on this element
      if (this.instances.has(element)) {
        this.instances.get(element)?.destroy();
      }

      const instance = new ResilientAnimator(element, options);
      this.instances.set(element, instance);

      return {
        destroy: () => {
          instance.destroy();
          this.instances.delete(element);
        },
      };
    } catch (error: unknown) {
      secureDevLog("error", "AnimationManager", "Failed to attach animator", {
        selector,
        error: sanitizeErrorForLogs(error),
      });
      return undefined;
    }
  }

  /**
   * Destroys the animator instance associated with a given element.
   * @param element The element whose animator should be destroyed.
   */
  public static destroy(element: Element): void {
    if (this.instances.has(element)) {
      this.instances.get(element)?.destroy();
      this.instances.delete(element);
    }
  }

  /**
   * Destroys all active animator instances managed by this class.
   * Crucial for cleanup in Single-Page Applications.
   */
  public static destroyAll(): void {
    for (const instance of this.instances.values()) {
      instance.destroy();
    }
    this.instances.clear();
  }

  /**
   * Retrieves the animator instance for a given element, if it exists.
   * @param element The element to look up.
   * @returns The ResilientAnimator instance or null.
   */
  public static getInstance(element: Element): ResilientAnimator | null {
    return this.instances.get(element) ?? null;
  }
}
