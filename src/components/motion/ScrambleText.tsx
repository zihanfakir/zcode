"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ElementType,
  type HTMLAttributes,
} from "react";
import type { gsap } from "gsap";
import { prefersReducedMotion, scrambleText } from "@/lib/animations";

export type ScrambleHandle = { play: () => void };

type ScrambleTextProps = {
  children: string;
  as?: ElementType;
  className?: string;
  entrance?: "manual" | "observer" | "auto";
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export const ScrambleText = forwardRef<ScrambleHandle, ScrambleTextProps>(
  function ScrambleText(
    { children, as, className = "", entrance = "auto", ...rest },
    ref,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Tag = (as ?? "span") as any;
    const text = children;

    const rootRef = useRef<HTMLElement | null>(null);
    const innerRef = useRef<HTMLSpanElement | null>(null);
    const tweenRef = useRef<gsap.core.Tween | null>(null);
    const enteredRef = useRef(false);

    const releaseHeight = () => {
      const root = rootRef.current;
      if (root) root.style.height = "";
    };

    const scramble = () => {
      const el = innerRef.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.textContent = text;
        return;
      }
      tweenRef.current?.kill();

      const root = rootRef.current;
      if (root) {
        root.style.height = "";
        const h = root.getBoundingClientRect().height;
        if (h > 0) root.style.height = `${h}px`;
      }

      tweenRef.current = scrambleText(el, text);
      tweenRef.current.then(releaseHeight).catch(() => {});
    };

    const playEntrance = () => {
      if (enteredRef.current) return;
      enteredRef.current = true;
      scramble();
    };

    const playHover = () => {
      if (enteredRef.current) scramble();
    };

    useImperativeHandle(ref, () => ({ play: playEntrance }), []);

    useEffect(() => {
      const node = rootRef.current as (HTMLElement & { __scramblePlay?: () => void }) | null;
      if (node) node.__scramblePlay = playEntrance;

      if (entrance === "auto") {
        const timer = setTimeout(() => {
          playEntrance();
        }, 120);
        return () => clearTimeout(timer);
      }

      let io: IntersectionObserver | null = null;
      if (entrance === "observer" && !prefersReducedMotion() && node) {
        io = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              playEntrance();
              io?.disconnect();
            }
          },
          { rootMargin: "0px 0px -10% 0px" },
        );
        io.observe(node);
      }

      return () => {
        io?.disconnect();
        tweenRef.current?.kill();
        releaseHeight();
        if (node) delete node.__scramblePlay;
      };
    }, [entrance]);

    return (
      <Tag
        ref={rootRef}
        data-scramble
        aria-label={text}
        onPointerEnter={playHover}
        className={className}
        {...rest}
      >
        <span ref={innerRef} aria-hidden="true">
          {text}
        </span>
      </Tag>
    );
  },
);
