import Link from "next/link";
import { getConceptFromSupabase } from "../../lib/supabase/dictionary";
import { getSupabaseServerClient } from "../../lib/supabase/server";
import ConceptEditor from "./concept-editor";
import SubmissionList from "./submission-list";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type EditType = "create_concept" | "update_concept" | "merge_concepts";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: {
    type?: string;
    concept_id?: string;
    language_id?: string;
    languages?: string;
  };
}) {
  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) redirect("/login");
  const profile =
    user && supabase
      ? (
          await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()
        ).data
      : null;
  const type = [
    "create_concept",
    "update_concept",
    "merge_concepts",
  ].includes(searchParams.type ?? "")
    ? (searchParams.type as EditType)
    : null;
  const conceptId = Number(searchParams.concept_id);
  const selectedLanguages = (searchParams.languages?.split(",") ?? []).filter(
    Boolean,
  );
  const concept =
    conceptId > 0 && (type === "update_concept" || type === "merge_concepts")
      ? await getConceptFromSupabase(conceptId, selectedLanguages)
      : undefined;
  return (
    <main className="shell account-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          paradict<span>.</span>
        </Link>
        <Link className="back-link" href="/">Back to dictionary</Link>
      </header>
      <section className="account-content">
        <div className="account-heading">
          <p className="eyebrow">Community edits</p>
          <h1>Submissions</h1>
          <p>Browse community proposals and help improve the dictionary.</p>
        </div>
        {type && (
          <div className="submission-editor">
            <ConceptEditor
              type={type}
              concept={concept ?? undefined}
              languages={selectedLanguages}
            />
          </div>
        )}
        <SubmissionList
          canReview={profile?.role === "editor" || profile?.role === "admin"}
          isAdmin={profile?.role === "admin"}
        />
      </section>
    </main>
  );
}
