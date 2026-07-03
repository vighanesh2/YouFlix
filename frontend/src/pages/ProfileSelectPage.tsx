import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PROFILE_COLORS,
  createProfile,
  listProfiles,
  type Profile,
} from "../api/profiles";
import { useProfile } from "../auth/ProfileContext";
import ProfileAvatar from "../components/ProfileAvatar";
import styles from "./ProfileSelectPage.module.css";

export default function ProfileSelectPage() {
  const navigate = useNavigate();
  const { selectProfile } = useProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(PROFILE_COLORS[1]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listProfiles();
        if (!cancelled) setProfiles(data.profiles);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profiles");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(profile: Profile) {
    selectProfile(profile);
    navigate("/");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setSubmitting(true);
    setError(null);

    try {
      const { profile } = await createProfile(name, newColor);
      setProfiles((prev) => [...prev, profile]);
      setCreating(false);
      setNewName("");
      selectProfile(profile);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  }

  const canAddMore = profiles.length < 5;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>YOUFLIX</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Who&apos;s watching?</h1>

        {loading && <p className={styles.status}>Loading profiles…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && (
          <div className={styles.grid}>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={styles.profileBtn}
                onClick={() => handleSelect(profile)}
              >
                <ProfileAvatar
                  name={profile.name}
                  color={profile.color}
                  size="lg"
                />
                <span className={styles.profileName}>{profile.name}</span>
              </button>
            ))}

            {canAddMore && !creating && (
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => setCreating(true)}
              >
                <span className={styles.addIcon}>+</span>
                <span className={styles.profileName}>Add Profile</span>
              </button>
            )}
          </div>
        )}

        {creating && (
          <form className={styles.createForm} onSubmit={handleCreate}>
            <h2 className={styles.createTitle}>Add Profile</h2>
            <div className={styles.previewWrap}>
              <ProfileAvatar
                name={newName || "Preview"}
                color={newColor}
                size="md"
              />
            </div>
            <input
              className={styles.input}
              placeholder="Profile name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <div className={styles.colorRow}>
              {PROFILE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorSwatch} ${
                    newColor === color ? styles.colorSelected : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={!newName.trim() || submitting}
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
