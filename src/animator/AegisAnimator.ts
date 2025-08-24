// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: © 2025 David Osipov <personal@david-osipov.vision>

/**
 * @file This module provides a high-performance, security-hardened, and lifecycle-aware
 * animation controller for generic DOM elements.
 * @filename AegisAnimator.ts
 */

import {
  secureDevLog,
  InvalidParameterError,
  sanitizeErrorForLogs,
  environment,
} from "@david-osipov/security-kit";

import { CapabilityDetector } from "../core/CapabilityDetector";
import { ElementValidator } from "../core/ElementValidator";
import { debounce } from "../utils/debounce";
import type {
  AnimatorOptions,
  AnimationCapabilities,
  PerformanceMetrics,
  TriggerOptions,
} from "../types";

const MAX_ANIMATION_RETRIES = 3;
const MAX_ELEMENTS_TO_ANIMATE = 10;

type ExtendedAnimationOptions = KeyframeAnimationOptions & {
  composite?: CompositeOperation;
};

/**
 * @summary Manages the state and animations for a target DOM element.
 * This class encapsulates all logic for observing triggers, handling user interaction,
 * and applying animations in a performant and secure manner.
 */
// REFACTORED: Renamed class for consistency with the library name.
export class AegisAnimator {
  private readonly targetElement: Element;
  private readonly options: AnimatorOptions;
  private readonly validator: ElementValidator;
  private readonly elements = new Map<string, Element>();
  private readonly animations = new Map<string, Animation>();
  private readonly abortController: AbortController;
  private readonly capabilities: AnimationCapabilities;
  private readonly performanceMetrics: Omit<PerformanceMetrics, "initDuration" | "animationsActive" | "elementsTracked" | "capabilities"> & {
    initStart: number;
    initComplete: number;
  };
  private readonly debouncedMouseLeave?: { (): void; cancel(): void; };

  private sentinelElement: HTMLDivElement | null = null;
  private observer: IntersectionObserver | null = null;

  private isHovering = false;
  private isTriggered = false;
  private isDestroyed = false;

  constructor(targetElement: Element, options: AnimatorOptions) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.performanceMetrics = { initStart: now, initComplete: 0, animationCount: 0, errorCount: 0 };

    try {
      this.targetElement = ElementValidator.validateElement(targetElement, options.id);
      this.options = Object.freeze(options);

      // REFACTORED: The validator is correctly sandboxed to this instance's root element.
      this.validator = new ElementValidator([this.targetElement]);

      this.abortController = new AbortController();
      this.capabilities = CapabilityDetector.detect();

      // REFACTORED: Correctly check for `revertOnHover` from options.
      if (this.options.revertOnHover) {
        const debounceMs = (this.options.trigger as { debounceMs?: number }).debounceMs ?? 50;
        this.debouncedMouseLeave = debounce(this.performMouseLeaveActions.bind(this), debounceMs);
      }

      if (environment.isDevelopment) {
        secureDevLog("info", "AegisAnimator", "Initializing", { capabilities: this.capabilities });
      }

      if (this.capabilities.reducedMotion) {
        this.handleReducedMotion();
      } else if (this.checkPrerequisites()) {
        this.initialize();
      } else {
        this.handleFallback("api-unavailable");
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.performanceMetrics.initComplete = end;

      if (environment.isDevelopment) {
        const initTime = this.performanceMetrics.initComplete - this.performanceMetrics.initStart;
        secureDevLog("info", "AegisAnimator", "Initialization complete", { initTime: `${initTime.toFixed(2)}ms`, level: this.capabilities.level });
      }
    } catch (error: unknown) {
      this.handleError("Initialization failed catastrophically", error);
      this.handleFallback("error");
    }
  }

  private checkPrerequisites = (): boolean => {
    if (this.options.trigger.type === 'scroll') {
      return this.capabilities.webAnimations && this.capabilities.intersectionObserver;
    }
    return this.capabilities.webAnimations;
  };

