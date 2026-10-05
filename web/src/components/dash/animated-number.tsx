"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

/** Counts up to `value` (and between values on refresh) with an ease-out spring-ish curve. */
export function AnimatedNumber({
  value,
  format,
  className,
  duration = 0.8,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const fmt = useRef(format);
  fmt.current = format;
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !isFinite(value)) {
      shown.current = value;
      el.textContent = fmt.current(value);
      return;
    }
    const controls = animate(shown.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = fmt.current(v);
      },
      onComplete: () => {
        shown.current = value;
        el.textContent = fmt.current(value);
      },
    });
    // Animation frames pause in background tabs; make sure the final value always lands.
    const settle = setTimeout(() => {
      controls.stop();
      shown.current = value;
      el.textContent = fmt.current(value);
    }, duration * 1000 + 250);
    return () => {
      clearTimeout(settle);
      controls.stop();
    };
  }, [value, reduce, duration]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {format(0)}
    </span>
  );
}
