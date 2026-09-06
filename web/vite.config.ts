import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@zcode/core": path.resolve(__dirname, "../core/src/index.ts"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