  private initialize(): void {
    try {
      this.setupElements();
      this.setupViewTransitions();
      this.createAnimations();
      this.setupTrigger();
      this.attachHoverListeners();
      this.targetElement.setAttribute("data-animation-ready", "true");
    } catch (error) {
      this.handleError("Core initialization sequence failed", error);
      this.handleFallback("error");
    }
  }

  private setupElements(): void {
    const elementCount = Object.keys(this.options.selectors).length;
    if (elementCount > MAX_ELEMENTS_TO_ANIMATE) {
      throw new InvalidParameterError(`Too many elements configured: ${elementCount} > ${MAX_ELEMENTS_TO_ANIMATE}`);
    }
    for (const [key, selector] of Object.entries(this.options.selectors)) {
      const element = this.validator.queryElementSafely(selector);
      if (element) this.elements.set(key, element);
    }
  }

  private setupViewTransitions(): void {
    if (this.capabilities.viewTransitions && this.targetElement instanceof HTMLElement && this.options.viewTransitionName) {
      this.targetElement.style.setProperty("view-transition-name", this.options.viewTransitionName);
    }
  }

  private createAnimations(): void {
    const baseOptions: ExtendedAnimationOptions = {
      ...this.options.timing,
      fill: this.options.timing.fill ?? "both",
      composite: this.capabilities.composite ? "replace" : undefined,
    };

    try {
      const targetAnimation = this.targetElement.animate(this.options.animations.target, baseOptions);
      targetAnimation.pause();
      this.animations.set("target", targetAnimation);

      for (const [key, keyframes] of Object.entries(this.options.animations)) {
        if (key === 'target') continue;
        const element = this.elements.get(key);
        if (element) {
          const animation = element.animate(keyframes, baseOptions);
          animation.pause();
          this.animations.set(key, animation);
        }
      }
    } catch (error: unknown) {
      this.handleError("Animation creation failed", error);
      this.handleFallback("error");
    }
  }

  private setupTrigger(): void {
    const trigger = this.options.trigger;
    switch (trigger.type) {
      case 'scroll':
        this.setupIntersectionObserver(trigger);
        break;
      case 'hover':
        this.targetElement.addEventListener("mouseenter", () => { this.isTriggered = true; this.updateAnimationState(); }, { signal: this.abortController.signal, passive: true });
        this.targetElement.addEventListener("mouseleave", () => { this.isTriggered = false; this.updateAnimationState(); }, { signal: this.abortController.signal, passive: true });
        break;
    }
  }

  private setupIntersectionObserver(trigger: Extract<TriggerOptions, { type: 'scroll' }>): void {
    this.sentinelElement = document.createElement("div");
    this.sentinelElement.className = trigger.sentinel.className ?? "animator-sentinel";
    this.sentinelElement.setAttribute("aria-hidden", "true");
    const style = this.sentinelElement.style;
    style.setProperty("position", "absolute");
    style.setProperty("top", `${trigger.sentinel.topOffset}px`);
    style.setProperty("height", "1px");
    style.setProperty("width", "1px");

    const body = document.body ?? document.documentElement;
    body.insertBefore(this.sentinelElement, body.firstChild);

    const observerCallback: IntersectionObserverCallback = (entries) => {
      if (this.isDestroyed) return;
      window.requestAnimationFrame(() => {
        if (this.isDestroyed) return;
        for (const entry of entries) {
          const wasTriggered = this.isTriggered;
          this.isTriggered = !entry.isIntersecting;
          if (wasTriggered !== this.isTriggered) this.updateAnimationState();
        }
      });
    };

    this.observer = new IntersectionObserver(observerCallback, { threshold: 0, rootMargin: "0px" });
    this.observer.observe(this.sentinelElement);
    this.setInitialState();
  }

  private setInitialState(): void {
    if (!this.sentinelElement || this.isDestroyed) return;
    window.requestAnimationFrame(() => {
      if (this.isDestroyed || !this.sentinelElement) return;
      const rect = this.sentinelElement.getBoundingClientRect();
      this.isTriggered = rect.top < 0;
      for (const animation of this.animations.values()) {
        const duration = Number(animation.effect?.getTiming().duration ?? 0);
        animation.currentTime = this.isTriggered ? duration : 0;
        animation.pause();
      }
    });
  }

