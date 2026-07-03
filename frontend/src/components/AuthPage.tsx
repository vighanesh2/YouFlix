import { FormEvent, useState } from "react";
import { checkEmail } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import styles from "./AuthPage.module.css";

type Step = "email" | "signin" | "signup";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const { login, register } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleEmailStep(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const exists = await checkEmail(email.trim());
      setStep(exists ? "signin" : "signup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCredentialsStep(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (step === "signin") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim() || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  function resetToEmail() {
    setStep("email");
    setPassword("");
    setName("");
    setError(null);
  }

  const heading =
    step === "email"
      ? "Enter your info to sign in"
      : step === "signin"
        ? "Welcome back"
        : "Create your account";

  const subtext =
    step === "email"
      ? "Or get started with a new account."
      : step === "signin"
        ? "Enter your password to continue."
        : "Set a password to finish signing up.";

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />

      <header className={styles.header}>
        <span className={styles.logo}>YOUFLIX</span>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>{heading}</h1>
          <p className={styles.subtitle}>{subtext}</p>

          {step === "email" ? (
            <form className={styles.form} onSubmit={handleEmailStep} noValidate>
              <input
                type="email"
                className={styles.input}
                placeholder="Email or mobile number"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="email"
                autoFocus
                disabled={busy}
              />

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={styles.submit}
                disabled={busy || !email.trim()}
              >
                {busy ? "Checking…" : "Continue"}
              </button>
            </form>
          ) : (
            <form
              className={styles.form}
              onSubmit={handleCredentialsStep}
              noValidate
            >
              <div className={styles.emailChip}>
                <span>{email}</span>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={resetToEmail}
                  disabled={busy}
                >
                  Edit
                </button>
              </div>

              {step === "signup" && (
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  disabled={busy}
                />
              )}

              <input
                type="password"
                className={styles.input}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete={
                  step === "signin" ? "current-password" : "new-password"
                }
                autoFocus
                disabled={busy}
              />

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={styles.submit}
                disabled={busy || !password}
              >
                {busy
                  ? "Please wait…"
                  : step === "signin"
                    ? "Sign In"
                    : "Sign Up"}
              </button>
            </form>
          )}

          <button type="button" className={styles.help}>
            Get Help
            <span className={styles.chevron}>⌄</span>
          </button>

          <p className={styles.recaptcha}>
            This page is protected by Google reCAPTCHA to ensure you're not a bot.
          </p>
        </div>
      </main>
    </div>
  );
}
