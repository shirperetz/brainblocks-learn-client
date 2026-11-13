/* global process */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// עולם החשבון on 5174. /api is proxied to the Spring Boot server (:8080), so the page and the API
// share one address - it then also works from a phone/tablet on Shir's Tailscale (2026-11-11).
// 2026-11-14: the share preview (WhatsApp / Facebook) needs the site's full address in index.html.
// Set PUBLIC_ORIGIN when the site moves (e.g. Render); the default is today's public address.
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || "").replace(/\/$/, "");
const publicOrigin = { name: "public-origin", transformIndexHtml: (html) => html.replaceAll("%PUBLIC_ORIGIN%", PUBLIC_ORIGIN) };

export default defineConfig({
  plugins: [react(), publicOrigin],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        // Same-site through the proxy: the browser's Origin (e.g. the Tailscale address) made the
        // server's CORS check answer 403 on every POST/PATCH ("נסה שוב" after choosing a grade).
        configure: (proxy) => proxy.on("proxyReq", (req) => req.removeHeader("origin")),
      },
    },
  },
});
