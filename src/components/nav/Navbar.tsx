"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrambleText } from "@/components/motion/ScrambleText";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:px-10">
        {/* Left nav links */}
        <nav className="hidden items-center gap-6 sm:flex sm:gap-8">
          <Link
            href="/about#career"
            className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <ScrambleText entrance="observer">Career</ScrambleText>
          </Link>
          <Link
            href="/about"
            className={`text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-200 ${
              pathname === "/about" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            <ScrambleText entrance="observer">About</ScrambleText>
          </Link>
        </nav>

        {/* Center monogram logo: ZF */}
        <Link
          href="/"
          aria-label="Home"
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center group"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full border border-zinc-800/80 bg-black/60 backdrop-blur-md transition-all duration-300 group-hover:border-blue-500/50 group-hover:scale-105">
            <svg
              viewBox="0 0 40 40"
              className="w-7 h-7 text-white transition-transform duration-300 group-hover:text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Monogram Z and F fused geometric lines */}
              <path d="M11 14h18l-14 12h14" />
              <path d="M19 14v12" opacity="0.4" />
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
            </svg>
            <span className="sr-only">Zihan Fakir Home</span>
          </div>
        </Link>

        {/* Right nav links */}
        <nav className="hidden items-center gap-6 sm:flex sm:gap-8">
          <Link
            href="/projects"
            className={`text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-200 ${
              pathname === "/projects" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            <ScrambleText entrance="observer">Projects</ScrambleText>
          </Link>
          <Link
            href="/achievements"
            className={`text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-200 ${
              pathname === "/achievements" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
            }`}
          >
            <ScrambleText entrance="observer">Achievements</ScrambleText>
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="ml-auto flex h-9 w-9 items-center justify-center text-zinc-300 transition-colors hover:text-white sm:hidden z-50"
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                mobileOpen ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                mobileOpen ? "top-1.5 -rotate-45" : "bottom-0"
              }`}
            />
          </span>
        </button>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-black/95 backdrop-blur-xl transition-all duration-300 sm:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="text-2xl font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-white"
        >
          Home
        </Link>
        <Link
          href="/about"
          onClick={() => setMobileOpen(false)}
          className="text-2xl font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-white"
        >
          About
        </Link>
        <Link
          href="/about#career"
          onClick={() => setMobileOpen(false)}
          className="text-2xl font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-white"
        >
          Career
        </Link>
        <Link
          href="/projects"
          onClick={() => setMobileOpen(false)}
          className="text-2xl font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-white"
        >
          Projects
        </Link>
        <Link
          href="/achievements"
          onClick={() => setMobileOpen(false)}
          className="text-2xl font-semibold uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:text-white"
        >
          Achievements
        </Link>
      </div>
    </>
  );
}
