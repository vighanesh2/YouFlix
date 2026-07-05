import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useProfile } from "../auth/ProfileContext";
import ProfileAvatar from "./ProfileAvatar";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, clearProfile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.name ?? user?.name ?? user?.email ?? "Profile";

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function handleSignOut() {
    setMenuOpen(false);
    clearProfile();
    logout();
  }

  function goToProfiles() {
    setMenuOpen(false);
    navigate("/profiles");
  }

  return (
    <header className={styles.header}>
      <div className={styles.left} ref={menuRef}>
        <button
          type="button"
          className={styles.profileTrigger}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {profile ? (
            <ProfileAvatar name={profile.name} color={profile.color} size="sm" />
          ) : (
            <span className={styles.avatarFallback}>?</span>
          )}
          <span className={styles.profileName}>{displayName}</span>
          <span className={`${styles.caret} ${menuOpen ? styles.caretOpen : ""}`}>
            ▾
          </span>
        </button>

        {menuOpen && (
          <div className={styles.dropdown}>
            {profile && (
              <button
                type="button"
                className={styles.dropdownProfile}
                onClick={goToProfiles}
              >
                <ProfileAvatar
                  name={profile.name}
                  color={profile.color}
                  size="sm"
                />
                <span>{profile.name}</span>
              </button>
            )}

            <button
              type="button"
              className={styles.dropdownItem}
              onClick={goToProfiles}
            >
              Manage Profiles
            </button>

            <hr className={styles.divider} />

            <button type="button" className={styles.dropdownItem}>
              Account
            </button>
            <button type="button" className={styles.dropdownItem}>
              Help Centre
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={handleSignOut}
            >
              Sign out of YouFlix
            </button>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            `${styles.searchBtn} ${isActive ? styles.searchBtnActive : ""}`
          }
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
            />
          </svg>
        </NavLink>
        <NavLink to="/" className={`${styles.navLink} ${styles.navHome}`} end>
          Home
        </NavLink>
        <NavLink to="/movies" className={`${styles.navLink} ${styles.navLinkSecondary}`}>
          Movies
        </NavLink>
        <NavLink
          to="/import"
          className={({ isActive }) =>
            `${styles.pill} ${isActive ? styles.pillActive : ""}`
          }
        >
          My Netflix
        </NavLink>
      </nav>

      <NavLink to="/" className={styles.logo}>
        YOUFLIX
      </NavLink>
    </header>
  );
}
