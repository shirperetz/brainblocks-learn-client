// Typed calls against the /api/learn endpoints. One function per backend operation
// so screens never build URLs or JSON bodies by hand.

import { API_BASE_URL, apiRequest, tokenHeader } from "./apiClient";

// 2026-11-11: children's accounts - a profile is made with a username + password, and every
// device logs in with them. Both return { token, profile }.
// 2026-11-13 (security, against sign-up bots): how long the form was open + the hidden trap field
let formOpenedAt = 0;
export function markFormOpened() {
  formOpenedAt = Date.now();
}
function botFields() {
  const trap = document.querySelector('input[name="website"]')?.value ?? "";
  return { website: trap, formMs: String(formOpenedAt ? Date.now() - formOpenedAt : 99999) };
}

export function register({ joinCode, username, password, name, avatar, grade, difficulty, parentConsent }) {
  return apiRequest("/api/learn/auth/register", {
    method: "POST",
    // 2026-11-14: the parent's consent (the form refuses without it; the server too).
    body: JSON.stringify({ joinCode, username, password, name, avatar, grade, difficulty, parentConsent: parentConsent ? "yes" : "no", ...botFields() }),
  });
}

/** 2026-11-12: a teacher signs up with no code - waits for the admin's approval. */
export function registerTeacher({ username, password, name, privacyAccepted }) {
  return apiRequest("/api/learn/auth/register-teacher", {
    method: "POST", body: JSON.stringify({ username, password, name, privacyAccepted: privacyAccepted ? "yes" : "no", ...botFields() }),
  });
}

// 2026-11-14 (privacy): deleting my account (waits for the admin), messages to the site's operator.
export const getDeletionState = (id) => apiRequest(`/api/learn/profiles/${id}/delete-request`);
export const requestDeletion = (id, password) =>
  apiRequest(`/api/learn/profiles/${id}/delete-request`, { method: "POST", body: JSON.stringify({ password }) });
export const cancelDeletion = (id) => apiRequest(`/api/learn/profiles/${id}/delete-request/cancel`, { method: "POST" });
export const sendContact = ({ kind, name, reply, text }) =>
  apiRequest("/api/learn/auth/contact", { method: "POST", body: JSON.stringify({ kind, name, reply, text, ...botFields() }) });
export const adminPrivacy = () => apiRequest("/api/learn/admin/privacy");
export const adminErase = (id) => apiRequest(`/api/learn/admin/profiles/${id}/erase`, { method: "POST" });
export const adminKeep = (id) => apiRequest(`/api/learn/admin/profiles/${id}/keep`, { method: "POST" });
export const adminMessageDone = (id, done) =>
  apiRequest(`/api/learn/admin/messages/${id}/done`, { method: "POST", body: JSON.stringify({ done }) });

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
  return apiRequest(`/api/learn/profiles/${profileId}/isles/${isleKey}/sessions`, { method: "POST", body: JSON.stringify(withRoundKey(payload)) });
}

export function getStageMap(profileId, topic) {
  return apiRequest(`/api/learn/profiles/${profileId}/map?topic=${topic}`);
}

export function getQuestions({ profileId, topic, stage, count = 10, secure = false, tier = 0, foundation = null }) {
  const params = new URLSearchParams({ profileId, topic, stage, count, ...(secure ? { secure: "true" } : {}), ...(tier ? { tier } : {}),
    ...(foundation ? { foundation } : {}) });
  return apiRequest(`/api/learn/questions?${params.toString()}`);
}

// 2026-11-26 (stuck "בודקים את התשובות"): a slow save is sent again - one key per round (the same
// answers list on every try) lets the server save it once (RoundOnce).
const roundKeys = new WeakMap();
function withRoundKey(payload) {
  if (payload.roundKey || !Array.isArray(payload.answers)) return payload;
  let key = roundKeys.get(payload.answers);
  if (!key) {
    key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    roundKeys.set(payload.answers, key);
  }
  return { ...payload, roundKey: key };
}

