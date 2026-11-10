// Typed calls against the /api/learn endpoints. One function per backend operation
// so screens never build URLs or JSON bodies by hand.

import { apiRequest } from "./apiClient";

export function createProfile({ name, avatar }) {
  return apiRequest("/api/learn/profiles", {
    method: "POST",
    body: JSON.stringify({ name, avatar }),
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
