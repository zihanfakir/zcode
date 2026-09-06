import React from "react";
import { QrCode, Scan, Compass, BookOpen, Sun, Moon } from "lucide-react";

export type NavPage = "home" | "generator" | "scanner" | "about" | "docs";

interface NavbarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0a0e17]/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate("home")}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 glow-cyan-sm"></div>
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-wider text-white flex items-center gap-1.5">
              Z<span className="text-cyan-400">-CODE</span>
            </span>
            <span className="text-[10px] tracking-widest text-cyan-400/70 font-mono -mt-1 uppercase">
              Circular 2D
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 font-medium text-sm">
          <button
            onClick={() => onNavigate("home")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentPage === "home"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("generator")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "generator"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Generator
          </button>
          <button
            onClick={() => onNavigate("scanner")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "scanner"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Scan className="w-4 h-4" />
            Scanner
          </button>
          <button
            onClick={() => onNavigate("about")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "about"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Compass className="w-4 h-4" />
            About
          </button>
          <button
            onClick={() => onNavigate("docs")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "docs"
                ? "text-cyan-400 bg-cyan-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Docs & Specs
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onNavigate("generator")}
            className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm"
          >
            New Z-Code
          </button>
        </div>
      </div>

      {/* Mobile bottom nav bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-[#0d1322] py-2 px-2">
        <button
          onClick={() => onNavigate("home")}
          className={`flex flex-col items-center text-xs ${
            currentPage === "home" ? "text-cyan-400 font-semibold" : "text-slate-400"
          }`}
        >
          <span className="text-sm">🏠</span>
          Home
        </button>
        <button
          onClick={() => onNavigate("generator")}
          className={`flex flex-col items-center text-xs ${
            currentPage === "generator" ? "text-cyan-400 font-semibold" : "text-slate-400"
          }`}
        >
          <QrCode className="w-4 h-4" />
          Generator
        </button>
        <button
          onClick={() => onNavigate("scanner")}
          className={`flex flex-col items-center text-xs ${
            currentPage === "scanner" ? "text-cyan-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Scan className="w-4 h-4" />
          Scanner
        </button>
        <button
          onClick={() => onNavigate("docs")}
          className={`flex flex-col items-center text-xs ${
            currentPage === "docs" ? "text-cyan-400 font-semibold" : "text-slate-400"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Docs
        </button>
      </div>
    </header>
  );
};
