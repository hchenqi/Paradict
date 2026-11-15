"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/client";
import { ConceptOperation } from "@/lib/types";
import { useUserProfile } from "@/app/AuthProvider";
import { useActiveLanguages, useLanguages, useSelectedLanguages } from "@/app/LanguageProvider";
import ConceptEdit, { ConceptEditHandle } from "@/app/ConceptEdit";
import "./layout.css";

type LanguageFilter = "all" | "selected" | "active";

function useLanguageFilter(): [[number, string][], LanguageFilter, (languageFilter: LanguageFilter) => void] {
  const { languages, languageCodeIdMap } = useLanguages();
  const [selected] = useSelectedLanguages();
  const selectedLanguages = useMemo(() => selected.map(code => [languageCodeIdMap.get(code)!, code] as [number, string]), [languageCodeIdMap, selected]);
  const [active] = useActiveLanguages();
  const activeLanguages = useMemo(() => active.map(code => [languageCodeIdMap.get(code)!, code] as [number, string]), [languageCodeIdMap, active]);
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("active");

  useEffect(() => {
    const saved = localStorage.getItem("language-filter");
    if (saved === "all" || saved === "selected" || saved === "active") {
      setLanguageFilter(saved);
    }
  }, []);

  return [languageFilter === "all" ? languages : languageFilter === "selected" ? selectedLanguages : activeLanguages, languageFilter, (languageFilter: LanguageFilter) => { localStorage.setItem("language-filter", languageFilter); setLanguageFilter(languageFilter); }];
}

function ComparesIdLoader({ setCompares }: { setCompares: (compares: number[] | undefined) => void; }) {
  const searchParams = useSearchParams();
  const ids = searchParams.getAll("compare").flatMap(value => value.split(",")).map(value => Number(value.trim())).filter((id, index, ids) => Number.isInteger(id) && id > 0 && ids.indexOf(id) === index);

  useEffect(() => {
    setCompares(ids);
  }, []);

  return null;
}

export default function () {
  const { userProfile } = useUserProfile();
  const [languages, languageFilter, setLanguageFilter] = useLanguageFilter();
  const [message, setMessage] = useState("");
  const router = useRouter();

  const pathname = usePathname();
  const isCreate = pathname.endsWith("/create");
  const concept = Number(pathname.split("/").pop());
  const [compares, setCompares] = useState<number[] | undefined>(undefined);
  const initial: ConceptOperation[] = useMemo(() => [isCreate ? { type: "create", creates: [] } : { type: "update", concept, removes: [], creates: [] }, ...(compares ?? []).filter(compare => compare !== concept).map(compare => ({ type: "update" as const, concept: compare, removes: [], creates: [] }))], [pathname, compares]);

  const conceptEditRef = useRef<ConceptEditHandle>(null);

  const [editing, setEditing] = useState(isCreate);
  const canCommit = editing && userProfile && (userProfile.role === "editor" || userProfile.role === "admin");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile === null && editing) {
      const timeout = setTimeout(() => router.replace(`/login?redirect=${encodeURIComponent(`${pathname}${window.location.search}`)}`), 300);
      return () => clearTimeout(timeout);
    }
  }, [userProfile, editing, pathname, router]);

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  async function submit() {
    if (!userProfile || submitting) {
      return;
    }
    const operations = conceptEditRef.current?.getOperations();
    if (!operations || !operations.length) {
      setMessage("Add changes before submitting.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    const { data, error } = await supabase.from("submissions").insert({ created_by: userProfile.id, payload: operations }).select("id").single();
    setSubmitting(false);
    if (error) {
      setMessage(`Submission failed: ${error.message}`);
    } else {
      setEditing(false);
      if (canCommit) {
        const { error } = await supabase.rpc("commit_submission", { submission_id: data.id });
        if (error) {
          setMessage(`Commit submission #${data.id} failed: ${error.message}`);
        } else {
          setMessage(`Submission #${data.id} committed.`);
        }
      }
    }
  }

  return (
    <article className="concept">
      <Suspense fallback={null}><ComparesIdLoader setCompares={setCompares} /></Suspense>
      <nav aria-label="Concept controls">
        <select aria-label="Languages to display" value={languageFilter} onChange={event => setLanguageFilter(event.target.value as LanguageFilter)}>
          <option value="all">all languages</option>
          <option value="selected">selected languages</option>
          <option value="active">active languages</option>
        </select>
        <button className="view-toggle" type="button" onClick={() => setEditing(editing => !editing)}>{!editing ? "Edit" : "View"}</button>
        {
          editing && (
            <div className="agreement">
              <span>By submitting, you agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>.</span>
              <button type="button" disabled={submitting} onClick={submit}>{submitting ? canCommit ? "Committing..." : "Submitting..." : canCommit ? "Commit changes" : "Submit for review"}</button>
            </div>
          )
        }
      </nav>
      {message && <p role="status">{message}</p>}
      {compares && <ConceptEdit ref={conceptEditRef} languages={languages} initial={initial} editing={editing} />}
    </article>
  );
}
