"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ConceptList from "../ConceptList";
import { type Entry, groupEntriesByConcept } from "@/lib/types";

export default function () {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const languages = searchParams.get("lang");
  const activeLanguages = languages?.split(",") ?? [];
  const [loading, setLoading] = useState(true);
  const [concepts, setConcepts] = useState<Map<number, Entry[]>>(new Map());

  useEffect(() => {
    if (query && query.trim() && activeLanguages.length) {
      const controller = new AbortController();
      let abort = false;
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${languages}&limit=20`, { signal: controller.signal })
        .then(response => response.json() as Promise<Entry[]>)
        .then(entries => setConcepts(groupEntriesByConcept(entries)))
        .finally(() => { if (!abort) { setLoading(false); } })
        .catch(() => undefined);
      return () => { abort = true; controller.abort(); };
    } else {
      setConcepts(new Map());
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <>
      <section className="results" aria-live="polite">
        {
          loading ? (
            <div className="loading-state" role="status">Searching...</div>
          ) : (
            concepts.size ? (
              <>
                <div className="results-heading"><span className="eyebrow">Search results</span></div>
                <ConceptList concepts={concepts} activeLanguages={activeLanguages} query={query?.trim() || undefined} />
                {query && <Link className="submission-cta" href={`/concept/create`}>Suggest a new concept</Link>}
              </>
            ) : (
              <div className="empty-state">
                <h2>{activeLanguages.length ? "No result" : "Select a language first"}</h2>
              </div>
            )
          )
        }
      </section>
    </>
  );
}
