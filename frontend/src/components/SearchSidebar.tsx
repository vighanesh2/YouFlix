import { NavLink } from "react-router-dom";
import styles from "./SearchSidebar.module.css";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3l9 8v10h-6v-6H9v6H3V11l9-8z"
      />
    </svg>
  );
}

function MoviesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M4 4h16v16H4V4zm2 2v3h3V6H6zm5 0v3h3V6h-3zm5 0v3h3V6h-3zM6 12v3h3v-3H6zm5 0v3h3v-3h-3zm5 0v3h3v-3h-3zM6 17v3h3v-3H6zm5 0v3h3v-3h-3zm5 0v3h3v-3h-3z"
      />
    </svg>
  );
}

function MyListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M12 5v14M5 12h14"
      />
    </svg>
  );
}

export default function SearchSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      <NavLink
        to="/search"
        className={({ isActive }) =>
          `${styles.iconLink} ${isActive ? styles.iconLinkActive : ""}`
        }
        aria-label="Search"
      >
        <SearchIcon />
      </NavLink>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `${styles.iconLink} ${isActive ? styles.iconLinkActive : ""}`
        }
        end
        aria-label="Home"
      >
        <HomeIcon />
      </NavLink>
      <NavLink
        to="/movies"
        className={({ isActive }) =>
          `${styles.iconLink} ${isActive ? styles.iconLinkActive : ""}`
        }
        aria-label="Movies"
      >
        <MoviesIcon />
      </NavLink>
      <NavLink
        to="/import"
        className={({ isActive }) =>
          `${styles.iconLink} ${isActive ? styles.iconLinkActive : ""}`
        }
        aria-label="My Netflix"
      >
        <MyListIcon />
      </NavLink>
    </aside>
  );
}
