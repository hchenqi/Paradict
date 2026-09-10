"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Submission = {
  id: number;
  created_by: string;
  payload: unknown;
  review_status: string;
  review_note: string | null;
  created_at: string;
  users?: { username: string } | null;
};

export default function SubmissionList({
  canReview,
  isAdmin,
}: {
  canReview: boolean;
  isAdmin: boolean;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rawId, setRawId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/submissions",
        { cache: "no-store" },
      );
      const result = (await response.json()) as {
        submissions?: Submission[];
        total?: number;
      };
      setSubmissions(result.submissions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: number, action: "approve" | "reject") {
    const response = await fetch(`/api/submissions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setMessage(response.ok ? `Submission ${action}d.` : "Review failed.");
    if (response.ok) void load();
    window.setTimeout(() => setMessage(""), 3000);
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this submission permanently?")) return;
    const response = await fetch(`/api/submissions/${id}`, {
      method: "DELETE",
    });
    if (response.ok)
      setSubmissions((current) =>
        current.filter((submission) => submission.id !== id),
      );
  }

  function preview(payload: unknown) {
    const value = payload as {
      entries?: Record<string, string[]>;
      added?: Record<string, string[]>;
    };
    const groups = value.entries ?? value.added;
    if (!groups)
      return (
        <p className="submission-preview">
          {JSON.stringify(payload).slice(0, 180)}
        </p>
      );
    return (
      <div className="entries-grid">
        {Object.entries(groups).map(([language, words]) => (
          <div className="entry" key={language}>
            <div className="entry-language">{language}</div>
            <div className="entry-words">
              {words.map((word) => (
                <span className="entry-word" key={word}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="public-submissions">
      {message && (
        <p className="auth-message" role="status">
          {message}
        </p>
      )}
      {loading ? (
        <div className="loading-state" role="status">
          Loading submissions...
        </div>
      ) : (
        <>
          {submissions.map((submission) => (
            <article
              className="concept-card submission-item"
              key={submission.id}
            >
              <div className="concept-heading">
                <span className="concept-title">
                  Submission #{submission.id}
                </span>
                <span className="submission-status">pending</span>
              </div>
              {submission.users?.username && (
                <Link href={`/users/${submission.users.username}`}>
                  @{submission.users.username}
                </Link>
              )}
              {preview(submission.payload)}
              <div className="submission-actions">
                <button
                  type="button"
                  onClick={() =>
                    setRawId(rawId === submission.id ? null : submission.id)
                  }
                >
                  {rawId === submission.id ? "Hide raw JSON" : "Show raw JSON"}
                </button>
                {canReview && submission.review_status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => void review(submission.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(submission.id, "reject")}
                    >
                      Reject
                    </button>
                  </>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => void remove(submission.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              {rawId === submission.id && (
                <pre className="submission-raw">
                  {JSON.stringify(submission.payload, null, 2)}
                </pre>
              )}
            </article>
          ))}
          {!submissions.length && <p>No submissions in this tab.</p>}
        </>
      )}
    </section>
  );
}
