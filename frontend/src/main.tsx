import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { ProfileProvider } from "./auth/ProfileContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </AuthProvider>
  </StrictMode>
);
