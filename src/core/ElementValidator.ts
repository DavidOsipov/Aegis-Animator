// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

import {
  InvalidConfigurationError,
  InvalidParameterError,
  secureDevLog,
  sanitizeErrorForLogs,
} from "@david-osipov/security-kit"; // <-- ASSUMING a published package

/**
 * @summary Provides safe, allowlist-based DOM querying and validation scoped to an instance.
 * This class is a critical security component that prevents selector injection and ensures
 * that an animator can only interact with elements within its predefined, safe boundaries.
 */
export class ElementValidator {
  private readonly validatedElements = new WeakSet<Element>();
  private readonly allowedRootElements: readonly Element[];
  private static readonly forbiddenRoots = new Set(['body', 'html', '#app', '#root']);

  /**
   * Creates a new validator instance scoped to a specific set of root elements.
   * @param rootElements An array of DOM Elements that define the safe boundaries for queries.
   */
  constructor(rootElements: Element[]) {
    if (!rootElements || rootElements.length === 0) {
      throw new InvalidConfigurationError("ElementValidator must be initialized with at least one root element.");
    }

    this.allowedRootElements = Object.freeze(rootElements.filter(el => {
      const rootIdentifier = el.id ? `#${el.id}` : el.tagName.toLowerCase();
      if (ElementValidator.forbiddenRoots.has(rootIdentifier)) {
        throw new InvalidConfigurationError(`Disallowed broad element used as a root: "${rootIdentifier}"`);
      }
      return true;
    }));
  }

  /**
   * Performs a basic validation of a CSS selector's syntax and non-emptiness.
   * This is a static utility method as it does not depend on instance state.
   * @param selector The CSS selector string to validate.
   * @returns The validated selector.
   * @throws {InvalidParameterError} If the selector is invalid.
   */
  public static validateSelectorSyntax(selector: string): string {
    if (typeof selector !== "string" || !selector.trim()) {
      throw new InvalidParameterError("Invalid selector: must be a non-empty string");
    }
    if (typeof document !== "undefined") {
      try {
        // Use a detached fragment to safely test selector syntax without touching the live DOM.
        document.createDocumentFragment().querySelector(selector);
      } catch (err) {
        throw new InvalidParameterError(`Invalid selector syntax: ${selector}. Reason: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return selector;
  }

  /**
   * Validates that a given value is a DOM Element and does not have a forbidden tag name.
   * This is a static utility method as it does not depend on instance state.
   * @param el The unknown value to validate.
   * @param expectedId An optional ID to match against.
   * @returns The validated DOM Element.
   * @throws {InvalidParameterError} If validation fails.
   */
  public static validateElement(el: unknown, expectedId?: string | null): Element {
    if (!el || (el as Node).nodeType !== Node.ELEMENT_NODE) {
      throw new InvalidParameterError("Invalid element: must be a DOM Element");
    }
    const element = el as Element;
    if (expectedId && element.id !== expectedId) {
      throw new InvalidParameterError(`Element ID mismatch: expected ${expectedId}, got ${element.id}`);
    }
    const tag = element.tagName.toLowerCase();
    if (["script", "iframe", "object", "embed"].includes(tag)) {
      throw new InvalidParameterError(`Forbidden element tag: <${tag}>`);
    }
    return element;
  }

  /**
   * @summary Safely queries for an element and performs a full semantic validation.
   * It ensures that the returned element not only matches the selector but also resides
   * within one of the `allowedRootElements` defined for this validator instance.
   * @param selector The CSS selector to query.
   * @param context The DOM context (Element or Document) in which to perform the query. Defaults to `document`.
   * @returns The validated Element, or null if not found or if validation fails.
   */
  public queryElementSafely(selector: string, context: Document | Element = document): Element | null {
    try {
      ElementValidator.validateSelectorSyntax(selector);
      const el = context.querySelector(selector);
      if (!el) return null;

      let isContained = false;
      for (const rootEl of this.allowedRootElements) {
        // An element is contained if it is the root itself or a descendant of the root.
        if (rootEl === el || rootEl.contains(el)) {
          isContained = true;
          break;
        }
      }

      if (!isContained) {
        throw new InvalidParameterError(`Element targeted by selector is outside the allowed animator root: ${selector}`);
      }

      // Perform final tag validation and memoize the validation result.
      ElementValidator.validateElement(el);
      if (!this.validatedElements.has(el)) {
          this.validatedElements.add(el);
      }
      return el;

    } catch (err) {
      secureDevLog("warn", "ElementValidator", "Element query failed validation", { selector, err: sanitizeErrorForLogs(err) });
      return null;
    }
  }
}
