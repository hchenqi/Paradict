"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/client";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => setEmail(session?.user.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  return !email ? (
    <span className="auth-actions">
      <Link className="auth-link" href="/login">
        Sign in
      </Link>
      <Link className="auth-link auth-signup" href="/login?mode=signup">
        Sign up
      </Link>
    </span>
  ) : (
    <span className="auth-user">
      <Link href="/account">{email}</Link>
      <button type="button" onClick={() => getSupabaseBrowserClient().auth.signOut()}>
        Sign out
      </button>
    </span>
  );
}
