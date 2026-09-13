"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/client";

export default function () {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">(searchParams.get("mode") === "signup" ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(searchParams.get("error") ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { data, error } = mode === "login" ?
      await supabase.auth.signInWithPassword({ email, password }) :
      await supabase.auth.signUp({
        email, password, options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username: username.trim().toLowerCase() },
        }
      });
    if (error) {
      setMessage(error.message);
    } else if (mode === "signup" && !data.session) {
      setMessage("Check your email to confirm your account.");
    } else {
      router.replace("/");
    }
    setBusy(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="brand" href="/">paradict<span>.</span></Link>
        <p className="eyebrow">Your multilingual dictionary</p>
        <h1>{mode === "login" ? "Welcome back." : "Join Paradict Community."}</h1>
        <p className="auth-lede">{mode === "login" ? "Sign in to your account." : "Create an account."}</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {mode === "signup" && (<label>Username<input value={username} onChange={event => setUsername(event.target.value)} required minLength={6} maxLength={30} pattern="[a-z0-9_]{6,30}" autoComplete="username" /></label>)}
          {message && (<p className="auth-message" role="status">{message}</p>)}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Processing..." : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }} >
          {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>
        <Link className="back-link auth-back" href="/">← Back to dictionary</Link>
      </div>
    </main>
  );
}
