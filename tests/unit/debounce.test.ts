// /tests/unit/debounce.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { debounce } from "../../src/utils/debounce";

describe("Unit: debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should only call the function after the wait time has passed", () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    expect(func).not.toHaveBeenCalled();
    vi.advanceTimersByTime(99);
    expect(func).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it("should pass the latest arguments to the debounced function", () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(1);
    debouncedFunc(2);
    debouncedFunc(3);

    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledWith(3);
  });

  it("should have a cancel method that prevents execution", () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled();

    debouncedFunc.cancel();
    vi.advanceTimersByTime(100);
    expect(func).not.toHaveBeenCalled();
  });
});
