// /tests/integration/AegisAnimator.test.ts
// RULE-ID: comp-prop-validation (for options)

import { describe, it, expect, vi } from "vitest";
import { AegisAnimator } from "../../src/animator/AegisAnimator";
import type { AnimatorOptions } from "../../src/types";

// Get the mock for IntersectionObserver's callback
const intersectionObserverCallback = vi.mocked(IntersectionObserver).mock.calls[0][0];

describe("Integration: AegisAnimator", () => {
  let target: HTMLElement;
  let child: HTMLElement;

  const baseOptions: AnimatorOptions = {
    id: "test-target",
    trigger: { type: "hover" },
    selectors: { child: "#child" },
    animations: {
      target: [{ transform: "scale(1)" }, { transform: "scale(1.1)" }],
      child: [{ opacity: 1 }, { opacity: 0 }],
    },
    timing: { duration: 300 },
  };

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-target">
        <p id="child">Child Element</p>
      </div>
    `;
    target = document.getElementById("test-target")!;
    child = document.getElementById("child")!;
  });

  it("should initialize, find elements, and create animations", () => {
    const animator = new AegisAnimator(target, baseOptions);
    const metrics = animator.getMetrics();

    expect(metrics.elementsTracked).toBe(1); // 'child'
    expect(metrics.animationsActive).toBe(2); // 'target' and 'child'
    expect(target.getAttribute("data-animation-ready")).toBe("true");
    expect(Element.prototype.animate).toHaveBeenCalledTimes(2);

    animator.destroy();
  });

  it("should correctly handle a 'hover' trigger", () => {
    const animator = new AegisAnimator(target, baseOptions);
    const animateSpy = vi.spyOn(Element.prototype, "animate");
    const animation = animateSpy.mock.results[0].value;

    // Simulate hover
    target.dispatchEvent(new MouseEvent("mouseenter"));
    expect(animation.playbackRate).toBe(1);
    expect(animation.play).toHaveBeenCalled();

    // Simulate mouse leave
    target.dispatchEvent(new MouseEvent("mouseleave"));
    expect(animation.playbackRate).toBe(-1);
    expect(animation.play).toHaveBeenCalled();

    animator.destroy();
  });

  it("should correctly handle a 'scroll' trigger via IntersectionObserver", () => {
    const scrollOptions: AnimatorOptions = {
      ...baseOptions,
      trigger: { type: "scroll", sentinel: { topOffset: 50 } },
    };
    const animator = new AegisAnimator(target, scrollOptions);
    const animateSpy = vi.spyOn(Element.prototype, "animate");
    const animation = animateSpy.mock.results[0].value;

    // Simulate scrolling into view (sentinel is intersecting)
    intersectionObserverCallback([{ isIntersecting: true }] as any, {} as any);
    vi.runAllTimers(); // for requestAnimationFrame
    expect(animation.playbackRate).toBe(-1); // Reverts to initial state

    // Simulate scrolling out of view (sentinel is not intersecting)
    intersectionObserverCallback([{ isIntersecting: false }] as any, {} as any);
    vi.runAllTimers();
    expect(animation.playbackRate).toBe(1); // Plays to end state

    animator.destroy();
  });

  it("should correctly handle 'revertOnHover' logic when triggered", () => {
    vi.useFakeTimers();
    const scrollOptions: AnimatorOptions = {
      ...baseOptions,
      trigger: { type: "scroll", sentinel: { topOffset: 50 } },
      revertOnHover: true,
    };
    const animator = new AegisAnimator(target, scrollOptions);
    const animateSpy = vi.spyOn(Element.prototype, "animate");
    const animation = animateSpy.mock.results[0].value;

    // 1. Trigger the animation (scrolled out of view)
    intersectionObserverCallback([{ isIntersecting: false }] as any, {} as any);
    vi.runAllTimers();
    expect(animation.playbackRate).toBe(1);
    (animation.play as any).mockClear();

    // 2. Hover over the triggered element
    target.dispatchEvent(new MouseEvent("mouseenter"));
    expect(animation.playbackRate).toBe(-1); // Reverts
    expect(animation.play).toHaveBeenCalledTimes(1);
    (animation.play as any).mockClear();

    // 3. Mouse leave
    target.dispatchEvent(new MouseEvent("mouseleave"));
    vi.advanceTimersByTime(50); // Debounce time
    expect(animation.playbackRate).toBe(1); // Plays forward again
    expect(animation.play).toHaveBeenCalledTimes(1);

    animator.destroy();
    vi.useRealTimers();
  });

  it("should call destroy and clean up all resources", () => {
    const animator = new AegisAnimator(target, baseOptions);
    const animateSpy = vi.spyOn(Element.prototype, "animate");
    const animation = animateSpy.mock.results[0].value;
    const abortSpy = vi.spyOn((animator as any).abortController, "abort");

    animator.destroy();

    expect(abortSpy).toHaveBeenCalled();
    expect(animation.cancel).toHaveBeenCalled();
    expect(target.hasAttribute("data-animation-ready")).toBe(false);

    // Verify no more events are handled
    (animation.play as any).mockClear();
    target.dispatchEvent(new MouseEvent("mouseenter"));
    expect(animation.play).not.toHaveBeenCalled();
  });
});
