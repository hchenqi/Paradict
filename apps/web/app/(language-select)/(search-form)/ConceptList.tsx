"use client";

import Link from "next/link";
import { type LanguageCode, type Entry, languageLabel, groupEntriesByLanguage } from "@/lib/types";

function highlight(text: string, query: string) {
  return text
    .split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"))
    .map((part, index) => part.toLocaleLowerCase() === query.toLocaleLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part);
}

function LanguageRow({ language, entries, query }: { language: LanguageCode; entries: Entry[]; query: string | undefined }) {
  return (
    <div className="entry">
      <div className="entry-language">{languageLabel(language)}</div>
      <div className="entry-words">
        {
          entries.map(entry => <span className="entry-word" key={entry.entry_id}>{query ? highlight(entry.expression, query) : entry.expression}</span>)
        }
      </div>
    </div>
  );
}

function ConceptCard({ conceptId, entries, activeLanguages, query }: { conceptId: number; entries: Entry[]; activeLanguages: LanguageCode[]; query: string | undefined; }) {
  return (
    <article className="concept-card">
      <div className="concept-heading">
        <Link className="concept-title" href={`/concept/${conceptId}}`}>Concept {conceptId}</Link>
      </div>
      <div className="entries-grid">
        {
          groupEntriesByLanguage(entries, activeLanguages).map(row => (
            <LanguageRow key={row.language} language={row.language} entries={row.entries} query={query} />
          ))
        }
      </div>
    </article>
  );
}

export default function ({ concepts, activeLanguages, query }: { concepts: Map<number, Entry[]>, activeLanguages: LanguageCode[], query?: string }) {
  return (
    <>
      {
        Array.from(concepts.entries()).map(([concept_id, entries]) => (
          <ConceptCard key={concept_id} conceptId={concept_id} entries={entries} activeLanguages={activeLanguages} query={query} />
        ))
      }
    </>
  );
}
