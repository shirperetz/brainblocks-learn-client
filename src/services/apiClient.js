// Thin fetch wrapper for the Spring Boot API. Errors come back as Error objects
// with a short, child-friendly Hebrew message that screens can show directly.

const API_BASE_URL = "http://localhost:8080";

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
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
  if (status === 400) return serverMessage || "משהו בטופס לא תקין, נסו שוב.";
  return "אופס! משהו השתבש. ננסה שוב עוד רגע.";
}

export { API_BASE_URL };
