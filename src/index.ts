// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

/**
 * @file Main entry point for the Aegis Animator library.
 * @summary A security-first, performant, and lifecycle-aware animation utility.
 */

// Core Classes
export { AegisAnimator } from "./animator/AegisAnimator";
export { Aegis } from "./manager/Aegis";

// Core Utilities
export { CapabilityDetector } from "./core/CapabilityDetector";
export { ElementValidator } from "./core/ElementValidator";
export { debounce } from "./utils/debounce";

// Type Exports
export * from "./types";

// Default export for convenience (e.g., import Aegis from 'aegis-animator')
import { Aegis } from "./manager/Aegis";
export default Aegis;
