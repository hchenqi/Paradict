"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ConceptList from "../../ConceptList";
import { type Entry, groupEntriesByConcept } from "@/lib/types";

export default function () {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const languages = searchParams.get("lang");
  const activeLanguages = languages?.split(",") ?? [];
  const valid = query && query.trim() && activeLanguages.length;
  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<Map<number, Entry[]>>(new Map());

  useEffect(() => {
    if (valid) {
      setLoading(true);
      const controller = new AbortController();
      fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${languages}&limit=20`, { signal: controller.signal })
        .then(response => response.json() as Promise<Entry[]>)
        .then(entries => setConcepts(groupEntriesByConcept(entries)))
        .finally(() => setLoading(false))
        .catch(() => undefined);
      return () => controller.abort();
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
            <div className="loading-state" role="status">Searching concepts...</div>
          ) : (
            concepts.size ? (
              <>
                <div className="results-heading">
                  <span className="eyebrow">Search results</span>
                </div>
                <ConceptList concepts={concepts} activeLanguages={activeLanguages} />
                {
                  query && (
                    <Link className="submission-cta" href={`/submissions?type=create_concept&languages=${activeLanguages.join(",")}`}>
                      Suggest a new concept
                    </Link>
                  )
                }
              </>
            ) : (
              <div className="empty-state">
                <h2>{activeLanguages.length ? "No shared meaning found" : "Select a language to search"}</h2>
              </div>
            )
          )
        }
      </section>
    </>
  );
}
