"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Entry, languageLabel } from "@/lib/types";
import { useLanguages } from "@/app/LanguageProvider";
import "./ConceptList.css"

function groupEntriesByLanguageOrdered(entries: Entry[], languages: [number, string][], filter: boolean, languageIdCodeMap: Map<number, string>) {
  const group = Map.groupBy(entries, entry => entry.lang);
  const rows = languages.map(([id, code]) => { const entries = group.get(id) ?? []; group.delete(id); return { lang: code, entries }; });
  return filter ? rows : [...rows, ...[...group].map(([id, entries]) => ({ lang: languageIdCodeMap.get(id)!, entries }))];
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
          entries.map(entry => <div className={`entry ${entry.score ? "matched" : ""}`} key={entry.id}><span>{query ? highlight(entry.expr, query) : entry.expr}</span></div>)
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
        {query && <button className={`compare-toggle ${compare === conceptId ? "selected" : ""}`} type="button" aria-label={`Compare concept ${conceptId}`} aria-pressed={compare === conceptId} onClick={() => setCompare(compare === conceptId ? undefined : conceptId)}>Compare</button>}
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

export default function ({ entries, languageList, query }: { entries: Entry[], languageList: string[], query?: string }) {
  const concepts = useMemo(() => Map.groupBy(entries, entry => entry.concept), [entries]);
  const { languageCodeIdMap, languageIdCodeMap } = useLanguages();
  const languages = useMemo(() => languageList.map(code => [languageCodeIdMap.get(code)!, code] as [number, string]), [languageCodeIdMap, languageList]);
  const [compare, setCompare] = useState<number | undefined>(undefined);

  return (
    <>
      {
        Array.from(concepts.entries()).map(([conceptId, entries]) => (
          <ConceptCard key={conceptId} conceptId={conceptId} rows={groupEntriesByLanguageOrdered(entries, languages, !query, languageIdCodeMap)} query={query} compare={compare} setCompare={setCompare} />
        ))
      }
      {query && <Link className="suggest" href={`/concept/create${compare !== undefined ? `?compare=${compare}` : ""}`}>Suggest a new concept</Link>}
    </>
  );
}
