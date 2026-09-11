"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/client";
import { getConceptAction } from "@/app/actions";
import type { ConceptEntry, LanguageCode } from "@/lib/types";
import ConceptEditor from "./concept-editor";
import SubmissionList from "./submission-list";

export default function SubmissionsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState("member");
  const [conceptEntries, setConceptEntries] = useState<ConceptEntry[]>([]);
  const type = params.get("type") as "create_concept" | "update_concept" | "merge_concepts" | null;
  const conceptId = Number(params.get("concept_id"));
  const languages = (params.get("languages")?.split(",") ?? []).filter(Boolean) as LanguageCode[];

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
      setRole(data?.role ?? "member");
      if (conceptId > 0 && (type === "update_concept" || type === "merge_concepts"))
        setConceptEntries(await getConceptAction(conceptId, languages));
    });
  }, [conceptId, languages, router, type]);

  return (
    <section className="account-content">
      <div className="account-heading"><p className="eyebrow">Community edits</p><h1>Submissions</h1><p>Browse community proposals and help improve the dictionary.</p></div>
      {type && <ConceptEditor type={type} concept={conceptEntries.length ? { id: conceptId, entries: conceptEntries } : undefined} languages={languages} />}
      <SubmissionList canReview={role === "editor" || role === "admin"} isAdmin={role === "admin"} />
    </section>
  );
}
