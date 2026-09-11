"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ConceptList from "../ConceptList";
import { useActiveLanguageList } from "../ActiveLanguageListProvider";
import type { Concept } from "@/lib/types";

export default function SearchPage() {
  const { activeLanguageList } = useActiveLanguageList();
  const [query, setQuery] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, []);

  useEffect(() => {
    if (!activeLanguageList.length || !query.trim()) {
      setConcepts([]);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/search?q=${encodeURIComponent(query)}&languages=${activeLanguageList.join(",")}`, { signal: controller.signal })
        .then((response) => response.json() as Promise<{ concepts?: Concept[] }>)
        .then((result) => setConcepts(result.concepts ?? []))
        .finally(() => setLoading(false))
        .catch(() => undefined);
    }, 300);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [activeLanguageList, query]);

  function updateQuery(value: string) {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url);
    if (value.trim()) requestAnimationFrame(() => formRef.current?.scrollIntoView({ block: "start" }));
  }

  return (
    <>
      <section className={`hero ${query.trim() ? "hero-searching" : ""}`}>
        {!query.trim() && <><p className="eyebrow">A dictionary of shared meaning</p><h1>Find the word.<br /><em>Keep the meaning.</em></h1><p className="lede">Search across languages and browse the concepts that connect them.</p></>}
        <form ref={formRef} className={`search-form ${!activeLanguageList.length ? "search-disabled" : ""}`} onSubmit={(event) => event.preventDefault()}>
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input aria-label="Search the dictionary" disabled={!activeLanguageList.length} value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={activeLanguageList.length ? "Search a word, like bank or Wasser" : "Select a language above"} />
          {query && <button className="clear-button" type="button" onClick={() => updateQuery("")} aria-label="Clear search">×</button>}
        </form>
      </section>
      <section className="results" aria-live="polite">
        {loading ? <div className="loading-state" role="status">Searching concepts...</div> : concepts.length ? <><div className="results-heading"><span className="eyebrow">Search results</span></div><ConceptList concepts={concepts} activeLanguageList={activeLanguageList} />{query.trim() && <Link className="submission-cta" href={`/submissions?type=create_concept&languages=${activeLanguageList.join(",")}`}>Suggest a new concept</Link>}</> : <div className="empty-state"><h2>{activeLanguageList.length ? "No shared meaning found" : "Select a language to search"}</h2></div>}
      </section>
    </>
  );
}
