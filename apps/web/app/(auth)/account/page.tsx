"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserProfile } from "@/app/AuthProvider";
import { supabase } from "@/lib/client";
import { UserProfile } from "@/lib/types";
import "./page.css";

function UserDetails({ userProfile, setUserProfile }: { userProfile: UserProfile; setUserProfile: (userProfile: UserProfile) => void }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUsername(userProfile.username);
    setDisplayName(userProfile.display_name ?? "");
  }, [userProfile]);

  async function saveProfile(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const patch = { username: username.trim().toLowerCase(), display_name: displayName.trim() || null };
    const { error } = await supabase.from("users").update(patch).eq("id", userProfile.id);
    if (!error) {
      setUserProfile({ ...userProfile, ...patch });
      setMessage("Details saved.");
    } else {
      setMessage("Unable to save details.");
    }
    setSaving(false);
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    const { error } = await supabase.rpc("delete_own_user");
    if (error) {
      setMessage("Unable to delete account.");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <>
      <Link className="profile-link" href={`/user/${userProfile.username}`}>View public profile<span aria-hidden="true">→</span></Link>
      <form onSubmit={saveProfile}>
        <label>Email<input value={userProfile.email ?? ""} readOnly /></label>
        <label>Username<input value={username} onChange={event => setUsername(event.target.value)} minLength={6} maxLength={30} pattern="[a-z0-9_]{6,30}" /></label>
        <label>Display name<input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={50} /></label>
        {message && <p role="status">{message}</p>}
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save details"}</button>
      </form>
      <div className="actions" aria-label="Account actions">
        <div>
          <p>Sign out</p>
          <button type="button" className="sign-out" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
        <div>
          <p>Delete your account and sign out</p>
          <button type="button" className="delete" onClick={() => deleteAccount()} disabled={deleting}>{deleting ? "Deleting..." : "Delete account"}</button>
        </div>
      </div>
    </>
  );
}

export default function () {
  const { userProfile, setUserProfile } = useUserProfile();
  return (
    <main className="account">
      <h1>Your account</h1>
      {userProfile && <UserDetails userProfile={userProfile} setUserProfile={setUserProfile} />}
    </main>
  );
}
