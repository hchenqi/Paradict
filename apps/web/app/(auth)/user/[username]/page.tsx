"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/client";
import { useUserProfile } from "@/app/AuthProvider";
import { Submission, UserProfile } from "@/lib/types";
import SubmissionArticle from "../../SubmissionArticle";
import "./page.css";

function RoleEdit({ id, role: initialRole }: { id: string; role: string; }) {
  const [role, setRole] = useState(initialRole);
  const [message, setMessage] = useState("");

  async function updateRole(newRole: string) {
    setMessage("Updating user role...")
    const { error } = await supabase.rpc("update_user_role", { user_id: id, user_role: newRole });
    if (error) {
      setMessage("Unable to update role.");
    } else {
      setRole(newRole);
      setMessage("Role updated.");
    }
  }

  return (
    <>
      <select value={role} onChange={event => updateRole(event.target.value)} >
        <option value="member">Member</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      {message && <p>{message}</p>}
    </>
  );
}

export default function () {
  const { userProfile: reviewer } = useUserProfile();
  const { username } = useParams<{ username: string }>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (reviewer) {
      supabase.from("users").select("id, role, username, display_name").eq("username", username.toLowerCase()).single().then(async ({ data }) => {
        if (data) {
          setUserProfile(data);
        }
      });
    }
  }, [reviewer, username]);

  useEffect(() => {
    if (userProfile) {
      supabase.from("submissions").select("id, created_at, payload, review_status").eq("created_by", userProfile.id).order("created_at", { ascending: false }).then(({ data }) => {
        setSubmissions(data as Submission[]);
      });
    }
  }, [userProfile]);

  return !userProfile ? (
    <main>
      <p>Loading profile...</p>
    </main>
  ) : (
    <main>
      <p>Public profile</p >
      <h1>{userProfile.display_name || userProfile.username}</h1>
      <p>@{userProfile.username}</p>
      {reviewer?.role === "admin" && <RoleEdit id={userProfile.id} role={userProfile.role} />}
      <section>
        <header>Submissions</header>
        {
          submissions.length ? (
             <ul>{submissions.map(submission => <li key={submission.id}><SubmissionArticle submission={submission} reviewer={reviewer} /></li>)}</ul>
          ) : (
            <p>No submissions yet.</p>
          )
        }
      </section>
    </main >
  );
}
