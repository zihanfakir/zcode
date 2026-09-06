"use client";

import { useEffect, useState } from "react";

/** Reference width (px) above which the UI scales up fluidly for 4K / ultrawide */
const REFERENCE_WIDTH = 1440;

export function getUiScale(): number {
  if (typeof window === "undefined") return 1;
  const w = window.innerWidth;
  if (w <= REFERENCE_WIDTH) return 1;
  return Math.min(1.6, w / REFERENCE_WIDTH);
}

export function uiScale(): number {
  return getUiScale();
}

export function useUiScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => setScale(getUiScale());
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return scale;
}
