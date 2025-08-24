// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

/**
 * @file Type definitions for the Aegis Animator library.
 */

//==============================================================================
// CORE CAPABILITIES & METRICS
//==============================================================================

export interface AnimationCapabilities {
  readonly webAnimations: boolean;
  readonly viewTransitions: boolean;
  readonly intersectionObserver: boolean;
  readonly reducedMotion: boolean;
  readonly composite: boolean;
  readonly supportsNegativePlaybackRate: boolean;
  readonly level: "premium" | "enhanced" | "standard" | "fallback";
}

export interface PerformanceMetrics {
  initStart: number;
  initComplete: number;
  animationCount: number;
  errorCount: number;
  initDuration: number;
  animationsActive: number;
  elementsTracked: number;
  capabilities: AnimationCapabilities["level"] | "unknown";
}

//==============================================================================
// ANIMATOR CONFIGURATION OPTIONS
//==============================================================================

export type AnimationKeyframes = Keyframe[] | PropertyIndexedKeyframes;

export type AnimationDefinition = Record<string, AnimationKeyframes>;

export type SelectorDefinition = Record<string, string>;

/**
 * Defines the trigger mechanism for the animation.
 */
export type TriggerOptions =
  | { type: "hover"; debounceMs?: number }
  | { type: "click" }
  | { type: "scroll"; sentinel: SentinelOptions };

/**
 * Configuration for the IntersectionObserver sentinel element.
 */
export interface SentinelOptions {
  topOffset: number;
  className?: string;
}

/**
 * The main configuration object for creating a new AegisAnimator instance.
 */
export interface AnimatorOptions {
  /** An optional, unique ID for the main target element for validation. */
  id?: string;

  /** A map of logical names to CSS selectors for child elements to be animated. */
  selectors: SelectorDefinition;

  /** A map of logical names (matching 'selectors' keys + 'target') to keyframe definitions. */
  animations: AnimationDefinition & { target: AnimationKeyframes };

  /** Animation timing and easing configuration. */
  timing: Omit<KeyframeAnimationOptions, "id">;

  /** The event or condition that triggers the animation. */
  trigger: TriggerOptions;

  /** If true, hovering over the element will play the animation in reverse when it is in the 'triggered' state. */
  // REFACTORED: Renamed from `isHoverable` to match implementation and be more descriptive.
  revertOnHover?: boolean;

  /** For view transitions, a unique name for the root element. */
  viewTransitionName?: string;
}
