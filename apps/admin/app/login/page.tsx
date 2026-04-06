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
              <input
                id="admin-password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
