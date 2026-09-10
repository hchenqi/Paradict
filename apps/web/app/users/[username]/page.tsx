import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "../../../lib/supabase/server";
import RoleEditor from "./role-editor";

export const dynamic = "force-dynamic";

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) notFound();
  const { username } = await params;
  const { data: profile } = await supabase
    .from("users")
    .select("id, username, display_name, role, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, payload, review_status, created_at")
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const actor = user
    ? (
        await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
      ).data
    : null;
  return (
    <main className="shell account-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          paradict<span>.</span>
        </Link>
        <Link className="back-link" href="/">
          Back to dictionary
        </Link>
      </header>
      <section className="account-content">
        <p className="eyebrow">Public profile</p>
        <h1>{profile.display_name || profile.username}</h1>
        <p className="profile-username">@{profile.username}</p>
        <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
        {actor?.role === "admin" && (
          <RoleEditor username={profile.username} role={profile.role} />
        )}
        <section className="public-submissions profile-submissions">
          <div className="results-heading">
            <span className="eyebrow">Submissions</span>
          </div>
          {submissions?.map((submission) => (
            <article className="concept-card submission-item" key={submission.id}>
              <div className="concept-heading">
                <span className="concept-title">Submission #{submission.id}</span>
                <span className="submission-status">{submission.review_status}</span>
              </div>
              <time dateTime={submission.created_at}>
                {new Date(submission.created_at).toLocaleString()}
              </time>
              <pre className="submission-raw">
                {JSON.stringify(submission.payload, null, 2)}
              </pre>
            </article>
          ))}
          {!submissions?.length && <p>No submissions yet.</p>}
        </section>
      </section>
    </main>
  );
}
