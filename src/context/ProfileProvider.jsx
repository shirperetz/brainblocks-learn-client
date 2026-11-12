import { useEffect, useState } from "react";
import * as learnApi from "../services/learnApi";
import { TOKEN_STORAGE_KEY } from "../services/apiClient";
import { ProfileContext, PROFILE_STORAGE_KEY, rememberUsername } from "./profileStore";

/**
 * Holds the logged-in child (2026-11-11: children's accounts). The device keeps only the profile
 * *id* and the login token in localStorage, so the child stays logged in on this device; the real
 * data (grade, points, progress...) lives on the server under the child's username, so it is the
 * same on any device they log in from.
 */
function stored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(id, token) {
  try {
    if (id == null) {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      localStorage.setItem(PROFILE_STORAGE_KEY, String(id));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // private window / blocked storage: still logged in until the page closes
  }
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  // Start in "loading" only if this device has a saved login to restore.
  const [loading, setLoading] = useState(() => Boolean(stored(PROFILE_STORAGE_KEY) && stored(TOKEN_STORAGE_KEY)));

  // Restore the saved login on first load.
  useEffect(() => {
    const savedId = stored(PROFILE_STORAGE_KEY);
    if (!savedId || !stored(TOKEN_STORAGE_KEY)) {
      store(null);
      return;
    }
    // 2026-11-11 (found by the kid bot): ANY failure here used to erase the saved login - a moment
    // without network, or switching pages while it loaded, logged the child out. Now only the server
    // saying "not valid" (401/404) erases it; no answer at all is tried again a few times.
    let alive = true;
    (async () => {
      for (let attempt = 0; attempt < 4 && alive; attempt++) {
        try {
          const p = await learnApi.getProfile(savedId);
          if (alive) setProfile(p);
          break;
        } catch (e) {
          if (e.status === 401 || e.status === 404) {
            store(null);
            break;
          }
          if (!e.network && !(e.status >= 500)) break;
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  function signedIn({ token, profile: p }) {
    store(p.id, token);
    rememberUsername(p.username);
    setProfile(p);
    return p;
  }

  /** A new child: grade (chosen first), character, name, username and password. */
  // 2026-11-11: a new sign-up waits for the admin's approval - no token yet, so nothing is stored
  // and the child is not logged in; returns { pending: true }.
  async function createProfile({ name, avatar, grade, difficulty, username, password, joinCode }) {
    const r = await learnApi.register({ joinCode, username, password, name, avatar, grade, difficulty: difficulty ?? "MEDIUM" });
    if (!r.token) return { pending: true, profile: r.profile };
    return signedIn(r);
  }

  /** A child who already has a username - on any device. */
  async function loginProfile({ username, password }) {
    return signedIn(await learnApi.login({ username, password }));
  }

  async function patchProfile(changes) {
    if (!profile) return null;
    const updated = await learnApi.updateProfile(profile.id, changes);
    setProfile(updated);
    return updated;
  }

  /** 2026-11-11 (settings): new password with the current one; this device keeps working (new token). */
  async function changePassword(current, password) {
    return signedIn(await learnApi.changeOwnPassword(profile.id, current, password));
  }

  async function refreshProfile() {
    if (!profile) return null;
    const fresh = await learnApi.getProfile(profile.id);
    setProfile(fresh);
    return fresh;
  }

  /** Log out on this device (the progress stays on the server). */
  function resetProfile() {
    store(null);
    setProfile(null);
  }

  const value = {
    profile,
    loading,
    hasProfile: Boolean(profile),
    createProfile,
    loginProfile,
    patchProfile,
    refreshProfile,
    changePassword,
    resetProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
