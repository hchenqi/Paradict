"use client";

import { useState } from "react";
import { supabase } from "@/lib/client";
import { UserProfile, type Submission } from "@/lib/types";

export default function ({ submission, reviewer }: { submission: Submission; reviewer: UserProfile }) {
  const id = submission.id;
  const role = reviewer.role;
  const [status, setStatus] = useState<"pending" | "submitting" | "approved" | "rejected" | "removed">("pending");
  const [message, setMessage] = useState("");

  async function review(action: "approved" | "rejected") {
    setStatus("submitting");
    const { error } = await supabase.from("submissions").update({ review_status: action, reviewed_by: reviewer.id, review_note: "", reviewed_at: new Date().toISOString() }).eq("id", id);
    if (!error) {
      setStatus(action);
      setMessage(`Submission ${action}.`);
    } else {
      setStatus("pending");
      setMessage("Review failed.");
    }
  }

  async function remove() {
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (!error) {
      setStatus("removed");
      setMessage(`Submission removed.`);
    } else {
      setStatus("pending");
      setMessage("Review failed.");
    }
  }

  return (
    <article>
      <header>
        <span>Submission #{submission.id}</span>
        <span>{status}</span>
      </header>
      <pre>{JSON.stringify(submission.payload, null, 2)}</pre>
      {
        (role === "editor" || role === "admin") && (
          <footer>
            <fieldset disabled={status !== "pending"}>
              <button type="button" onClick={() => review("approved")}>Approve</button>
              <button type="button" onClick={() => review("rejected")}>Reject</button>
              {role === "admin" && <button type="button" onClick={() => remove()}>Delete</button>}
            </fieldset>
            {message && <p role="status">{message}</p>}
          </footer>
        )
      }
    </article>
  );
}
