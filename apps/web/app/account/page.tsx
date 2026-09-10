"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }
    void Promise.all([
      supabase.auth.getUser(),
      fetch("/api/me").then(
        (response) =>
          response.json() as Promise<{
            profile?: {
              email?: string;
              username?: string | null;
              display_name?: string | null;
            } | null;
          }>,
      ),
    ])
      .then(([authResult, profileResult]) => {
        if (!authResult.data.user) {
          router.push("/login");
          return;
        }
        setEmail(
          profileResult.profile?.email ?? authResult.data.user.email ?? "",
        );
        setUsername(profileResult.profile?.username ?? "");
        setDisplayName(profileResult.profile?.display_name ?? "");
      })
      .catch(() => {
        setMessage("Unable to load your account.");
      });
  }, [router]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim() || null,
        username: username.trim() || null,
      }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(
      response.ok
        ? "Details saved."
        : (result.error ?? "Unable to save details."),
    );
    setSaving(false);
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "Delete your account and all saved preferences? This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    setMessage("");
    const response = await fetch("/api/me", { method: "DELETE" });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Unable to delete account.");
      setDeleting(false);
      return;
    }
    router.push("/");
  }

  return (
    <main className="shell account-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          paradict<span>.</span>
        </Link>
        <Link className="back-link" href="/">
          Back to dictionary
        </Link>
      </header>
      <section className="account-content">
        <div className="account-heading">
          <p className="eyebrow">Account details</p>
          <h1>Your account</h1>
          <p>Manage the details connected to your dictionary preferences.</p>
        </div>
        <form className="account-form" onSubmit={saveProfile}>
          <label>
            Email
            <input value={email} readOnly />
          </label>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
              autoComplete="name"
              placeholder="Add a display name"
            />
          </label>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={30}
              pattern="[a-zA-Z0-9_]{3,30}"
              placeholder="your_name"
            />
          </label>
          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}
          <button className="auth-submit" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save details"}
          </button>
        </form>
        <div className="account-danger">
          <div>
            <p className="eyebrow">Danger zone</p>
            <p>Delete your account and sign out of Paradict.</p>
          </div>
          <button
            className="danger-button"
            type="button"
            onClick={() => void deleteAccount()}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </section>
    </main>
  );
}
