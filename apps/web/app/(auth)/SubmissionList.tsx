"use client";

import { useState } from "react";
import { supabase } from "@/lib/client";
import { Submission, UserProfile, EntryCreate, EntryRemove, SubmissionPayload } from "@/lib/types";
import { useLanguages } from "@/app/LanguageProvider";
import ConceptEdit from "@/app/ConceptEdit";
import "./SubmissionList.css";

function PayloadView({ payload, canCommit }: { payload: SubmissionPayload; canCommit: boolean; }) {
  const { languages } = useLanguages();

  const concept = payload.concept;

  const [removes, setRemoves] = useState<EntryRemove[]>(payload.removes ?? []);
  const [creates, setCreates] = useState<EntryCreate[]>(payload.creates ?? []);

  const compare = payload.subsume;

  return <ConceptEdit languages={languages} concept={concept} removes={removes} creates={creates} setRemoves={setRemoves} setCreates={setCreates} compare={compare} editing={false} canCommit={canCommit} />;
}

function SubmissionArticle({ submission, reviewer }: { submission: Submission; reviewer: UserProfile }) {
  const [status, setStatus] = useState<"pending" | "submitting" | "approved" | "rejected" | "removed">(submission.review_status);
  const [message, setMessage] = useState("");
  const canReview = reviewer.role === "editor" || reviewer.role === "admin";

  async function review(action: "approved" | "rejected") {
    setStatus("submitting");
    const { error } = await supabase.from("submissions").update({ review_status: action, reviewed_by: reviewer.id, review_note: "", reviewed_at: new Date().toISOString() }).eq("id", submission.id);
    setStatus(error ? "pending" : action);
    setMessage(error ? "Review failed." : `Submission ${action}.`);
  }

  async function remove() {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.from("submissions").delete().eq("id", submission.id);
    setStatus(error ? "pending" : "removed");
    setMessage(error ? "Review failed." : "Submission removed.");
  }

  return (
    <article className="submission concept">
      <header>Submission #{submission.id}<span className="status">{status}</span></header>
      <PayloadView payload={submission.payload} canCommit={canReview} />
      {
        canReview && (
          <footer className="actions">
            <button type="button" disabled={status !== "pending"} onClick={() => review("approved")}>Approve</button>
            <button type="button" disabled={status !== "pending"} onClick={() => review("rejected")}>Reject</button>
            {reviewer.role === "admin" && <button type="button" disabled={status === "submitting" || status === "removed"} onClick={remove}>Remove</button>}
            {message && <p role="status">{message}</p>}
          </footer>
        )
      }
    </article>
  );
}

export default function ({ submissions, reviewer }: { submissions: Submission[]; reviewer: UserProfile }) {
  return <>{submissions.map(submission => <SubmissionArticle key={submission.id} submission={submission} reviewer={reviewer} />)}</>;
}
