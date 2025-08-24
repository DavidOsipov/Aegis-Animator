// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

/**
 * @file Main entry point for the Resilient Animator library.
 * @summary A security-first, performant, and lifecycle-aware animation utility.
 */

// Core Classes
export { ResilientAnimator } from "./animator/ResilientAnimator";
export { AnimationManager } from "./manager/AnimationManager";

// Core Utilities
export { CapabilityDetector } from "./core/CapabilityDetector";
export { ElementValidator } from "./core/ElementValidator";
export { debounce } from "./utils/debounce";

// Type Exports
export * from "./types";

// Default export for convenience
import { AnimationManager } from "./manager/AnimationManager";
export default AnimationManager;
