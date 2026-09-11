"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Submission = {
  id: number;
  payload: unknown;
  review_status: string;
  created_at: string;
  users?: { username: string } | null;
};

export default function SubmissionList({ canReview, isAdmin }: { canReview: boolean; isAdmin: boolean }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/submissions", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ submissions?: Submission[] }>)
      .then((result) => setSubmissions(result.submissions ?? []));
  }, []);

  async function review(id: number, action: "approve" | "reject") {
    const response = await fetch(`/api/submissions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setMessage(response.ok ? `Submission ${action}d.` : "Review failed.");
    if (response.ok) setSubmissions((items) => items.filter((item) => item.id !== id));
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this submission permanently?")) return;
    const response = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
    if (response.ok) setSubmissions((items) => items.filter((item) => item.id !== id));
  }

  return (
    <section className="public-submissions">
      {message && <p className="auth-message" role="status">{message}</p>}
      {submissions.map((submission) => (
        <article className="concept-card submission-item" key={submission.id}>
          <div className="concept-heading"><span className="concept-title">Submission #{submission.id}</span><span className="submission-status">{submission.review_status}</span></div>
          {submission.users?.username && <Link href={`/users/${submission.users.username}`}>@{submission.users.username}</Link>}
          <pre className="submission-raw">{JSON.stringify(submission.payload, null, 2)}</pre>
          <div className="submission-actions">
            {canReview && <><button type="button" onClick={() => void review(submission.id, "approve")}>Approve</button><button type="button" onClick={() => void review(submission.id, "reject")}>Reject</button></>}
            {isAdmin && <button type="button" onClick={() => void remove(submission.id)}>Delete</button>}
          </div>
        </article>
      ))}
      {!submissions.length && <p>No pending submissions.</p>}
    </section>
  );
}
