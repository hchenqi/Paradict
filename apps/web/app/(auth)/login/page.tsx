"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/client";
import { useUserProfile } from "@/app/AuthProvider";
import "./page.css";

function SearchParamsWatcher({ setMode, setRedirect, setMessage }: { setMode: (mode: "login" | "signup") => void, setRedirect: (redirect: string) => void; setMessage: (message: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    setMode(searchParams.get("mode") === "signup" ? "signup" : "login");
    setRedirect(searchParams.get("redirect") ?? "");
    setMessage(searchParams.get("error") ?? "");
  }, [searchParams]);
  return null;
}

export default function () {
  const { userProfile } = useUserProfile();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [redirect, setRedirect] = useState<string>("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === "signup") {
      setPrivacyAcknowledged(false);
    }
  }, [mode]);

  useEffect(() => {
    if (userProfile) {
      router.replace(redirect || "/");
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
    if (!error) {
      if (mode === "signup" && !data.session) {
        setMessage("Check your email to confirm your account.");
      }
    } else {
      setMessage(error.message);
    }
    setBusy(false);
  }

  return (
    <main className="login">
      <Suspense><SearchParamsWatcher setMode={setMode} setRedirect={setRedirect} setMessage={setMessage} /></Suspense>
      <h1>{mode === "login" ? "Welcome back" : "Join as a member"}</h1>
      <form onSubmit={submit}>
        <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></label>
        <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {mode === "signup" && (<label>Username<input value={username} onChange={event => setUsername(event.target.value)} required minLength={6} maxLength={30} pattern="[a-z0-9_]{6,30}" autoComplete="username" /></label>)}
        {mode === "signup" && (<label className="agreement"><input type="checkbox" checked={privacyAcknowledged} onChange={event => setPrivacyAcknowledged(event.target.checked)} required /><span>I have read the{" "}<Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span></label>)}
        {message && (<p role="status">{message}</p>)}
        <button type="submit" disabled={busy || (mode === "signup" && !privacyAcknowledged)}>{busy ? "Submitting..." : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <button className="switch" type="button" onClick={() => {
        const params = new URLSearchParams();
        mode === "login" && params.append("mode", "signup");
        redirect && params.append("redirect", redirect);
        router.replace(`/login?${params}`);
      }} >
        {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
      </button>
      <Link className="back" href="/">← Back to dictionary</Link>
    </main>
  );
}
