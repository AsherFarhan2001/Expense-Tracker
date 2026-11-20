"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eases from the currently displayed value to `target` whenever it changes.
 * Jumps straight to the target when the user prefers reduced motion.
 */
export function useAnimatedNumber(target: number, duration = 450): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    const from = displayRef.current;
    if (from === target) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = reduceMotion ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const value =
        progress === 1 ? target : Math.round(from + (target - from) * eased);
      displayRef.current = value;
      setDisplay(value);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}
