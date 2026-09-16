"use client";

import Link from "next/link";
import { supabase } from "@/lib/client";
import { useUserProfile } from "./AuthProvider";
import "./AuthStatus.css"

export default function () {
  const { userProfile } = useUserProfile();

  return !userProfile ? (
    <>
      <Link href="/login">Sign in</Link>
      <Link className="signup" href="/login?mode=signup">Sign up</Link>
    </>
  ) : (
    <>
      <Link href="/account">{userProfile.username}</Link>
      <button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </>
  );
}
