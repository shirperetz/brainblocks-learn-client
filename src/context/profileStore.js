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
