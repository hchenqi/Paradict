"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/client";
import { UserProfile, type Submission } from "@/lib/types";
import { useUserProfile } from "@/app/AuthProvider";
import SubmissionArticle from "../SubmissionArticle";
import "./page.css";

function SubmissionList({ reviewer }: { reviewer: UserProfile }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    supabase.from("submissions").select("*").eq("review_status", "pending").order("created_at", { ascending: true }).then(({ data }) => {
      setSubmissions(data as Submission[]);
    });
  }, []);

  return submissions.length ? (
    <ul>{submissions.map(submission => <li key={submission.id}><SubmissionArticle submission={submission} reviewer={reviewer} /></li>)}</ul>
  ) : (
    <p>No pending submissions.</p>
  );
}

export default function () {
  const { userProfile } = useUserProfile();
  return (
    <main>
      <h1>Submissions</h1>
      {userProfile && <SubmissionList reviewer={userProfile} />}
    </main>
  );
}
