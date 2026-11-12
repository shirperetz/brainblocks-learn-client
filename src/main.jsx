import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ProfileProvider } from "./context/ProfileProvider";
import App from "./App.jsx";
import { stillHere } from "./services/apiClient";
import "./styles/global.css";

// 2026-11-11: a sign-up link with the join code (…/?code=123456) fills it in on the sign-up screen;
// it is kept for this tab only and removed from the address bar.
try {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    sessionStorage.setItem("lc_join_code", code.trim());
    url.searchParams.delete("code");
    // 2026-11-12 (Shir: "a link I can give a child to join"): a join link opens straight on sign-up.
    const path = url.pathname === "/" ? "/who" : url.pathname;
    window.history.replaceState(null, "", path + url.search + url.hash);
  }
} catch {
  // storage blocked - the child types the code instead
}

// 2026-11-11: any tap or key = "still here" for the idle log-out (sent at most once a minute).
window.addEventListener("pointerdown", stillHere, { passive: true });
window.addEventListener("keydown", stillHere, { passive: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>,
);
