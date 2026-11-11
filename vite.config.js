import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// עולם החשבון on 5174. /api is proxied to the Spring Boot server (:8080), so the page and the API
// share one address - it then also works from a phone/tablet on Shir's Tailscale (2026-11-11).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8080" },
  },
});
