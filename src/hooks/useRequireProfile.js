import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../context/profileStore";

/**
 * Guards screens that need a profile (grade, topics, map, play...). If none exists
 * once loading finishes, sends the child to the start (the grade).
 * Returns { profile, ready } so the screen can render a loader until ready.
 */
export function useRequireProfile() {
  const { profile, hasProfile, loading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !hasProfile) {
      navigate("/grade", { replace: true });
    }
  }, [loading, hasProfile, navigate]);

  return { profile, ready: !loading && hasProfile };
}
