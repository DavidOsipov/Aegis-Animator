// /tests/integration/Aegis.test.ts

import { describe, it, expect, vi } from "vitest";
import { Aegis } from "../../src/manager/Aegis";
import { AegisAnimator } from "../../src/animator/AegisAnimator";
import type { AnimatorOptions } from "../../src/types";

vi.mock("../../src/animator/AegisAnimator");

describe("Integration: Aegis Manager", () => {
  const options: AnimatorOptions = {
    trigger: { type: "hover" },
    selectors: {},
    animations: { target: [] },
    timing: { duration: 100 },
  };

  beforeEach(() => {
    document.body.innerHTML = `<div id="el1"></div><div id="el2"></div>`;
  });

  it("should attach an animator instance to an element", () => {
    Aegis.attach("#el1", options);
    expect(AegisAnimator).toHaveBeenCalledTimes(1);
    const instance = (AegisAnimator as any).mock.instances[0];
    expect(instance).toBeDefined();
  });

  it("should return a destroy handle that cleans up the specific instance", () => {
    const handle = Aegis.attach("#el1", options);
    const instance = (AegisAnimator as any).mock.instances[0];

    expect(Aegis.getInstance(document.getElementById("el1")!)).toBe(instance);
    handle?.destroy();
    expect(instance.destroy).toHaveBeenCalled();
    expect(Aegis.getInstance(document.getElementById("el1")!)).toBe(null);
  });

  it("should be idempotent, destroying an old instance when attaching to the same element", () => {
    Aegis.attach("#el1", options);
    const firstInstance = (AegisAnimator as any).mock.instances[0];

    Aegis.attach("#el1", options);
    const secondInstance = (AegisAnimator as any).mock.instances[1];

    expect(firstInstance.destroy).toHaveBeenCalled();
    expect(secondInstance).toBeDefined();
    expect(firstInstance).not.toBe(secondInstance);
  });

  it("should destroy all instances when destroyAll is called", () => {
    Aegis.attach("#el1", options);
    Aegis.attach("#el2", options);
    const instance1 = (AegisAnimator as any).mock.instances[0];
    const instance2 = (AegisAnimator as any).mock.instances[1];

    Aegis.destroyAll();

    expect(instance1.destroy).toHaveBeenCalled();
    expect(instance2.destroy).toHaveBeenCalled();
    expect(Aegis.getInstance(document.getElementById("el1")!)).toBe(null);
    expect(Aegis.getInstance(document.getElementById("el2")!)).toBe(null);
  });

  it("should do nothing if the target element for attach is not found", () => {
    const handle = Aegis.attach("#not-found", options);
    expect(handle).toBeUndefined();
    expect(AegisAnimator).not.toHaveBeenCalled();
  });
});
