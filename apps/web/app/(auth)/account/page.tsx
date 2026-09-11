"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/client";

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


import { NextResponse } from "next/server";
import {
  getUserProfile,
  updateUserPreferences,
} from "../../../lib/supabase/dictionary";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET() {
  try {
    return NextResponse.json({ profile: await getUserProfile() });
  } catch (error) {
    console.error("Profile lookup failed", error);
    return NextResponse.json(
      { error: "Profile lookup failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      displayName?: unknown;
      username?: unknown;
      languageIds?: unknown;
    };
    const displayName =
      body.displayName === undefined || body.displayName === null
        ? body.displayName
        : String(body.displayName).trim();
    const username =
      body.username === undefined || body.username === null
        ? body.username
        : String(body.username).trim().toLowerCase();
    const languageIds =
      body.languageIds === undefined
        ? undefined
        : Array.isArray(body.languageIds) &&
            body.languageIds.length <= 20 &&
            body.languageIds.every((id) => Number.isInteger(id) && id > 0)
          ? [...new Set(body.languageIds as number[])]
          : null;
    if (
      languageIds === null ||
      (displayName !== undefined &&
        displayName !== null &&
        typeof displayName !== "string") ||
      (username !== undefined &&
        username !== null &&
        !/^[a-z0-9_]{6,30}$/.test(username))
    ) {
      return NextResponse.json(
        { error: "Invalid profile fields" },
        { status: 400 },
      );
    }
    const profile = await updateUserPreferences({
      displayName,
      username,
      languageIds,
    });
    if (profile === null) return NextResponse.json({ configured: false });
    if (profile === undefined)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json(
      { error: "Profile update failed" },
      { status: 500 },
    );
  }
}

async function getAuthenticatedUser(supabase: ServerSupabaseClient) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    if (error instanceof Error && error.name === "AuthSessionMissingError")
      return null;
    throw error;
  }
}

export async function getUserProfile() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const user = await getAuthenticatedUser(supabase);
  if (!user) return null;
  const { data, error } = await supabase
    .from("users")
    .select("id, role, username, display_name, languages")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserPreferences(preferences: {
  displayName?: string | null;
  username?: string | null;
  languageIds?: number[];
}) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const user = await getAuthenticatedUser(supabase);
  if (!user) return undefined;
  const { data, error } = await supabase
    .from("users")
    .update({
      ...(preferences.displayName !== undefined
        ? { display_name: preferences.displayName }
        : {}),
      ...(preferences.username !== undefined
        ? { username: preferences.username }
        : {}),
      ...(preferences.languageIds !== undefined
        ? { languages: preferences.languageIds }
        : {}),
    })
    .eq("id", user.id)
    .select("id, role, username, display_name, languages")
    .single();
  if (error) throw error;
  return data;
}

export type { DictionaryEntry };

export async function DELETE() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ configured: false });
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError)
    return NextResponse.json(
      { error: "Unable to verify account" },
      { status: 401 },
    );
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    console.error("Account deletion failed", error);
    return NextResponse.json(
      { error: "Account deletion failed" },
      { status: 500 },
    );
  }
  await supabase.auth.signOut();
  return NextResponse.json({ deleted: true });
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: actor } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (actor?.role !== "admin")
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  const body = (await request.json()) as { role?: unknown };
  if (!["member", "editor", "admin"].includes(String(body.role)))
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const { username } = await params;
  const { data: target } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.toLowerCase())
    .single();
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { error } = await supabase.rpc("update_user_role", {
    user_id: target.id,
    user_role: body.role,
  });
  if (error)
    return NextResponse.json(
      { error: "Unable to update role" },
      { status: 500 },
    );
  return NextResponse.json({ profile: { username, role: body.role } });
}
