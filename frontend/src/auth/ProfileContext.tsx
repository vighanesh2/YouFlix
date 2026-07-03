import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Profile } from "../api/profiles";

const PROFILE_KEY = "youflix_profile";

interface ProfileContextValue {
  profile: Profile | null;
  selectProfile: (profile: Profile) => void;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

function loadStoredProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(loadStoredProfile);

  const selectProfile = useCallback((next: Profile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ profile, selectProfile, clearProfile }),
    [profile, selectProfile, clearProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
