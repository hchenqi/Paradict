"use client";

import Link from "next/link";
import { supabase } from "@/lib/client";
import { useUserProfile } from "./AuthProvider";

export default function () {
  const { userProfile } = useUserProfile();

  return !userProfile ? (
    <span className="auth-actions">
      <Link className="auth-link" href="/login">Sign in</Link>
      <Link className="auth-link auth-signup" href="/login?mode=signup">Sign up</Link>
    </span>
  ) : (
    <span className="auth-user">
      <Link href="/account">{userProfile.username}</Link>
      <button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </span>
  );
}
