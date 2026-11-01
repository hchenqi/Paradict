"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/client";
import { EntryCreate, EntryRemove, SubmissionPayload } from "@/lib/types";
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
    setLanguageFilter(localStorage.getItem("language-filter") as LanguageFilter | null ?? languageFilter);
  }, []);

  return [languageFilter === "all" ? languages : languageFilter === "selected" ? selectedLanguages : activeLanguages, languageFilter, (languageFilter: LanguageFilter) => { localStorage.setItem("language-filter", languageFilter); setLanguageFilter(languageFilter); }];
}

function CompareIdLoader({ setCompare }: { setCompare: (compare: number | undefined) => void; }) {
  const searchParams = useSearchParams();
  const id = Number(searchParams.get("compare") || NaN);
  const compare = Number.isInteger(id) && id > 0 ? id : undefined;

  useEffect(() => {
    setCompare(compare);
  }, [compare]);

  return null;
}

export default function () {
  const { userProfile } = useUserProfile();
  const [languages, languageFilter, setLanguageFilter] = useLanguageFilter();
  const [message, setMessage] = useState("");
  const router = useRouter();

  const pathname = usePathname();
  const isCreate = pathname.endsWith("/create");
  const id = Number(pathname.split("/").pop());
  const concept = Number.isInteger(id) && id > 0 ? id : undefined;

  const [editing, setEditing] = useState(isCreate);
  const [removes, setRemoves] = useState<EntryRemove[]>([]);
  const [creates, setCreates] = useState<EntryCreate[]>([]);

  const [compare, setCompare] = useState<number | undefined>(undefined);

  useEffect(() => {
    setEditing(isCreate);
    if (!isCreate && !concept) {
      setMessage("Invalid concept id.");
      router.replace("/concept/create");
    }
  }, [pathname]);

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

  async function submit(subsume: number | undefined) {
    if (!userProfile) {
      setMessage("Only members could submit.");
      return;
    }
    if ((isCreate && creates.length) || (!isCreate && (removes.length || creates.length)) || subsume) {
      const payload: SubmissionPayload = { concept, subsume, removes, creates };
      const { error } = await supabase.from("submissions").insert({ created_by: userProfile.id, payload });
      setMessage(error ? "Submission failed." : "Submitted for review.");
      !error && setEditing(false);
    } else {
      setMessage("No changes to submit.");
    }
  }

  async function createConcept(entries: EntryCreate[]) {
    const { data, error } = await supabase.rpc("create_concept", { entry_list: entries });
    if (error) { throw error; }
    const conceptId = data as number;
    router.replace(`/concept/${conceptId}`);
  }

  return (
    <article className="concept">
      <Suspense><CompareIdLoader setCompare={setCompare} /></Suspense>
      <nav aria-label="Concept controls">
        <select aria-label="Languages to display" value={languageFilter} onChange={event => setLanguageFilter(event.target.value as LanguageFilter)}>
          {
            (["all", "selected", "active"] as LanguageFilter[]).map(option => (
              <option key={option} value={option}>
                {option === "all" ? "all languages" : option === "active" ? "active languages" : "selected languages"}
              </option>
            ))
          }
        </select>
        <form className="compare-form" onSubmit={event => {
          event.preventDefault();
          const form = event.currentTarget;
          const compare = new FormData(form).get("compare") as string;
          router.replace(compare ? `${pathname}?compare=${encodeURIComponent(compare)}` : pathname);
        }}>
          <input name="compare" aria-label="Concept ID to compare" placeholder="Concept id" />
          <button type="submit">Compare</button>
        </form>
        <button className="view-toggle" type="button" onClick={() => setEditing(!editing)}>{!editing ? "Edit" : "View"}</button>
        {
          editing && (
            <div className="agreement">
              <span>By submitting, you agree to the{" "}<a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a></span>
              <button type="button" onClick={() => submit(undefined)}>Submit</button>
              {compare && <button type="button" onClick={() => submit(compare)}>Submit subsuming</button>}
            </div>
          )
        }
      </nav>
      {message && <p role="status">{message}</p>}
      <ConceptEdit languages={languages} concept={concept} removes={removes} creates={creates} setRemoves={setRemoves} setCreates={setCreates} compare={compare} editing={editing} canCommit={userProfile ? (userProfile.role === "editor" || userProfile.role === "admin") : false} onCreateConcept={createConcept} />
    </article>
  );
}
