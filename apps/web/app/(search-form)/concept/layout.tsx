"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/client";
import { ConceptOperation, SubmissionPayload } from "@/lib/types";
import { useUserProfile } from "@/app/AuthProvider";
import { useActiveLanguages, useLanguages, useSelectedLanguages } from "@/app/LanguageProvider";
import ConceptEdit from "@/app/ConceptEdit";
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

function ComparesIdLoader({ setCompares }: { setCompares: (compares: number[]) => void; }) {
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

  const [compares, setCompares] = useState<number[]>([]);
  const initial: ConceptOperation[] = [isCreate ? { type: "create", creates: [] } : { type: "update", concept, removes: [], creates: [] }, ...compares.map(compare => ({ type: "update", concept: compare, removes: [], creates: [] } as ConceptOperation))]

  const [editing, setEditing] = useState(isCreate);

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
    if (!userProfile) {
      setMessage("Only members could submit.");
      return;
    }
    if ((isCreate && creates.length) || (!isCreate && (removes.length || creates.length)) || subsume) {
      const payload: SubmissionPayload = { concept, subsume, removes, creates };
      const { error } = await supabase.from("submissions").insert({ created_by: userProfile.id, payload });
      setMessage(error ? "Submission failed." : "Submitted for review.");
      if (!error) { setEditing(false); }
    } else {
      setMessage("No changes to submit.");
    }
  }

  return (
    <article className="concept">
      <Suspense><ComparesIdLoader setCompares={setCompares} /></Suspense>
      <nav aria-label="Concept controls">
        <select aria-label="Languages to display" value={languageFilter} onChange={event => setLanguageFilter(event.target.value as LanguageFilter)}>
          <option value="all">all languages</option>
          <option value="selected">selected languages</option>
          <option value="active">active languages</option>
        </select>
        <button className="view-toggle" type="button" onClick={() => setEditing(!editing)}>{!editing ? "Edit" : "View"}</button>
        {
          editing && (
            <div className="agreement">
              <span>By submitting, you agree to the{" "}<a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a></span>
              <button type="button" onClick={() => submit()}>Submit</button>
            </div>
          )
        }
      </nav>
      {message && <p role="status">{message}</p>}
      <ConceptEdit languages={languages} initial={initial} editing={editing} />
    </article>
  );
}
