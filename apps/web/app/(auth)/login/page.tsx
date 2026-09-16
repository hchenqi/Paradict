"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/client";
import { useUserProfile } from "@/app/AuthProvider";
import "./page.css";

function SearchParamsWatcher({ setMode, setMessage }: { setMode: (mode: "login" | "signup") => void, setMessage: (message: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    setMode(searchParams.get("mode") === "signup" ? "signup" : "login");
    setMessage(searchParams.get("error") ?? "");
  }, [searchParams]);
  return null;
}

export default function () {
  const { userProfile } = useUserProfile();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (userProfile) {
      router.replace("/");
    }
  }, [router, userProfile]);

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
    <main className="login">
      <Suspense><SearchParamsWatcher setMode={setMode} setMessage={setMessage} /></Suspense>
      <h1>{mode === "login" ? "Welcome back" : "Join as a member"}</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></label>
        <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {mode === "signup" && (<label>Username<input value={username} onChange={event => setUsername(event.target.value)} required minLength={6} maxLength={30} pattern="[a-z0-9_]{6,30}" autoComplete="username" /></label>)}
        {message && (<p role="status">{message}</p>)}
        <button type="submit" disabled={busy}>{busy ? "Submitting..." : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <button className="switch" type="button" onClick={() => { router.replace(`/login${mode === "login" ? "?mode=signup" : ""}`); }} >
        {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
      <Link className="back" href="/">← Back to dictionary</Link>
    </main>
  );
}
