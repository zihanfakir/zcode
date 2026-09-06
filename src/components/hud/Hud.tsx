"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/animations";
import { DURATION, EASE } from "@/lib/motion";

export function LiveStatus({
  statusWords,
  timeZone = "Asia/Dhaka",
  locationLabel = "Dhaka / GMT+6",
}: {
  statusWords: string[];
  timeZone?: string;
  locationLabel?: string;
}) {
  const [time, setTime] = useState<string | null>(null);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phraseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  useEffect(() => {
    const el = phraseRef.current;
    const holdMs = (DURATION.ghostHold + DURATION.indicatorExit * 2) * 1000;
    const id = setInterval(() => {
      const next = () => setPhraseIdx((i) => (i + 1) % statusWords.length);
      if (prefersReducedMotion() || !el) {
        next();
        return;
      }
      gsap.to(el, {
        opacity: 0,
        duration: DURATION.indicatorExit,
        ease: EASE.boot,
        onComplete: () => {
          next();
          gsap.to(el, {
            opacity: 1,
            duration: DURATION.indicatorExit,
            ease: EASE.boot,
          });
        },
      });
    }, holdMs);
    return () => clearInterval(id);
  }, [statusWords]);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-zinc-500">
      <span className="tabular-nums text-zinc-400 font-semibold">{time ?? "--:--:--"}</span>
      <span className="text-zinc-500">{locationLabel}</span>
      <span ref={phraseRef} className="text-blue-400 font-medium">
        / {statusWords[phraseIdx] || "BUILDING"}
      </span>
    </div>
  );
}

export function CodingSince({ year = "2023" }: { year?: string }) {
  return (
    <div className="text-right font-mono text-[0.625rem] uppercase tracking-[0.2em]">
      <span className="block text-zinc-300 font-semibold">{year}</span>
      <span className="block text-zinc-600">Coding since</span>
    </div>
  );
}
