import React, { createContext, useContext, useState, useEffect } from "react";

export type SiteThemeId = "monochrome" | "cyber" | "matrix" | "amber" | "light";

export interface SiteTheme {
  id: SiteThemeId;
  name: string;
  tagline: string;
  primary: string;
  bg: string;
  panel: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  glow: string;
  isLight?: boolean;
}

export const SITE_THEMES: Record<SiteThemeId, SiteTheme> = {
  monochrome: {
    id: "monochrome",
    name: "Monochrome B&W",
    tagline: "High-Contrast Minimalist (Default)",
    primary: "#ffffff",
    bg: "#000000",
    panel: "#09090b",
    card: "#121214",
    border: "#27272a",
    text: "#ffffff",
    textMuted: "#a1a1aa",
    glow: "rgba(255, 255, 255, 0.2)",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Cyan",
    tagline: "Futuristic Neon",
    primary: "#00f0ff",
    bg: "#0a0e17",
    panel: "#0f172a",
    card: "#131b2e",
    border: "#1e293b",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    glow: "rgba(0, 240, 255, 0.25)",
  },
  matrix: {
    id: "matrix",
    name: "Emerald Matrix",
    tagline: "Terminal Green",
    primary: "#10b981",
    bg: "#04140e",
    panel: "#062419",
    card: "#093323",
    border: "#0f4c34",
    text: "#ecfdf5",
    textMuted: "#6ee7b7",
    glow: "rgba(16, 185, 129, 0.25)",
  },
  amber: {
    id: "amber",
    name: "Amber Radar",
    tagline: "Vintage Sci-Fi",
    primary: "#f59e0b",
    bg: "#140e04",
    panel: "#241806",
    card: "#332209",
    border: "#4d330d",
    text: "#fffbeb",
    textMuted: "#fcd34d",
    glow: "rgba(245, 158, 11, 0.25)",
  },
  light: {
    id: "light",
    name: "Clean Light",
    tagline: "Modern Paper White",
    primary: "#09090b",
    bg: "#ffffff",
    panel: "#f4f4f5",
    card: "#ffffff",
    border: "#e4e4e7",
    text: "#09090b",
    textMuted: "#71717a",
    glow: "rgba(0, 0, 0, 0.1)",
    isLight: true,
  },
};

interface ThemeContextType {
  theme: SiteTheme;
  themeId: SiteThemeId;
  setThemeId: (id: SiteThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: SITE_THEMES.monochrome,
  themeId: "monochrome",
  setThemeId: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<SiteThemeId>(() => {
    const saved = localStorage.getItem("zcode_site_theme") as SiteThemeId;
    return saved && SITE_THEMES[saved] ? saved : "monochrome";
  });

  const theme = SITE_THEMES[themeId];

  useEffect(() => {
    localStorage.setItem("zcode_site_theme", themeId);
    const root = document.documentElement;

    root.setAttribute("data-theme", themeId);
    if (theme.isLight) {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }

    // Set CSS custom properties
    root.style.setProperty("--bg-main", theme.bg);
    root.style.setProperty("--bg-panel", theme.panel);
    root.style.setProperty("--bg-card", theme.card);
    root.style.setProperty("--border-main", theme.border);
    root.style.setProperty("--text-main", theme.text);
    root.style.setProperty("--text-muted", theme.textMuted);
    root.style.setProperty("--primary-accent", theme.primary);
    root.style.setProperty("--accent-glow", theme.glow);
  }, [themeId, theme]);

  const setThemeId = (id: SiteThemeId) => {
    if (SITE_THEMES[id]) {
      setThemeIdState(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useSiteTheme = () => useContext(ThemeContext);
