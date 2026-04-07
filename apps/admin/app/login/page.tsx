"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!auth) {
        throw new Error("Firebase client is not initialized");
      }

      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to create session");
      }

      router.replace("/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <main className="center-page login-page">
      <section className="login-shell">
        <div className="login-shell-head">
          <div className="login-shell-logo">
            <Image src="/bh-logo.png" alt="Bahaa Films" width={56} height={56} />
          </div>
          <div className="login-shell-brand">
            <p className="login-shell-name">Bahaa Films</p>
            <p className="login-shell-role">Administration</p>
          </div>
        </div>

        <div className="card login-card">
          <div className="login-copy">
            <h1 className="card-title login-title">Welcome Back</h1>
            <p className="muted login-muted">Sign in to manage projects and publishing.</p>
          </div>

          <form className="form-grid login-form" onSubmit={submit}>
            <div className="field-group">
              <label className="field-label" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="admin-password">
                Password
              </label>
              <div className="password-field-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.7a3 3 0 0 0 3.6 3.6" />
                      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-4 4.7" />
                      <path d="M6 6.3A18 18 0 0 0 2 12s4 7 10 7a10.8 10.8 0 0 0 2.1-.2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <span className="button-loading-content">
                  <span className="button-spinner" aria-hidden="true" />
                  <span>Signing in</span>
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
