import React, { useState } from "react";
import { Navbar, NavPage } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { GeneratorPage } from "./pages/GeneratorPage";
import { ScannerPage } from "./pages/ScannerPage";
import { AboutPage } from "./pages/AboutPage";
import { DocsPage } from "./pages/DocsPage";

import { ThemeProvider } from "./context/ThemeContext";

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>("home");

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text transition-colors duration-200">
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <main className="flex-1 pb-24 md:pb-0">
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

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
