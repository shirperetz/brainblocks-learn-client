// Typed calls against the /api/learn endpoints. One function per backend operation
// so screens never build URLs or JSON bodies by hand.

import { API_BASE_URL, apiRequest, tokenHeader } from "./apiClient";

// 2026-11-11: children's accounts - a profile is made with a username + password, and every
// device logs in with them. Both return { token, profile }.
export function register({ joinCode, username, password, name, avatar, grade, difficulty }) {
  return apiRequest("/api/learn/auth/register", {
    method: "POST",
    body: JSON.stringify({ joinCode, username, password, name, avatar, grade, difficulty }),
  });
}

/** 2026-11-12: a teacher signs up with no code - waits for the admin's approval. */
export function registerTeacher({ username, password, name }) {
  return apiRequest("/api/learn/auth/register-teacher", { method: "POST", body: JSON.stringify({ username, password, name }) });
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

/** 2026-11-13: the endless sea - every open island + the next locked one (docs/plan-infinite-islands.md). */
export function getIsles(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/isles`);
}

/** A finished round on a generated island ("gen-3"): kept on the server with every answer. */
export function submitIsleSession(profileId, isleKey, payload) {
  return apiRequest(`/api/learn/profiles/${profileId}/isles/${isleKey}/sessions`, { method: "POST", body: JSON.stringify(payload) });
}

export function getStageMap(profileId, topic) {
  return apiRequest(`/api/learn/profiles/${profileId}/map?topic=${topic}`);
}

export function getQuestions({ profileId, topic, stage, count = 10, secure = false, tier = 0 }) {
  const params = new URLSearchParams({ profileId, topic, stage, count, ...(secure ? { secure: "true" } : {}), ...(tier ? { tier } : {}) });
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
export function getHelp({ questionText, correctAnswer, chosenAnswer, grade, attempt = 0, fallbackHint, bankId }) {
  return apiRequest("/api/learn/help", {
    method: "POST",
    body: JSON.stringify({ questionText, correctAnswer, chosenAnswer, grade, attempt, fallbackHint, bankId }),
  });
}

/**
 * 2026-11-12 (stage 2): the server checks the answer to a bank question and only then tells the right
 * answer + explanation -> { correct, correctAnswer, correctIndex, explanation }.
 */
export function answerQuestion(bankId, answer) {
  return apiRequest(`/api/learn/questions/${bankId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

/** The text read aloud as an object URL (WAV), or null when the computer has no voice for it. */
export async function speakUrl(text) {
  try {
    const r = await fetch(`${API_BASE_URL}/api/learn/speak`, {
      method: "POST",
      // 2026-11-12: with the login token - without it every read-aloud got 401 since accounts (11.11).
      headers: { "Content-Type": "application/json", ...tokenHeader() },
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

/** 2026-11-12: wrong in the review - it comes back tomorrow (right: after 1, 3, 7 days, then learned). */
export function missMistake(mistakeId, profileId) {
  return apiRequest(`/api/learn/mistakes/${mistakeId}/missed?profileId=${profileId}`, { method: "POST" });
}

export function getStats(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/stats`);
}

// ---- Admin (2026-11-11) - only Shir's admin account gets past the server's check ----------

export function adminChildren() {
  return apiRequest("/api/learn/admin/children");
}

export function adminSetPassword(id, { username, password }) {
  return apiRequest(`/api/learn/admin/children/${id}/password`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function adminSetDisabled(id, disabled) {
  return apiRequest(`/api/learn/admin/children/${id}/disabled`, {
    method: "POST",
    body: JSON.stringify({ disabled }),
  });
}

export function adminApprove(id) {
  return apiRequest(`/api/learn/admin/children/${id}/approve`, { method: "POST" });
}

export function adminJoinCode() {
  return apiRequest("/api/learn/admin/join-code");
}

export function adminChangeJoinCode(code) {
  return apiRequest("/api/learn/admin/join-code", { method: "PUT", body: JSON.stringify({ code }) });
}

// ---- Teachers and the admin (2026-11-11) - the server decides who sees which child ----------

export function staffMe() {
  return apiRequest("/api/learn/staff/me");
}

export function staffOverview(classId) {
  return apiRequest(`/api/learn/staff/overview${classId != null ? `?classId=${classId}` : ""}`);
}

export function staffChildren(classId) {
  return apiRequest(`/api/learn/staff/children${classId != null ? `?classId=${classId}` : ""}`);
}

export function staffReport(childId) {
  return apiRequest(`/api/learn/staff/children/${childId}/report`);
}

export function staffApprove(childId) {
  return apiRequest(`/api/learn/staff/children/${childId}/approve`, { method: "POST" });
}

export function staffSetDisabled(childId, disabled) {
  return apiRequest(`/api/learn/staff/children/${childId}/disabled`, {
    method: "POST",
    body: JSON.stringify({ disabled }),
  });
}

export function staffSetPassword(childId, { username, password }) {
  return apiRequest(`/api/learn/staff/children/${childId}/password`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function staffMoveChild(childId, classId) {
  return apiRequest(`/api/learn/staff/children/${childId}/class`, {
    method: "POST",
    body: JSON.stringify({ classId: classId ?? 0 }),
  });
}

export function staffCreateClass(name, teacherId, grade) {
  return apiRequest("/api/learn/staff/classes", {
    method: "POST",
    body: JSON.stringify({ name, ...(teacherId ? { teacherId } : {}), ...(grade ? { grade } : {}) }),
  });
}

/** 2026-11-12: set (and lock) the grade a child practices. */
export function staffSetGrade(childId, { grade, locked, changeAllowed }) {
  return apiRequest(`/api/learn/staff/children/${childId}/grade`, {
    method: "POST",
    body: JSON.stringify({ ...(grade ? { grade } : {}), locked, ...(changeAllowed !== undefined ? { changeAllowed } : {}) }),
  });
}

export function staffUpdateClass(id, changes) {
  return apiRequest(`/api/learn/staff/classes/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
}

/** 2026-11-12: the class is deleted; its children stay, with no class. */
export function staffDeleteClass(id) {
  return apiRequest(`/api/learn/staff/classes/${id}`, { method: "DELETE" });
}

export function staffTeachers() {
  return apiRequest("/api/learn/staff/teachers");
}

export function staffApproveTeacher(id) {
  return apiRequest(`/api/learn/staff/teachers/${id}/approve`, { method: "POST" });
}

export function staffSetTeacherDisabled(id, disabled) {
  return apiRequest(`/api/learn/staff/teachers/${id}/disabled`, {
    method: "POST",
    body: JSON.stringify({ disabled }),
  });
}

export function staffTeacherCode() {
  return apiRequest("/api/learn/staff/teacher-code");
}

export function staffChangeTeacherCode(code) {
  return apiRequest("/api/learn/staff/teacher-code", { method: "PUT", body: JSON.stringify({ code }) });
}

/** 2026-11-11 (settings): the child's own new password - needs the current one. Returns { token, profile }. */
export function changeOwnPassword(id, current, password) {
  return apiRequest(`/api/learn/profiles/${id}/password`, {
    method: "POST",
    body: JSON.stringify({ current, password }),
  });
}

// ---- "האי שלי" (2026-11-11) ----

export function getIsland(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/island`);
}

export function chooseIslandItem(profileId, spot, item) {
  return apiRequest(`/api/learn/profiles/${profileId}/island`, {
    method: "PUT",
    body: JSON.stringify({ spot, item }),
  });
}

export function staffChildIsland(childId) {
  return apiRequest(`/api/learn/staff/children/${childId}/island`);
}

// ---- weekly tasks from the teacher (idea #5, 2026-11-12) ----

/** The child's running tasks: [{ id, topic, rounds, done, daysLeft, endDate }]. */
export function getAssignments(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/assignments`);
}

/** The class's tasks, each with every child's progress (teacher / admin). */
export function staffAssignments(classId) {
  return apiRequest(`/api/learn/staff/classes/${classId}/assignments`);
}

export function staffCreateAssignment(classId, { topic, rounds, days }) {
  return apiRequest(`/api/learn/staff/classes/${classId}/assignments`, {
    method: "POST",
    body: JSON.stringify({ topic, rounds, days }),
  });
}

// 2026-11-13 (Shir: "practice from the report"): a short task for one child
export function staffPractice(childId) {
  return apiRequest(`/api/learn/staff/children/${childId}/practice`);
}

export function staffGivePractice(childId, topic) {
  return apiRequest(`/api/learn/staff/children/${childId}/practice`, { method: "POST", body: JSON.stringify({ topic }) });
}

export function staffCancelAssignment(id) {
  return apiRequest(`/api/learn/staff/assignments/${id}/cancel`, { method: "POST" });
}

// ---- the class building (idea #6, 2026-11-12) ----

/** The child's class building this week ({} when the child has no class). */
export function getClassBuilding(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/class-building`);
}

export function staffClassBuilding(classId) {
  return apiRequest(`/api/learn/staff/classes/${classId}/building`);
}

// ---- the live game room (2026-11-12) ----

export function roomCreate({ classId, topics, minutes, grade }) {
  return apiRequest("/api/learn/rooms", { method: "POST", body: JSON.stringify({ classId, topics, minutes, grade }) });
}
export function roomLive(id) {
  return apiRequest(`/api/learn/rooms/${id}/live`);
}
export function roomBoard(id) {
  return apiRequest(`/api/learn/rooms/${id}/board`);
}
export function roomDecide(id, playerId, approve) {
  return apiRequest(`/api/learn/rooms/${id}/players/${playerId}/${approve ? "approve" : "reject"}`, { method: "POST" });
}
export function roomAction(id, action) {
  return apiRequest(`/api/learn/rooms/${id}/${action}`, { method: "POST" }); // start | extend | end
}
export function myQuestions() {
  return apiRequest("/api/learn/rooms/my-questions");
}
export function addMyQuestion(q) {
  return apiRequest("/api/learn/rooms/my-questions", { method: "POST", body: JSON.stringify(q) });
}
export function setMyQuestionOff(id, off) {
  return apiRequest(`/api/learn/rooms/my-questions/${id}/off`, { method: "POST", body: JSON.stringify({ off }) });
}

/** A child: logged in -> its own token; a guest -> the room's guest token (sessionStorage, this tab only). */
const GUEST_KEY = (code) => `lc_room_guest_${code}`;
export function guestToken(code) {
  try {
    return sessionStorage.getItem(GUEST_KEY(code));
  } catch {
    return null;
  }
}
export function roomJoin(code) {
  return apiRequest("/api/learn/rooms/join", { method: "POST", body: JSON.stringify({ code }) });
}
export async function roomJoinGuest(code, name) {
  const r = await apiRequest("/api/learn/room-guest/join", { method: "POST", body: JSON.stringify({ code, name }) });
  try {
    sessionStorage.setItem(GUEST_KEY(r.code), r.guestToken);
  } catch {
    /* private mode: works until the page closes */
  }
  return r;
}
function roomPath(code, what) {
  return guestToken(code) ? `/api/learn/room-guest/${code}/${what}` : `/api/learn/rooms/code/${code}/${what}`;
}
function guestHeaders(code) {
  const t = guestToken(code);
  return t ? { "X-Guest-Token": t } : {};
}
export function roomMe(code) {
  return apiRequest(roomPath(code, "me"), { headers: guestHeaders(code) });
}
export function roomQuestion(code) {
  return apiRequest(roomPath(code, "question"), { headers: guestHeaders(code) });
}
export function roomAnswer(code, answer) {
  return apiRequest(roomPath(code, "answer"), { method: "POST", body: JSON.stringify({ answer }), headers: guestHeaders(code) });
}

// 2026-11-12: the school tree (teachers -> classes -> children) and making a user a teacher - admin only.
export function adminTree() {
  return apiRequest("/api/learn/admin/tree");
}

export function adminSetTeacher(id, teacher) {
  return apiRequest(`/api/learn/admin/children/${id}/teacher`, {
    method: "POST",
    body: JSON.stringify({ teacher }),
  });
}

export function adminMoveClass(classId, teacherId) {
  return apiRequest(`/api/learn/admin/classes/${classId}/teacher`, {
    method: "POST",
    body: JSON.stringify({ teacherId }),
  });
}

// 2026-11-13: the child's 3D island - coins, what is built, buying, upgrading, land, chests.
export function getMyIsland(profileId, isle = 0) {
  return apiRequest(`/api/learn/profiles/${profileId}/my-island?isle=${isle}`);
}

export function islandAction(profileId, what, body = {}) {
  return apiRequest(`/api/learn/profiles/${profileId}/my-island/${what}`, { method: "POST", body: JSON.stringify(body) });
}

// ---- 2026-11-13: a child with an account joins a class with its code; the teacher accepts ----
export function getJoinClass(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/join-class`);
}

export function askJoinClass(profileId, code) {
  return apiRequest(`/api/learn/profiles/${profileId}/join-class`, { method: "POST", body: JSON.stringify({ code }) });
}

export function cancelJoinClass(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/join-class/cancel`, { method: "POST" });
}

export function staffClassRequests() {
  return apiRequest(`/api/learn/staff/class-requests`);
}

export function staffAnswerClassRequest(childId, accept) {
  return apiRequest(`/api/learn/staff/class-requests/${childId}/${accept ? "accept" : "decline"}`, { method: "POST" });
}

// 2026-11-13 (Shir): the admin sets how many students a teacher can have (0 = no limit)
export function staffSetTeacherMax(teacherId, maxStudents) {
  return apiRequest(`/api/learn/staff/teachers/${teacherId}/max-students`, { method: "POST", body: JSON.stringify({ maxStudents }) });
}
