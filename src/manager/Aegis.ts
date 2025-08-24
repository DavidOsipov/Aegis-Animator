// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

// RENAMED: from AnimationManager.ts

import { AegisAnimator } from "../animator/AegisAnimator";
import type { AnimatorOptions } from "../types";
import { secureDevLog, sanitizeErrorForLogs } from "@david-osipov/security-kit";

/**
 * @summary A singleton manager to handle the lifecycle of AegisAnimator instances.
 * This provides a simple, declarative API for attaching and cleaning up animations.
 * @class Aegis
 */
export class Aegis {
  private static instances = new Map<Element, AegisAnimator>();

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
      // CORRECTED: The manager's role is ONLY to find the root element.
      // It does not perform validation itself; that responsibility is delegated
      // to the AegisAnimator constructor to ensure a proper security sandbox.
      const element = document.querySelector(selector);

      if (!element) {
        secureDevLog("warn", "Aegis", `Target element not found: ${selector}`, {});
        return;
      }

      // Clean up any existing instance on this element for idempotency.
      if (this.instances.has(element)) {
        this.instances.get(element)?.destroy();
      }

      // The AegisAnimator constructor will validate the element and create
      // its own instance-scoped, sandboxed ElementValidator.
      const instance = new AegisAnimator(element, options);
      this.instances.set(element, instance);

      // Provide a handle for manual destruction.
      const destroy = () => {
        instance.destroy();
        this.instances.delete(element);
      };

      return { destroy };

    } catch (error: unknown) {
      secureDevLog("error", "Aegis", "Failed to attach animator", {
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
   * @returns The AegisAnimator instance or null.
   */
  public static getInstance(element: Element): AegisAnimator | null {
    return this.instances.get(element) ?? null;
  }
}
