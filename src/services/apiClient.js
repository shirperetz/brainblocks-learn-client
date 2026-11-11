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
    throw new Error("אופס! לא הצלחנו להתחבר. בדקו שהשרת פועל ונסו שוב.");
  }

  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(friendlyError(response.status, data));
  }

  return data;
}

export const TOKEN_STORAGE_KEY = "lc_token";

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
  if (status === 409 || status === 429) return serverMessage || "נסו שוב.";
  if (status === 400) return serverMessage || "משהו בטופס לא תקין, נסו שוב.";
  return "אופס! משהו השתבש. ננסה שוב עוד רגע.";
}

export { API_BASE_URL };
