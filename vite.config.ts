import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// FIXED FINDING-18: Dev server bound to localhost only (not 0.0.0.0)
// This prevents LAN clients from accessing the Ollama proxy or the dev server.
// Use VITE_HOST=0.0.0.0 env var only when explicitly needed for device testing.
const host = process.env.VITE_HOST || "localhost";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host,
    port: 4173,
    proxy: {
      // Ollama local LLM proxy — only reachable from localhost
      "/ollama": {
        target: "http://127.0.0.1:11434",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ""),
      },
    },
  },
  preview: {
    host,
    port: 4173,
  },
});
