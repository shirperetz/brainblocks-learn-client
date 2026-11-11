// Typed calls against the /api/learn endpoints. One function per backend operation
// so screens never build URLs or JSON bodies by hand.

import { API_BASE_URL, apiRequest } from "./apiClient";

// 2026-11-11: children's accounts - a profile is made with a username + password, and every
// device logs in with them. Both return { token, profile }.
export function register({ joinCode, username, password, name, avatar, grade, difficulty }) {
  return apiRequest("/api/learn/auth/register", {
    method: "POST",
    body: JSON.stringify({ joinCode, username, password, name, avatar, grade, difficulty }),
  });
}

export function login({ username, password }) {
  return apiRequest("/api/learn/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getProfile(id) {
  return apiRequest(`/api/learn/profiles/${id}`);
}

export function updateProfile(id, changes) {
  return apiRequest(`/api/learn/profiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function getStageMap(profileId, topic) {
  return apiRequest(`/api/learn/profiles/${profileId}/map?topic=${topic}`);
}

export function getQuestions({ profileId, topic, stage, count = 10 }) {
  const params = new URLSearchParams({ profileId, topic, stage, count });
  return apiRequest(`/api/learn/questions?${params.toString()}`);
}

export function submitSession(payload) {
  return apiRequest("/api/learn/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---- Help ("לא הבנתי"), review, challenges ---------------------------------

/** A short explanation of one question (local AI, or the game's own hint). Never the answer. */
/** attempt: 0 = first press, 1 = "explain differently" (both from code, always correct), 2+ = the local AI. */
export function getHelp({ questionText, correctAnswer, chosenAnswer, grade, attempt = 0, fallbackHint }) {
  return apiRequest("/api/learn/help", {
    method: "POST",
    body: JSON.stringify({ questionText, correctAnswer, chosenAnswer, grade, attempt, fallbackHint }),
  });
}

/** The text read aloud as an object URL (WAV), or null when the computer has no voice for it. */
export async function speakUrl(text) {
  try {
    const r = await fetch(`${API_BASE_URL}/api/learn/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (r.status !== 200) return null;
    return URL.createObjectURL(await r.blob());
  } catch {
    return null;
  }
}

export function getMistakes(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/mistakes`);
}

export function resolveMistake(mistakeId, profileId) {
  return apiRequest(`/api/learn/mistakes/${mistakeId}/resolve?profileId=${profileId}`, { method: "POST" });
}

export function getStats(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/stats`);
}
