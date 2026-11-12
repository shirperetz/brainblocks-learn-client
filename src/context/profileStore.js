import { createContext, useContext } from "react";

// Context object + consumer hook live here (no component export) so the provider
// file can stay component-only and play nicely with React Fast Refresh.

export const PROFILE_STORAGE_KEY = "lc_profile_id";

export const ProfileContext = createContext(null);

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used inside a ProfileProvider");
  }
  return ctx;
}

/**
 * 2026-11-12 (Shir: "after the 30-minute logout it sends me to the exercises"): the username that last
 * logged in on this device (never the password). After a logout the home screen offers "כניסה" first,
 * with this name filled in - "אני חדש/ה" (a whole new child: grade -> character -> exercises) becomes
 * the small option, so a returning child doesn't start over as someone new by mistake.
 */
export const LAST_USER_KEY = "lc_last_username";

export function lastUsername() {
  try {
    return localStorage.getItem(LAST_USER_KEY) || "";
  } catch {
    return "";
  }
}

export function rememberUsername(name) {
  try {
    if (name) localStorage.setItem(LAST_USER_KEY, name);
  } catch {
    /* private mode - fine */
  }
}
