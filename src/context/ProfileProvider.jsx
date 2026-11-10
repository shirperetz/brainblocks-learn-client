import { useEffect, useState } from "react";
import * as learnApi from "../services/learnApi";
import { ProfileContext, PROFILE_STORAGE_KEY } from "./profileStore";

/**
 * Holds the active child profile. Only the profile *id* lives in localStorage;
 * the real data (grade, points, progress...) is fetched from the backend so it
 * stays in sync across refreshes and powers the parent dashboard.
 */
export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  // Start in "loading" only if there is a saved profile to fetch.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(PROFILE_STORAGE_KEY)));

  // Restore the saved profile on first load.
  useEffect(() => {
    const savedId = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!savedId) return;
    learnApi
      .getProfile(savedId)
      .then(setProfile)
      .catch(() => localStorage.removeItem(PROFILE_STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  // grade/difficulty (optional): the grade is chosen BEFORE the profile exists (grade-first onboarding),
  // so it is saved here by the new id - patchProfile can't, its `profile` is still the old (null) one.
  async function createProfile({ name, avatar, grade, difficulty }) {
    let created = await learnApi.createProfile({ name, avatar });
    if (grade) created = await learnApi.updateProfile(created.id, { grade, difficulty: difficulty ?? "MEDIUM" });
    localStorage.setItem(PROFILE_STORAGE_KEY, String(created.id));
    setProfile(created);
    return created;
  }

  async function patchProfile(changes) {
    if (!profile) return null;
    const updated = await learnApi.updateProfile(profile.id, changes);
    setProfile(updated);
    return updated;
  }

  async function refreshProfile() {
    if (!profile) return null;
    const fresh = await learnApi.getProfile(profile.id);
    setProfile(fresh);
    return fresh;
  }

  function resetProfile() {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    setProfile(null);
  }

  const value = {
    profile,
    loading,
    hasProfile: Boolean(profile),
    createProfile,
    patchProfile,
    refreshProfile,
    resetProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
