// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

/**
 * A standard, SSR-safe debounce utility function.
 * @summary Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked. The returned function also includes a .cancel() method
 * to clear any pending timeout, which is critical for lifecycle management and preventing memory leaks.
 * @template T The type of the function to debounce.
 * @param func The function to debounce.
 * @param wait The debounce delay in milliseconds.
 * @returns A debounced version of the function with a cancel method.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const executedFunction = function (...args: Parameters<T>) {
    const later = () => {
      timeout = undefined;
      func(...args);
    };
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = globalThis.setTimeout(later, wait);
  };

  /**
   * Cancels the pending debounced function call.
   */
  executedFunction.cancel = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  return executedFunction;
}
