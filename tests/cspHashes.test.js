// 2026-11-26: the inline scripts in the built page run only if the server's CSP lists their sha256.
// Recomputed from dist/index.html (run after `npm run build`); a plugin upgrade that changes them
// fails here until PublicAccessConfig.LEGACY_SCRIPTS is updated.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const javaPath = "../server/src/main/java/com/example/brainblocks/config/PublicAccessConfig.java";
const htmlPath = "dist/index.html";

test("every inline script of the built page is allowed by the server CSP", { skip: !existsSync(javaPath) || !existsSync(htmlPath) }, () => {
  const java = readFileSync(javaPath, "utf8");
  const html = readFileSync(htmlPath, "utf8");
  let count = 0;
  for (const m of html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!m[1].trim()) continue;
    count++;
    const h = createHash("sha256").update(m[1]).digest("base64");
    assert.ok(java.includes(`'sha256-${h}'`), `CSP is missing sha256-${h}`);
  }
  assert.ok(count > 0);
  assert.ok(!html.includes("data:text/javascript"), "a data: script would be blocked by the CSP");
});
