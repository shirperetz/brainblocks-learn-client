import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ProfileProvider } from "./context/ProfileProvider";
import App from "./App.jsx";
import "./styles/global.css";

// 2026-11-11: a sign-up link with the join code (…/?code=123456) fills it in on the sign-up screen;
// it is kept for this tab only and removed from the address bar.
try {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    sessionStorage.setItem("lc_join_code", code.trim());
    url.searchParams.delete("code");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
} catch {
  // storage blocked - the child types the code instead
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>,
);
