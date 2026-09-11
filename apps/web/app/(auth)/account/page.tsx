"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/client";

export default function () {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setEmail(user.email ?? "");
      const { data, error } = await supabase
        .from("users")
        .select("username, display_name")
        .eq("id", user.id)
        .single();
      if (error) setMessage("Unable to load your account.");
      else {
        setUsername(data.username);
        setDisplayName(data.display_name ?? "");
      }
    });
  }, [router, supabase]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ display_name: displayName.trim() || null, username: username.trim().toLowerCase() })
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
    setMessage(error ? "Unable to save details." : "Details saved.");
    setSaving(false);
  }

  async function deleteAccount() {
    if (!supabase || !window.confirm("Delete your account and all saved preferences? This cannot be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.rpc("delete_own_user");
    if (error) {
      setMessage("Unable to delete account.");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <section className="account-content">
      <div className="account-heading"><p className="eyebrow">Account details</p><h1>Your account</h1><p>Manage the details connected to your dictionary preferences.</p></div>
      <form className="account-form" onSubmit={saveProfile}>
        <label>Email<input value={email} readOnly /></label>
        <label>Display name<input value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={50} /></label>
        <label>Username<input value={username} onChange={event => setUsername(event.target.value)} minLength={6} maxLength={30} pattern="[a-z0-9_]{6,30}" /></label>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-submit" type="submit" disabled={saving}>{saving ? "Saving..." : "Save details"}</button>
      </form>
      <div className="account-danger"><p>Delete your account and sign out of Paradict.</p><button className="danger-button" type="button" onClick={() => deleteAccount()} disabled={deleting}>{deleting ? "Deleting..." : "Delete account"}</button></div>
    </section>
  );
}