export function submitSession(payload) {
  return apiRequest("/api/learn/sessions", {
    method: "POST",
    body: JSON.stringify(withRoundKey(payload)),
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
    // 2026-11-14: no voice on the server (the public site) - the words for the browser's own voice
    if (r.status === 204) {
      const words = r.headers.get("X-Spoken");
      return words ? "speech:" + decodeURIComponent(words) : null;
    }
    if (r.status !== 200) return null;
    return URL.createObjectURL(await r.blob());
  } catch {
    return null;
  }
}

export function getMistakes(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/mistakes`);
}

// 2026-11-27 (idea #5 - mistakes island): all open mistakes + cleaning one
export function getAllMistakes(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/mistakes/all`);
}
export function cleanMistake(mistakeId, profileId) {
  return apiRequest(`/api/learn/mistakes/${mistakeId}/clean?profileId=${profileId}`, { method: "POST" });
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

// 2026-11-27 (idea #6): badges + collection
export function getBadges(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/badges`);
}
export function newBadges(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/badges/new`);
}
export function markBadgesSeen(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/badges/seen`, { method: "POST", body: "{}" });
}

// 2026-11-27 (idea #10): a prize from the teacher
export function staffGiveAward(body) {
  return apiRequest("/api/learn/staff/awards", { method: "POST", body: JSON.stringify(body) });
}
export function myNewAwards(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/awards`);
}
export function markAwardsSeen(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/awards/seen`, { method: "POST", body: "{}" });
}

// 2026-11-26 (idea #9): the read-only link for parents
export function staffParentLink(childId) {
  return apiRequest(`/api/learn/staff/children/${childId}/parent-link`);
}
export function staffMakeParentLink(childId) {
  return apiRequest(`/api/learn/staff/children/${childId}/parent-link`, { method: "POST" });
}
export function staffCancelParentLink(childId) {
  return apiRequest(`/api/learn/staff/children/${childId}/parent-link`, { method: "DELETE" });
}
export function parentView(code) {
  return apiRequest(`/api/learn/parent-view/${encodeURIComponent(code)}`);
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

/** 2026-11-21: open a topic at a higher grade for one child (grade null = back to her own grade). */
export function staffSetChallenge(childId, topic, grade) {
  return apiRequest(`/api/learn/staff/children/${childId}/challenge`, {
    method: "POST",
    body: JSON.stringify({ topic, grade: grade ?? "" }),
  });
}

export function staffCancelAssignment(id) {
  return apiRequest(`/api/learn/staff/assignments/${id}/cancel`, { method: "POST" });
}

// ---- the class building (idea #6, 2026-11-12) ----

/** The child's class building this week ({} when the child has no class). */
export function getClassBuilding(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/class-building`);
}

/** 2026-11-14: the class's 3D island + the league of classes. */
export const getClassIsland = (profileId) => apiRequest(`/api/learn/profiles/${profileId}/class-island`);
export const staffClassIsland = (classId) => apiRequest(`/api/learn/staff/classes/${classId}/island`);

/** 2026-11-14 (A5): coins from my island to my class's building (2 coins = 1 brick, 20 a week). */
export function donateToBuilding(profileId, coins) {
  return apiRequest(`/api/learn/profiles/${profileId}/class-building/donate`, { method: "POST", body: JSON.stringify({ coins }) });
}

export function staffClassBuilding(classId) {
  return apiRequest(`/api/learn/staff/classes/${classId}/building`);
}

// ---- the live game room (2026-11-12) ----

export function roomCreate({ classId, topics, minutes, grade, coins = false, teams = false }) {
  return apiRequest("/api/learn/rooms", { method: "POST", body: JSON.stringify({ classId, topics, minutes, grade, coins, teams }) });
}
// 2026-11-22: saved rooms (#10) + waking the server's question code up before a lesson
export const roomTemplates = () => apiRequest("/api/learn/rooms/templates");
export const saveRoomTemplate = (t) => apiRequest("/api/learn/rooms/templates", { method: "POST", body: JSON.stringify(t) });
export const deleteRoomTemplate = (id) => apiRequest(`/api/learn/rooms/templates/${id}/delete`, { method: "POST" });
export const openRoomTemplate = (id) => apiRequest(`/api/learn/rooms/templates/${id}/open`, { method: "POST" });
export const roomWarmup = (grade) => apiRequest("/api/learn/rooms/warmup", { method: "POST", body: JSON.stringify({ grade }) });
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

/** 2026-11-15: log out - the device token stops working on the server too (the password is needed again). */
export const logoutRequest = () => apiRequest("/api/learn/auth/logout", { method: "POST", body: "{}" });

// 2026-11-21 (Shir chose): the teacher's "what to teach tomorrow" + Meitzav readiness for a class
export function staffTomorrow(classId) {
  return apiRequest(`/api/learn/staff/classes/${classId}/tomorrow`);
}
/** 2026-11-22: the class's week (who practised, who improved, what is hard). */
export function staffWeekly(classId) {
  return apiRequest(`/api/learn/staff/classes/${classId}/weekly`);
}
export function staffMeitzav(classId) {
  return apiRequest(`/api/learn/staff/classes/${classId}/meitzav`);
}

// 2026-11-21 (finding the gap): the base skill to build now ({} = none) + calm mode set by staff
export function getFoundation(profileId) {
  return apiRequest(`/api/learn/profiles/${profileId}/foundation`);
}

export function staffSetCalm(childId, calm) {
  return apiRequest(`/api/learn/staff/children/${childId}/calm`, { method: "POST", body: JSON.stringify({ calm }) });
}
