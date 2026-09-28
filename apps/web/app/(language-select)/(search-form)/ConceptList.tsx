"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Entry, languageLabel } from "@/lib/types";
import { useActiveLanguages, useLanguages } from "@/app/LanguageProvider";
import "./ConceptList.css"

function groupEntriesByLanguageOrdered(entries: Entry[], list: [number, string][]) {
  const group = Map.groupBy(entries, entry => entry.lang);
  return list.map(([id, code]) => ({ lang: code, entries: group.get(id) ?? [] }));
}

function highlight(expr: string, query: string) {
  return expr
    .split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"))
    .map((part, index) => part.toLocaleLowerCase() === query.toLocaleLowerCase() ? <mark key={`${part}-${index}`}>{part}</mark> : part);
}

function LanguageRow({ lang, entries, query }: { lang: string; entries: Entry[]; query: string | undefined }) {
  return (
    <div className="row">
      <div className="label">{languageLabel(lang)}</div>
      <div className="entries">
        {
          entries.map(entry => <div className="entry" key={entry.id}><span>{query ? highlight(entry.expr, query) : entry.expr}</span></div>)
        }
      </div>
    </div>
  );
}

function ConceptCard({ conceptId, rows, query, compare, setCompare }: { conceptId: number; rows: { lang: string; entries: Entry[]; }[]; query: string | undefined; compare: number | undefined; setCompare: (compare: number | undefined) => void; }) {
  return (
    <article className="concept">
      <header>
        <Link className="title" href={`/concept/${conceptId}${compare !== undefined && compare !== conceptId ? `?compare=${compare}` : ""}`}>Concept {conceptId}</Link>
        <span>{compare === conceptId && "selected for compare"}</span>
        <button onClick={() => setCompare(compare === conceptId ? undefined : conceptId)}>{compare === conceptId ? "unselect" : "select for compare"}</button>
      </header>
      <div>
        {
          rows.map(row => (
            <LanguageRow key={row.lang} lang={row.lang} entries={row.entries} query={query} />
          ))
        }
      </div>
    </article>
  );
}

export default function ({ entries, query }: { entries: Entry[], query?: string }) {
  const concepts = useMemo(() => Map.groupBy(entries, entry => entry.concept), [entries]);
  const { languageCodeIdMap } = useLanguages();
  const [activeLanguages] = useActiveLanguages();
  const languages = useMemo(() => activeLanguages.map(code => [languageCodeIdMap.get(code)!, code] as [number, string]), [languageCodeIdMap, activeLanguages]);
  const [compare, setCompare] = useState<number | undefined>(undefined);

  return (
    <>
      {
        Array.from(concepts.entries()).map(([conceptId, entries]) => (
          <ConceptCard key={conceptId} conceptId={conceptId} rows={groupEntriesByLanguageOrdered(entries, languages)} query={query} compare={compare} setCompare={setCompare} />
        ))
      }
    </>
  );
}
