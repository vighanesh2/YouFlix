import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import PlaylistView from "./components/PlaylistView";
import { useAuth } from "./auth/AuthContext";
import { useProfile } from "./auth/ProfileContext";
import HomePage from "./pages/HomePage";
import MyNetflixPage from "./pages/MyNetflixPage";
import ProfileSelectPage from "./pages/ProfileSelectPage";
import styles from "./App.module.css";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.heroBg} aria-hidden />
        <main className={styles.main}>
          <p className={styles.subtitle}>Loading…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
}

function ProfileGate({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();

  if (!profile) {
    return <Navigate to="/profiles" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/profiles"
          element={
            <AuthGate>
              <ProfileSelectPage />
            </AuthGate>
          }
        />
        <Route
          path="/"
          element={
            <AuthGate>
              <ProfileGate>
                <HomePage />
              </ProfileGate>
            </AuthGate>
          }
        />
        <Route
          path="/import"
          element={
            <AuthGate>
              <ProfileGate>
                <MyNetflixPage />
              </ProfileGate>
            </AuthGate>
          }
        />
        <Route
          path="/show/:playlistId"
          element={
            <AuthGate>
              <ProfileGate>
                <PlaylistView />
              </ProfileGate>
            </AuthGate>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
