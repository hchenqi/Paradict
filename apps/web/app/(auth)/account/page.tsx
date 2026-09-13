"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/app/AuthProvider";
import { supabase } from "@/lib/client";
import { UserProfile } from "@/lib/types";

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
      <form className="account-form" onSubmit={saveProfile}>
        <label>Email<input value={userProfile.email ?? ""} readOnly /></label>
        <label>Username<input value={username} onChange={event => setUsername(event.target.value)} minLength={6} maxLength={30} pattern="[a-z0-9_]{6,30}" /></label>
        <label>Display name<input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={50} /></label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Saving..." : "Save details"}</button>
      </form>
      <div className="account-danger"><p>Delete your account and sign out.</p><button className="danger-button" type="button" onClick={() => deleteAccount()} disabled={deleting}>{deleting ? "Deleting..." : "Delete account"}</button></div>
    </>
  );
}

export default function () {
  const { userProfile, setUserProfile } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!userProfile) {
      router.replace("/login");
    }
  }, [router, userProfile]);

  return (
    <section className="account-content">
      <div className="account-heading">
        <p className="eyebrow">Account details</p>
        <h1>Your account</h1>
      </div>
      {userProfile && <UserDetails userProfile={userProfile} setUserProfile={setUserProfile} />}
    </section>
  );
}
