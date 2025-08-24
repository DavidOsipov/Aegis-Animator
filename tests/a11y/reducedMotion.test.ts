// /tests/a11y/reducedMotion.test.ts
// RULE-ID: a11y-reduced-motion-enforcement

import { describe, it, expect, vi } from "vitest";
import { AegisAnimator } from "../../src/animator/AegisAnimator";
import type { AnimatorOptions } from "../../src/types";

describe("Accessibility: Reduced Motion", () => {
  it("should not create animations and should add fallback classes if reduced motion is preferred", () => {
    // Setup: Enable reduced motion
    (window.matchMedia as any).mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
    }));

    document.body.innerHTML = `<div id="test-target"></div>`;
    const target = document.getElementById("test-target")!;

    const options: AnimatorOptions = {
      trigger: { type: "hover" },
      selectors: {},
      animations: { target: [{ opacity: 0 }, { opacity: 1 }] },
      timing: { duration: 100 },
    };

    const animator = new AegisAnimator(target, options);
    const metrics = animator.getMetrics();

    // Assertions
    expect(metrics.animationsActive).toBe(0);
    expect(target.classList.contains("reduced-motion")).toBe(true);
    expect(target.getAttribute("data-animation-disabled")).toBe("reduced-motion");

    // Verify that animate was NOT called
    expect(Element.prototype.animate).not.toHaveBeenCalled();

    animator.destroy();
  });
});
