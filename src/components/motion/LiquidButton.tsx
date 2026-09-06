"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { liquidFillTimeline, prefersReducedMotion } from "@/lib/animations";
import { LIQUID } from "@/lib/motion";
import { uiScale } from "@/lib/uiScale";

const INSET = 6;
const INSET_CSS = `${INSET / 16}rem`;

type LiquidButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler;
  external?: boolean;
  shape?: "pill" | "rounded";
  className?: string;
  "aria-label"?: string;
};

export function LiquidButton({
  children,
  href,
  onClick,
  external = false,
  shape = "pill",
  className = "",
  ...rest
}: LiquidButtonProps) {
  const radius = shape === "rounded" ? "rounded-lg" : "rounded-full";

  const rootRef = useRef<HTMLElement | null>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    const label = labelRef.current;
    if (!root || !fill || !label) return;

    const build = () => {
      const inset = INSET * uiScale();
      const restW = Math.max(0, root.clientHeight - inset * 2);
      tlRef.current?.kill();
      tlRef.current = liquidFillTimeline({
        fill,
        label,
        from: { top: inset, left: inset, bottom: inset, width: restW },
        to: { top: 0, left: 0, bottom: 0, width: root.clientWidth },
      });
      tlRef.current.progress(openRef.current ? 1 : 0);
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(root);
    return () => {
      ro.disconnect();
      tlRef.current?.kill();
    };
  }, []);

  const setOpen = (open: boolean) => {
    if (open === openRef.current) return;
    openRef.current = open;
    const tl = tlRef.current;
    if (!tl) return;
    if (prefersReducedMotion()) {
      tl.progress(open ? 1 : 0).pause();
      return;
    }
    if (open) tl.play();
    else tl.reverse();
  };

  const handlers = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onTouchStart: () => setOpen(true),
    onTouchEnd: () => setOpen(false),
    onTouchCancel: () => setOpen(false),
  };

  const inner = (
    <>
      <span
        ref={fillRef}
        aria-hidden
        className={`pointer-events-none absolute z-0 ${radius}`}
        style={{
          top: INSET_CSS,
          left: INSET_CSS,
          bottom: INSET_CSS,
          width: "2.25rem",
          backgroundColor: LIQUID.ink,
        }}
      />
      <span className="relative z-10 flex items-center gap-3 py-1.5 pl-1.5 pr-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-white bg-black">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
        <span
          ref={labelRef}
          className="text-[0.9375rem] font-semibold tracking-tight text-[#0a0a0a]"
        >
          {children}
        </span>
      </span>
    </>
  );

  const shared =
    `group relative inline-flex select-none items-center ${radius} ring-2 ring-transparent transition-all duration-300 hover:ring-white/80 active:ring-white/80 ` +
    className;
  const style = { backgroundColor: LIQUID.cream };

  if (href && external) {
    return (
      <a
        ref={rootRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={shared}
        style={style}
        {...handlers}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  if (href) {
    return (
      <Link
        ref={rootRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        className={shared}
        style={style}
        {...handlers}
        {...rest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      ref={rootRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={shared}
      style={style}
      {...handlers}
      {...rest}
    >
      {inner}
    </button>
  );
}
