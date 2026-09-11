"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/client";
import RoleEditor from "./RoleEditor";

type Profile = { id: string; username: string; display_name: string | null; role: string; created_at: string };
type Submission = { id: number; payload: unknown; review_status: string; created_at: string };

export default function () {
  const { username } = useParams<{ username: string }>();
  const supabase = getSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.from("users").select("id, username, display_name, role, created_at").eq("username", username.toLowerCase()).single().then(async ({ data }) => {
      if (!data) return;
      setProfile(data);
      const { data: own } = await supabase.from("submissions").select("id, payload, review_status, created_at").eq("created_by", data.id).order("created_at", { ascending: false });
      setSubmissions(own ?? []);
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: actor } = await supabase.from("users").select("role").eq("id", user.user.id).single();
        setIsAdmin(actor?.role === "admin");
      }
    });
  }, [supabase, username]);

  if (!profile) return <main className="account-content"><div className="loading-state">Loading profile...</div></main>;
  return (
    <section className="account-content">
      <p className="eyebrow">Public profile</p>
      <h1>{profile.display_name || profile.username}</h1>
      <p className="profile-username">@{profile.username}</p>
      <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
      {isAdmin && <RoleEditor username={profile.username} role={profile.role} />}
      <section className="public-submissions profile-submissions"><div className="results-heading"><span className="eyebrow">Submissions</span></div>{submissions.map(submission => <article className="concept-card submission-item" key={submission.id}><div className="concept-heading"><span className="concept-title">Submission #{submission.id}</span><span className="submission-status">{submission.review_status}</span></div><pre className="submission-raw">{JSON.stringify(submission.payload, null, 2)}</pre></article>)}{!submissions.length && <p>No submissions yet.</p>}</section>
    </section>
  );
}