  private attachHoverListeners(): void {
    if (this.options.revertOnHover) {
      this.targetElement.addEventListener("mouseenter", this.handleMouseEnter, { signal: this.abortController.signal, passive: true });
      this.targetElement.addEventListener("mouseleave", this.handleMouseLeave, { signal: this.abortController.signal, passive: true });
    }
  }

  private updateAnimationState(): void {
    if (this.isDestroyed || (this.isHovering && this.options.revertOnHover)) return;
    
    this.playAllAnimations(this.isTriggered);
    this.performanceMetrics.animationCount++;
  }

  private handleMouseEnter = (): void => {
    if (this.isDestroyed || !this.isTriggered) return;
    
    this.isHovering = true;
    this.debouncedMouseLeave?.cancel();
    this.playAllAnimations(false);
  };

  private handleMouseLeave = (): void => {
    if (this.isDestroyed || !this.isTriggered) return;
    
    this.isHovering = false;
    this.debouncedMouseLeave?.();
  };

  private performMouseLeaveActions(): void {
    if (!this.isHovering && !this.isDestroyed && this.isTriggered) {
      this.playAllAnimations(true);
    }
  }

  // REFACTORED: Renamed parameter for clarity.
  private playAllAnimations(playToEndState: boolean): void {
    try {
      for (const animation of this.animations.values()) {
        this.playOrSeekAnimation(animation, playToEndState);
      }
    } catch (error: unknown) {
      this.handleError("Animation playback failed", error);
    }
  }

  // REFACTORED: Renamed parameter for clarity.
  private playOrSeekAnimation(animation: Animation, playToEndState: boolean): void {
    const duration = Number(animation.effect?.getTiming().duration ?? 0);

    const seekToEndState = () => {
      animation.currentTime = playToEndState ? duration : 0;
      animation.pause();
    };

    if (this.capabilities.supportsNegativePlaybackRate && duration > 0) {
      try {
        animation.playbackRate = playToEndState ? 1 : -1;
        animation.currentTime = playToEndState ? 0 : duration;
        animation.play();
      } catch (err: unknown) {
        this.handleError("playOrSeekAnimation playback failed, falling back to seek", err);
        seekToEndState();
      }
    } else {
      seekToEndState();
    }
  }

  private handleReducedMotion(): void {
    this.targetElement.classList.add("reduced-motion");
    this.targetElement.setAttribute("data-animation-disabled", "reduced-motion");
  }

  private handleFallback(reason: "api-unavailable" | "error"): void {
    this.targetElement.classList.add("js-animation-fallback");
    this.targetElement.setAttribute("data-animation-disabled", reason);
  }

  private handleError(message: string, error: unknown): void {
    this.performanceMetrics.errorCount++;
    secureDevLog("error", "AegisAnimator", message, { error: sanitizeErrorForLogs(error), state: { isTriggered: this.isTriggered, isHovering: this.isHovering } });

    if (this.performanceMetrics.errorCount > MAX_ANIMATION_RETRIES) {
      secureDevLog("error", "AegisAnimator", "Exceeded max retries, destroying instance.", {});
      this.destroy();
    }
  }

  public getMetrics(): PerformanceMetrics {
    return {
      ...this.performanceMetrics,
      initDuration: this.performanceMetrics.initComplete - this.performanceMetrics.initStart,
      animationsActive: this.animations.size,
      elementsTracked: this.elements.size,
      capabilities: this.capabilities?.level ?? "unknown",
    };
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    try {
      this.debouncedMouseLeave?.cancel();
      this.abortController.abort();

      this.observer?.disconnect();
      this.animations.forEach((animation) => animation.cancel());
      this.sentinelElement?.remove();

      this.animations.clear();
      this.elements.clear();

      this.targetElement.removeAttribute("data-animation-ready");

      if (environment.isDevelopment) {
        secureDevLog("info", "AegisAnimator", "Destroyed successfully", this.getMetrics());
      }
    } catch (error: unknown) {
      secureDevLog("error", "AegisAnimator", "Destruction failed", { error: sanitizeErrorForLogs(error) });
    }
  }
}
