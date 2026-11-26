/* global process */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { existsSync, readFileSync } from "node:fs";

// עולם החשבון on 5174. /api is proxied to the Spring Boot server (:8080), so the page and the API
// share one address - it then also works from a phone/tablet on Shir's Tailscale (2026-11-11).
// 2026-11-14: the share preview (WhatsApp / Facebook) needs the site's full address in index.html.
// Set PUBLIC_ORIGIN when the site moves (e.g. Render). On the PC it comes from public-origin.local
// (not in git - the home address stays private).
const localOrigin = existsSync("public-origin.local") ? readFileSync("public-origin.local", "utf8").trim() : "";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || localOrigin).replace(/\/$/, "");
// 2026-11-26: the legacy plugin's "is this a modern browser?" check imports a data: URL, which our
// CSP (script-src 'self') blocks - then EVERY browser loaded both builds. The same check now lives in
// public/modern-check.js (same origin). The inline scripts' hashes are in the server's CSP (test: cspHashes).
const DATA_CHECK = /import'data:text\/javascript,[^']*';/;
const modernCheck = {
  name: "modern-check-same-origin",
  enforce: "post",
  transformIndexHtml: { order: "post", handler: (html) => html.replace(DATA_CHECK, "import'/modern-check.js';") },
  // the same guard is also put at the top of the modern entry chunk
  generateBundle(_, bundle) {
    for (const chunk of Object.values(bundle)) {
      if (chunk.type === "chunk" && DATA_CHECK.test(chunk.code)) chunk.code = chunk.code.replace(DATA_CHECK, "import'/modern-check.js';");
    }
  },
};
const publicOrigin = { name: "public-origin", transformIndexHtml: (html) => html.replaceAll("%PUBLIC_ORIGIN%", PUBLIC_ORIGIN) };

export default defineConfig({
  // 2026-11-26 (Shir: an old iPad showed a white page): a second, older build for browsers before
  // Safari 16.4 / iOS 16.4 (loaded only by them, via nomodule). Its small inline loaders are allowed
  // by their sha256 in the server's CSP (PublicAccessConfig - the plugin's cspHashes).
  plugins: [react(), publicOrigin, legacy({ targets: ["ios >= 12", "safari >= 12", "chrome >= 64"] }), modernCheck],
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
