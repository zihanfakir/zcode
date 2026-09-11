import React, { useState, useRef, useEffect } from "react";
import { QrCode, Scan, Compass, BookOpen, Palette, Check, ChevronDown } from "lucide-react";
import { useSiteTheme, SITE_THEMES, SiteThemeId } from "../context/ThemeContext";

export type NavPage = "home" | "generator" | "scanner" | "about" | "docs";

interface NavbarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { theme, themeId, setThemeId } = useSiteTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-theme-bg/85 border-b border-theme-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate("home")}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div
            className="relative w-9 h-9 rounded-full border flex items-center justify-center transition-colors"
            style={{
              borderColor: `${theme.primary}60`,
              backgroundColor: `${theme.primary}15`,
            }}
          >
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
            <div
              className="absolute inset-0 rounded-full border animate-ping"
              style={{ borderColor: `${theme.primary}30` }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-wider text-theme-text flex items-center gap-1">
              Z<span style={{ color: theme.primary }}>-CODE</span>
            </span>
            <span
              className="text-[10px] tracking-widest font-mono -mt-1 uppercase opacity-75"
              style={{ color: theme.primary }}
            >
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
                ? "font-bold shadow-sm"
                : "text-theme-muted hover:text-theme-text hover:bg-theme-panel"
            }`}
            style={
              currentPage === "home"
                ? {
                    color: theme.isLight ? "#000000" : theme.primary,
                    backgroundColor: `${theme.primary}18`,
                  }
                : undefined
            }
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("generator")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "generator"
                ? "font-bold shadow-sm"
                : "text-theme-muted hover:text-theme-text hover:bg-theme-panel"
            }`}
            style={
              currentPage === "generator"
                ? {
                    color: theme.isLight ? "#000000" : theme.primary,
                    backgroundColor: `${theme.primary}18`,
                  }
                : undefined
            }
          >
            <QrCode className="w-4 h-4" />
            Generator
          </button>
          <button
            onClick={() => onNavigate("scanner")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "scanner"
                ? "font-bold shadow-sm"
                : "text-theme-muted hover:text-theme-text hover:bg-theme-panel"
            }`}
            style={
              currentPage === "scanner"
                ? {
                    color: theme.isLight ? "#000000" : theme.primary,
                    backgroundColor: `${theme.primary}18`,
                  }
                : undefined
            }
          >
            <Scan className="w-4 h-4" />
            Scanner
          </button>
          <button
            onClick={() => onNavigate("about")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "about"
                ? "font-bold shadow-sm"
                : "text-theme-muted hover:text-theme-text hover:bg-theme-panel"
            }`}
            style={
              currentPage === "about"
                ? {
                    color: theme.isLight ? "#000000" : theme.primary,
                    backgroundColor: `${theme.primary}18`,
                  }
                : undefined
            }
          >
            <Compass className="w-4 h-4" />
            About
          </button>
          <button
            onClick={() => onNavigate("docs")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentPage === "docs"
                ? "font-bold shadow-sm"
                : "text-theme-muted hover:text-theme-text hover:bg-theme-panel"
            }`}
            style={
              currentPage === "docs"
                ? {
                    color: theme.isLight ? "#000000" : theme.primary,
                    backgroundColor: `${theme.primary}18`,
                  }
                : undefined
            }
          >
            <BookOpen className="w-4 h-4" />
            Docs & Specs
          </button>
        </nav>

        {/* Right actions: Theme Selector & Action button */}
        <div className="flex items-center space-x-2">
          {/* Theme Selector Popover */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl border border-theme-border bg-theme-panel hover:bg-theme-card text-theme-text text-xs font-medium flex items-center gap-2 transition shadow-sm"
              title="Change Website Theme"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-theme-border shadow-inner"
                style={{ backgroundColor: theme.primary }}
              />
              <span className="hidden sm:inline">{theme.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-theme-border bg-theme-panel p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 border-b border-theme-border/60 text-[10px] font-mono tracking-wider text-theme-muted uppercase font-bold flex items-center gap-1.5">
                  <Palette className="w-3 h-3" />
                  Website Theme
                </div>
                <div className="space-y-1 mt-1.5">
                  {(Object.keys(SITE_THEMES) as SiteThemeId[]).map((id) => {
                    const t = SITE_THEMES[id];
                    const isSelected = themeId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setThemeId(id);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                          isSelected
                            ? "bg-theme-card font-bold text-theme-text border border-theme-border"
                            : "text-theme-muted hover:text-theme-text hover:bg-theme-card/60"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-theme-border/60 flex-shrink-0"
                            style={{ backgroundColor: t.primary }}
                          />
                          <div>
                            <div className="leading-none">{t.name}</div>
                            <div className="text-[10px] opacity-60 font-normal mt-0.5">
                              {t.tagline}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate("generator")}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            style={{
              backgroundColor: theme.primary,
              color: theme.isLight ? "#ffffff" : "#000000",
            }}
          >
            New Z-Code
          </button>
        </div>
      </div>
    </header>

    {/* Fixed Mobile Bottom Navigation Bar (Thumb-Friendly, Native App Experience) */}
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-theme-bg/95 border-t border-theme-border flex items-center justify-around py-1.5 px-3 shadow-[0_-4px_25px_rgba(0,0,0,0.3)] transition-colors"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <button
        onClick={() => onNavigate("home")}
        className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
          currentPage === "home" ? "font-bold scale-105" : "text-theme-muted opacity-70 hover:opacity-100"
        }`}
        style={currentPage === "home" ? { color: theme.isLight ? "#000000" : theme.primary } : undefined}
      >
        <span className="text-base leading-none mb-1">🏠</span>
        <span className="text-[10px] tracking-wide">Home</span>
      </button>

      <button
        onClick={() => onNavigate("generator")}
        className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
          currentPage === "generator" ? "font-bold scale-105" : "text-theme-muted opacity-70 hover:opacity-100"
        }`}
        style={currentPage === "generator" ? { color: theme.isLight ? "#000000" : theme.primary } : undefined}
      >
        <QrCode className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-wide">Create</span>
      </button>

      <button
        onClick={() => onNavigate("scanner")}
        className="relative -top-3 flex flex-col items-center group"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 border"
          style={{
            backgroundColor: theme.primary,
            borderColor: `${theme.primary}80`,
            boxShadow: `0 4px 14px ${theme.primary}50`,
          }}
        >
          <Scan className={`w-6 h-6 ${theme.isLight ? "text-white" : "text-black"}`} />
        </div>
        <span
          className="text-[10px] font-bold mt-1 tracking-wide"
          style={currentPage === "scanner" ? { color: theme.isLight ? "#000000" : theme.primary } : { color: "var(--tw-text-opacity)" }}
        >
          Scan
        </span>
      </button>

      <button
        onClick={() => onNavigate("docs")}
        className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
          currentPage === "docs" ? "font-bold scale-105" : "text-theme-muted opacity-70 hover:opacity-100"
        }`}
        style={currentPage === "docs" ? { color: theme.isLight ? "#000000" : theme.primary } : undefined}
      >
        <BookOpen className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-wide">Docs</span>
      </button>

      <button
        onClick={() => onNavigate("about")}
        className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
          currentPage === "about" ? "font-bold scale-105" : "text-theme-muted opacity-70 hover:opacity-100"
        }`}
        style={currentPage === "about" ? { color: theme.isLight ? "#000000" : theme.primary } : undefined}
      >
        <Compass className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-wide">About</span>
      </button>
    </nav>
    </>
  );
};
