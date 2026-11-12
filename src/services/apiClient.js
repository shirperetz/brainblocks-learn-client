// Thin fetch wrapper for the Spring Boot API. Errors come back as Error objects
// with a short, child-friendly Hebrew message that screens can show directly.

// Same address as the page (Vite proxies /api to :8080) - works on the PC and over Tailscale.
const API_BASE_URL = "";

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      // 2026-11-11: the logged-in child's device token (children's accounts).
      headers: { "Content-Type": "application/json", ...tokenHeader(), ...options.headers },
    });
  } catch {
    const err = new Error("אופס! לא הצלחנו להתחבר. בדקו שהשרת פועל ונסו שוב.");
    err.network = true; // no answer at all (offline / a page switch) - NOT "this login is invalid"
    throw err;
  }

  const data = await readResponseBody(response);

  if (!response.ok) {
    // 2026-11-11 (Shir: "after half an hour without use - log in again"): the server cancelled this
    // device's login. Forget it and go to the log-in screen, saying why (not a vague error).
    if (response.status === 401 && hadToken() && !path.startsWith("/api/learn/auth/")) {
      loggedOut();
    }
    const err = new Error(friendlyError(response.status, data));
    err.status = response.status;
    throw err;
  }

  return data;
}

export const TOKEN_STORAGE_KEY = "lc_token";

function hadToken() {
  try {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
  } catch {
    return false;
  }
}

/**
 * 2026-11-11: the child is really using the app (a tap / a key) -> tell the server at most once a
 * minute, so the 30-minute idle log-out only happens when nobody touches it (a whole level is played
 * in the browser with no request - found by the kid bot: logged out at the end of a level).
 */
let lastPing = 0;
export function stillHere() {
  const now = Date.now();
  if (now - lastPing < 60_000 || !hadToken()) return;
  lastPing = now;
  fetch(`${API_BASE_URL}/api/learn/ping`, { headers: tokenHeader() })
    .then((r) => {
      if (r.status === 401) loggedOut();
    })
    .catch(() => {});
}

let leaving = false;
function loggedOut() {
  if (leaving) return;
  leaving = true;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem("lc_profile_id");
  } catch {
    /* ignore */
  }
  const here = window.location.pathname;
  window.location.assign(`/login?expired=1${here.startsWith("/staff") || here === "/admin" ? `&next=${encodeURIComponent(here)}` : ""}`);
}

function tokenHeader() {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return token ? { "X-Learner-Token": token } : {};
  } catch {
    return {};
  }
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function friendlyError(status, data) {
  const serverMessage = data?.message || data?.error;
  if (status === 404) return "לא מצאנו את מה שחיפשנו. נסו שוב.";
  if (status === 401) return serverMessage || "צריך להיכנס שוב עם שם משתמש וסיסמה.";
  if (status === 403 || status === 409 || status === 429) return serverMessage || "נסו שוב.";
  if (status === 400) return serverMessage || "משהו בטופס לא תקין, נסו שוב.";
  return "אופס! משהו השתבש. ננסה שוב עוד רגע.";
}

export { API_BASE_URL };
