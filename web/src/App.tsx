import React, { useState, useEffect } from "react";
import { Navbar, NavPage } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { GeneratorPage } from "./pages/GeneratorPage";
import { ScannerPage } from "./pages/ScannerPage";
import { AboutPage } from "./pages/AboutPage";
import { DocsPage } from "./pages/DocsPage";

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>("home");
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e17] text-slate-100 transition-colors">
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {currentPage === "home" && <HomePage onNavigate={setCurrentPage} />}
        {currentPage === "generator" && <GeneratorPage />}
        {currentPage === "scanner" && <ScannerPage />}
        {currentPage === "about" && <AboutPage />}
        {currentPage === "docs" && <DocsPage />}
      </main>

      <Footer />
    </div>
  );
};
