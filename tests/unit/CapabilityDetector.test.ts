// /tests/unit/CapabilityDetector.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CapabilityDetector } from "../../src/core/CapabilityDetector";

describe("Unit: CapabilityDetector", () => {
  beforeEach(() => {
    // Reset the private cache before each test
    (CapabilityDetector as any).cache = null;
  });

  it("should detect standard capabilities correctly", () => {
    const capabilities = CapabilityDetector.detect();
    expect(capabilities.webAnimations).toBe(true);
    expect(capabilities.intersectionObserver).toBe(true);
    expect(capabilities.level).toBe("standard"); // Based on default jsdom mocks
  });

  it("should cache the results after the first detection", () => {
    const spy = vi.spyOn(CapabilityDetector as any, "testWebAnimations");
    CapabilityDetector.detect();
    CapabilityDetector.detect();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("should detect reduced motion when matchMedia matches", () => {
    // RULE-ID: a11y-reduced-motion-detection
    (window.matchMedia as any).mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
    }));

    const capabilities = CapabilityDetector.detect();
    expect(capabilities.reducedMotion).toBe(true);
  });

  it("should determine 'premium' level with view transitions", () => {
    (document as any).startViewTransition = vi.fn();
    const capabilities = CapabilityDetector.detect();
    expect(capabilities.viewTransitions).toBe(true);
    expect(capabilities.level).toBe("premium");
    delete (document as any).startViewTransition;
  });

  it("should gracefully handle a lack of web animations", () => {
    const originalAnimate = Element.prototype.animate;
    delete (Element.prototype as any).animate;

    const capabilities = CapabilityDetector.detect();
    expect(capabilities.webAnimations).toBe(false);
    expect(capabilities.level).toBe("fallback");

    Element.prototype.animate = originalAnimate;
  });
});
