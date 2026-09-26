"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/client";
import { Submission } from "@/lib/types";
import { useUserProfile } from "@/app/AuthProvider";
import SubmissionList from "../SubmissionList";

export default function () {
  const { userProfile } = useUserProfile();
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (userProfile) {
      supabase.from("submissions").select("*").eq("review_status", "pending").order("created_at", { ascending: true }).then(({ data }) => {
        setSubmissions(data as Submission[]);
      });
    }
  }, [userProfile]);

  return (
    <main>
      <h1>Submissions</h1>
      {userProfile && (submissions.length ? <SubmissionList submissions={submissions} reviewer={userProfile} /> : <p>No pending submissions.</p>)}
    </main>
  );
}
