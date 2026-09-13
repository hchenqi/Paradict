"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/client";
import { type Submission } from "@/lib/types";
import { useUserProfile } from "@/app/AuthProvider";

function SubmissionList({ role }: { role: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.from("submissions").select("*").eq("review_status", "pending").order("created_at", { ascending: true }).then(({ data }) => {
      setSubmissions(data as Submission[]);
    });
  }, []);

  async function review(id: number, action: "approve" | "reject") {
    const response = await fetch(`/api/submissions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setMessage(response.ok ? `Submission ${action}d.` : "Review failed.");
    if (response.ok) setSubmissions(items => items.filter(item => item.id !== id));
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this submission permanently?")) return;
    const response = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
    if (response.ok) setSubmissions(items => items.filter(item => item.id !== id));
  }

  return (
    <section className="public-submissions">
      {message && <p className="auth-message" role="status">{message}</p>}
      {
        submissions.map(submission => (
          <article className="concept-card submission-item" key={submission.id}>
            <div className="concept-heading">
              <span className="concept-title">Submission #{submission.id}</span>
              <span className="submission-status">{submission.review_status}</span>
            </div>
            <pre className="submission-raw">{JSON.stringify(submission.payload, null, 2)}</pre>
            {
              (role === "editor" || role === "admin") && (
                <div className="submission-actions">
                  <button type="button" onClick={() => review(submission.id, "approve")}>Approve</button>
                  <button type="button" onClick={() => review(submission.id, "reject")}>Reject</button>
                  {role === "admin" && (<button type="button" onClick={() => remove(submission.id)}>Delete</button>)}
                </div>
              )
            }
          </article>
        ))
      }
      {!submissions.length && <p>No pending submissions.</p>}
    </section>
  );
}

export default function () {
  const { userProfile } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!userProfile) {
      router.replace("/login");
    }
  }, [userProfile, router]);

  return (
    <section className="account-content">
      <div className="account-heading">
        <p className="eyebrow">The Paradict Community</p>
        <h1>Submissions</h1>
        <p>Help improve the dictionary.</p>
      </div>
      {userProfile && <SubmissionList role={userProfile.role} />}
    </section>
  );
}
