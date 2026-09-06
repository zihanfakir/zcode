import { gsap } from "gsap";
import { DURATION, EASE, LIQUID } from "./motion";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#@!$%^&*<>~[]{}";

/**
 * High-performance scramble text decode animation.
 * Progressively resolves characters from left to right while
 * scrambling unsettled characters with tech glyphs.
 */
export function scrambleText(
  element: HTMLElement,
  targetText: string,
  duration: number = DURATION.scrambleTotal,
): gsap.core.Tween {
  const chars = targetText.split("");
  const len = chars.length;
  const progressObj = { value: 0 };

  return gsap.to(progressObj, {
    value: 1,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      const p = progressObj.value;
      const settledCount = Math.floor(p * len);

      let result = "";
      for (let i = 0; i < len; i++) {
        if (chars[i] === " ") {
          result += " ";
        } else if (i < settledCount) {
          result += chars[i];
        } else {
          const randomIndex = Math.floor(Math.random() * GLYPHS.length);
          result += GLYPHS[randomIndex];
        }
      }
      element.textContent = result;
    },
    onComplete: () => {
      element.textContent = targetText;
    },
  });
}

export type LiquidFillParams = {
  fill: HTMLElement;
  label: HTMLElement;
  from: { top: number; left: number; bottom: number; width: number };
  to: { top: number; left: number; bottom: number; width: number };
};

/**
 * Creates a reversible GSAP timeline for the liquid button effect.
 */
export function liquidFillTimeline({
  fill,
  label,
  from,
  to,
}: LiquidFillParams): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true });

  tl.fromTo(
    fill,
    {
      top: `${from.top}px`,
      left: `${from.left}px`,
      bottom: `${from.bottom}px`,
      width: `${from.width}px`,
    },
    {
      top: `${to.top}px`,
      left: `${to.left}px`,
      bottom: `${to.bottom}px`,
      width: `${to.width}px`,
      duration: 0.35,
      ease: EASE.liquid,
    },
    0,
  );

  tl.to(
    label,
    {
      color: "#ffffff",
      duration: 0.25,
      ease: "power1.out",
    },
    0.05,
  );

  return tl;
}

/**
 * Tracks the cursor and smoothly interpolates (lag/chase) on the GSAP ticker.
 */
export function cursorChase(
  callback: (x: number, y: number, opacity: number) => void,
): () => void {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let visible = false;
  let opacity = 0;

  const onMouseMove = (e: MouseEvent) => {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!visible) {
      visible = true;
      currentX = targetX;
      currentY = targetY;
    }
  };

  const onMouseLeave = () => {
    visible = false;
  };

  const onMouseEnter = () => {
    visible = true;
  };

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  document.addEventListener("mouseleave", onMouseLeave);
  document.addEventListener("mouseenter", onMouseEnter);

  const tickHandler = () => {
    const ease = prefersReducedMotion() ? 1 : 0.22;
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    const targetOpacity = visible ? 1 : 0;
    opacity += (targetOpacity - opacity) * 0.15;

    callback(currentX, currentY, opacity);
  };

  gsap.ticker.add(tickHandler);

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseleave", onMouseLeave);
    document.removeEventListener("mouseenter", onMouseEnter);
    gsap.ticker.remove(tickHandler);
  };
}
