"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cursorChase } from "@/lib/animations";
import { CURSOR } from "@/lib/motion";
import { useUiScale } from "@/lib/uiScale";

export function CursorDot() {
  const dot = useRef<HTMLDivElement>(null);
  const scale = useUiScale();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setActive(true);
    }
  }, []);

  useEffect(() => {
    const el = dot.current;
    if (!active || !el) return;

    document.documentElement.classList.add("cursor-none");

    const half = (CURSOR.size * scale) / 2;
    const setX = gsap.quickSetter(el, "x", "px");
    const setY = gsap.quickSetter(el, "y", "px");
    const setOpacity = gsap.quickSetter(el, "opacity");

    setX(window.innerWidth / 2 - half);
    setY(window.innerHeight / 2 - half);

    const stop = cursorChase((x, y, opacity) => {
      setX(x - half);
      setY(y - half);
      setOpacity(opacity);
    });

    return () => {
      stop();
      document.documentElement.classList.remove("cursor-none");
    };
  }, [active, scale]);

  if (!active) return null;

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white will-change-transform shadow-[0_0_8px_rgba(255,255,255,0.8)]"
      style={{ width: CURSOR.size * scale, height: CURSOR.size * scale }}
    />
  );
}
