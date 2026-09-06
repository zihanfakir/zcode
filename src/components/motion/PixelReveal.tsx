"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/animations";

const COLS = 22;
const ROWS = 13;
const TOTAL_CELLS = COLS * ROWS;

export function PixelReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setComplete(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const cells = container.querySelectorAll("[data-pixel-cell]");
    if (!cells.length) return;

    // Staggered dissolve of pixel blocks radiating from center/scattered
    const tl = gsap.timeline({
      delay: 0.3,
      onComplete: () => {
        setComplete(true);
      },
    });

    tl.to(cells, {
      opacity: 0,
      scale: 0.85,
      duration: 0.4,
      stagger: {
        amount: 0.8,
        grid: [ROWS, COLS],
        from: "center",
      },
      ease: "power2.inOut",
    });

    return () => {
      tl.kill();
    };
  }, []);

  if (complete) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 z-[100] grid pointer-events-none"
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {Array.from({ length: TOTAL_CELLS }).map((_, i) => (
        <div
          key={i}
          data-pixel-cell="true"
          className="bg-black will-change-transform border-[0.5px] border-zinc-900/30"
        />
      ))}
    </div>
  );
}
