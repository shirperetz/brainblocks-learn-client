// 2026-11-14 (Shir: "another password or my fingerprint" for the admin on the public site): the browser
// side of a passkey. The fingerprint / face / PIN stays on her device; the server gets only the public
// key once (when she adds it) and a signature each time she logs in.
import { apiRequest } from "./apiClient";

const enc = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const dec = (s) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

export const passkeysSupported = () =>
  typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;

/** The second step of the admin's log-in: her fingerprint on this device -> { token, profile }. */
export async function loginWithPasskey(step) {
  const cred = await navigator.credentials.get({
    publicKey: {
      challenge: dec(step.challenge),
      rpId: step.rpId,
      allowCredentials: step.passkeys.map((id) => ({ type: "public-key", id: dec(id) })),
      userVerification: "required",
      timeout: 60000,
    },
  });
  return apiRequest("/api/learn/auth/second/passkey", {
    method: "POST",
    body: JSON.stringify({
      ticket: step.ticket,
      id: enc(cred.rawId),
      clientData: enc(cred.response.clientDataJSON),
      authData: enc(cred.response.authenticatorData),
      signature: enc(cred.response.signature),
    }),
  });
}

export const loginWithCode = (step, code) =>
  apiRequest("/api/learn/auth/second/code", { method: "POST", body: JSON.stringify({ ticket: step.ticket, code }) });

export const securityState = () => apiRequest("/api/learn/admin/security");
export const removePasskey = (id) => apiRequest(`/api/learn/admin/security/passkeys/${id}`, { method: "DELETE" });
export const newBackupCodes = (password) =>
  apiRequest("/api/learn/admin/security/codes", { method: "POST", body: JSON.stringify({ password }) });

/** Adds this device's fingerprint / face / PIN to the admin account. */
export async function addPasskey(name) {
  const o = await apiRequest("/api/learn/admin/security/passkey-options", { method: "POST", body: "{}" });
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: dec(o.challenge),
      rp: { id: o.rpId, name: "עולם החשבון" },
      user: { id: dec(o.userId), name: "מנהלת", displayName: "מנהלת" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      excludeCredentials: o.exclude.map((id) => ({ type: "public-key", id: dec(id) })),
      authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
      attestation: "none",
      timeout: 60000,
    },
  });
  const r = cred.response;
  if (typeof r.getPublicKey !== "function" || !r.getPublicKey()) {
    throw new Error("הדפדפן הזה ישן מדי לטביעת אצבע. נסי בכרום או בספארי מעודכנים");
  }
  return apiRequest("/api/learn/admin/security/passkeys", {
    method: "POST",
    body: JSON.stringify({
      id: enc(cred.rawId),
      publicKey: enc(r.getPublicKey()),
      alg: r.getPublicKeyAlgorithm(),
      authData: enc(r.getAuthenticatorData()),
      clientData: enc(r.clientDataJSON),
      name,
    }),
  });
}
