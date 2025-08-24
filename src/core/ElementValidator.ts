// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

import {
  InvalidConfigurationError,
  InvalidParameterError,
  secureDevLog,
  sanitizeErrorForLogs,
} from "../utils/security_kit";

/**
 * @summary Provides safe, allowlist-based DOM querying and validation.
 * This class is a critical security component that prevents selector injection and ensures
 * that the animator can only interact with a predefined, safe subset of the DOM.
 */
export class ElementValidator {
  private static validatedElements = new WeakSet<Element>();
  private static allowedRootSelectors = new Set<string>();
  private static forbiddenRoots = new Set(['body', 'html', '#app', '#root']);
  private static allowedRootElementsCache: Map<string, Element | null> | null = null;

  /**
   * @summary Configures the validator with the set of root selectors that are considered safe boundaries.
   * This MUST be called by the library's manager before any queries are made.
   * @param selectors An array of CSS selectors for the allowed root elements.
   */
  public static configure(selectors: string[]): void {
    this.allowedRootElementsCache = null; // Invalidate cache
    this.allowedRootSelectors.clear();
    for (const root of selectors) {
      if (this.forbiddenRoots.has(root.toLowerCase())) {
        throw new InvalidConfigurationError(`Disallowed broad selector in validator allowlist: "${root}"`);
      }
      this.allowedRootSelectors.add(root);
    }
  }

  private static _resolveAndCacheAllowedRoots(): Map<string, Element | null> {
    if (this.allowedRootElementsCache) {
      return this.allowedRootElementsCache;
    }
    const cache = new Map<string, Element | null>();
    for (const selector of this.allowedRootSelectors) {
      cache.set(selector, document.querySelector(selector));
    }
    this.allowedRootElementsCache = cache;
    return cache;
  }

  public static validateSelectorSyntax(selector: string): string {
    if (typeof selector !== "string" || !selector.trim()) {
      throw new InvalidParameterError("Invalid selector: must be a non-empty string");
    }
    if (typeof document !== "undefined") {
      try {
        document.createDocumentFragment().querySelector(selector);
      } catch (err) {
        throw new InvalidParameterError(`Invalid selector syntax: ${selector}. Reason: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return selector;
  }

  public static validateElement(el: unknown, expectedId?: string | null): Element {
    if (!el || (el as Node).nodeType !== Node.ELEMENT_NODE) {
      throw new InvalidParameterError("Invalid element: must be a DOM Element");
    }
    const element = el as Element;
    if (expectedId && element.id !== expectedId) {
      throw new InvalidParameterError(`Element ID mismatch: expected ${expectedId}, got ${element.id}`);
    }
    if (!this.validatedElements.has(element)) {
      const tag = element.tagName.toLowerCase();
      if (["script", "iframe", "object", "embed"].includes(tag)) {
        throw new InvalidParameterError(`Forbidden element tag: <${tag}>`);
      }
      this.validatedElements.add(element);
    }
    return element;
  }

  public static queryElementSafely(selector: string, context: Document | Element = document): Element | null {
    try {
      this.validateSelectorSyntax(selector);
      const el = context.querySelector(selector);
      if (!el) return null;

      const rootEls = Array.from(this._resolveAndCacheAllowedRoots().values()).filter(Boolean) as Element[];
      if (rootEls.length === 0) {
        throw new InvalidConfigurationError("ElementValidator has not been configured with any allowed roots.");
      }

      let isContained = false;
      for (const rootEl of rootEls) {
        if (rootEl === el || rootEl.contains(el)) {
          isContained = true;
          break;
        }
      }

      if (!isContained && context instanceof Element) {
        for (const rootEl of rootEls) {
          if (rootEl === context || rootEl.contains(context)) {
            isContained = true;
            break;
          }
        }
      }

      if (!isContained) {
        throw new InvalidParameterError(`Element targeted by selector is outside allowlisted roots: ${selector}`);
      }

      return this.validateElement(el);
    } catch (err) {
      secureDevLog("warn", "ElementValidator", "Element query failed validation", { selector, err: sanitizeErrorForLogs(err) });
      return null;
    }
  }
}
