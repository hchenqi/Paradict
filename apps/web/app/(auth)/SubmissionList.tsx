"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/client";
import { Submission, SubmissionPayload, UserProfile } from "@/lib/types";
import { useLanguages } from "@/app/LanguageProvider";
import ConceptEdit, { ConceptEditHandle } from "@/app/ConceptEdit";
import "./SubmissionList.css";

function SubmissionArticle({ submission, reviewer }: { submission: Submission; reviewer: UserProfile }) {
  const { languages } = useLanguages();
  const [status, setStatus] = useState<Submission["review_status"] | "removed">(submission.review_status);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOwner = reviewer.id === submission.created_by;
  const canReview = reviewer.role === "editor" || reviewer.role === "admin";
  const canEdit = isOwner || canReview;
  const canRemove = isOwner || reviewer.role === "admin";

  const [editing, setEditing] = useState(false);
  const conceptEditRef = useRef<ConceptEditHandle>(null);

  async function commit() {
    if (submitting) { return; }
    setSubmitting(true);
    const { error } = await supabase.rpc("commit_submission", { submission_id: submission.id });
    setSubmitting(false);
    if (error) {
      setMessage(`Commit submission failed: ${error.message}`);
    } else {
      setStatus("committed");
      setMessage(`Submission committed.`);
    }
  }

  async function reject() {
    if (submitting) { return; }
    setSubmitting(true);
    const { error } = await supabase.rpc("reject_submission", { submission_id: submission.id });
    setSubmitting(false);
    if (error) {
      setMessage(`Reject submission failed: ${error.message}`);
    } else {
      setStatus("rejected");
      setMessage("Submission rejected.");
    }
  }

  async function replace() {
    if (submitting) { return; }
    const operations = conceptEditRef.current?.getOperations();
    if (!operations || !operations.length || JSON.stringify(operations) === JSON.stringify(submission.payload)) {
      setMessage("No changes to commit.");
      return;
    }
    setSubmitting(true);
    const { data: replacementId, error } = await supabase.rpc("replace_submission", { submission_id: submission.id, replacement_payload: operations });
    setSubmitting(false);
    if (error) {
      setMessage(`Could not create replacement submission: ${error.message}`);
    } else {
      setEditing(false);
      setStatus("rejected");
      const { error } = await supabase.rpc("commit_submission", { submission_id: replacementId });
      if (error) {
        setMessage(`Commit submission #${replacementId} failed: ${error.message}`);
      } else {
        setMessage(`Submission #${replacementId} committed.`);
      }
    }
  }

  async function update() {
    if (submitting) { return; }
    const operations = conceptEditRef.current?.getOperations();
    if (!operations || !operations.length || JSON.stringify(operations) === JSON.stringify(submission.payload)) {
      setMessage("No changes to commit.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("submissions").update({ payload: operations }).eq("id", submission.id);
    setSubmitting(false);
    if (error) {
      setMessage(`Could not update submission: ${error.message}`);
    } else {
      setEditing(false);
      setStatus("pending");
      setMessage("Submission updated.");
    }
  }

  async function remove() {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("submissions").delete().eq("id", submission.id);
    setSubmitting(false);
    if (error) {
      setMessage(`Could not remove submission: ${error.message}`);
    } else {
      setStatus("removed");
      setMessage("Submission removed.");
    }
  }

  return (
    <article className="submission concept">
      <header>Submission #{submission.id}<span className="status">{status}</span></header>
      <ConceptEdit ref={conceptEditRef} languages={languages} initial={submission.payload} editing={editing} />
      {
        (canReview || canEdit || canRemove) && (
          <footer className="actions">
            {canEdit && status === "pending" && !editing && <button type="button" disabled={submitting} onClick={() => { setEditing(true); setMessage(""); }}>Edit</button>}
            {canEdit && status === "pending" && editing && !canReview && <button type="button" disabled={submitting} onClick={update}>{submitting ? "Saving..." : "Update"}</button>}
            {canReview && status === "pending" && <button type="button" disabled={submitting} onClick={editing ? replace : commit}>{submitting ? "Committing..." : editing ? "Replace and commit" : "Commit"}</button>}
            {canReview && status === "pending" && <button type="button" disabled={submitting} onClick={reject}>Reject</button>}
            {canRemove && status !== "committed" && status !== "removed" && <button type="button" disabled={submitting} onClick={remove}>Remove</button>}
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
