/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        theme: {
          bg: "var(--bg-main)",
          panel: "var(--bg-panel)",
          card: "var(--bg-card)",
          border: "var(--border-main)",
          text: "var(--text-main)",
          muted: "var(--text-muted)",
          primary: "var(--primary-accent)",
        },
        zcode: {
          cyan: "#00f0ff",
          dark: "#0a0e17",
          panel: "#131b2e",
          border: "#1e293b",
          accent: "#38bdf8",
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
