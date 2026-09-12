"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/client";

export default function () {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
    const error = params.get("error");
    if (error) setMessage(error);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Add the Supabase values to apps/web/.env.local first.");
      setBusy(false);
      return;
    }

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: { username: username.trim().toLowerCase() },
            },
          });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session)
      setMessage("Check your email to confirm your account.");
    else router.push("/");
    setBusy(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="brand" href="/">
          paradict<span>.</span>
        </Link>
        <p className="eyebrow">Your multilingual dictionary</p>
        <h1>{mode === "login" ? "Welcome back." : "Join Paradict."}</h1>
        <p className="auth-lede">
          {mode === "login"
            ? "Sign in to keep your language preferences with you."
            : "Create an account to sync your language preferences."}
        </p>
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          {mode === "signup" && (
            <label>
              Username
              <input
                value={username}
                onChange={event => setUsername(event.target.value)}
                required
                minLength={6}
                maxLength={30}
                pattern="[a-z0-9_]{6,30}"
                autoComplete="username"
              />
            </label>
          )}
          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy
              ? "Working..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </button>
        <Link className="back-link auth-back" href="/">
          ← Back to dictionary
        </Link>
      </div>
    </main>
  );
}
