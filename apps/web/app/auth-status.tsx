"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setEmail(session?.user.email ?? null),
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  if (!getSupabaseBrowserClient())
    return (
      <span className="auth-actions">
        <Link className="auth-link" href="/login">
          Sign in
        </Link>
        <Link className="auth-link auth-signup" href="/login?mode=signup">
          Sign up
        </Link>
      </span>
    );
  if (!email)
    return (
      <span className="auth-actions">
        <Link className="auth-link" href="/login">
          Sign in
        </Link>
        <Link className="auth-link auth-signup" href="/login?mode=signup">
          Sign up
        </Link>
      </span>
    );
  return (
    <span className="auth-user">
      <Link href="/account">{email}</Link>
      <button
        type="button"
        onClick={() => void getSupabaseBrowserClient()?.auth.signOut()}
      >
        Sign out
      </button>
    </span>
  );
}
