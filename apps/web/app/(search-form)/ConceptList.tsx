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
          entries.map(entry => <div className={`entry ${entry.score ? "matched" : ""}`} key={entry.expr}><span>{query ? highlight(entry.expr, query) : entry.expr}</span></div>)
        }
      </div>
    </div>
  );
}

function ConceptCard({ conceptId, rows, query, compare, setCompare }: { conceptId: number; rows: { lang: string; entries: Entry[]; }[]; query: string | undefined; compare: number[]; setCompare: (compare: number[]) => void; }) {
  const compareIds = compare.filter(id => id !== conceptId);
  const selected = compare.includes(conceptId);
  return (
    <article className="concept">
      <header>
        <Link className="title" href={`/concept/${conceptId}${compareIds.length ? `?compare=${compareIds.join(",")}` : ""}`}>Concept {conceptId}</Link>
        {query && <button className={`compare-toggle ${selected ? "selected" : ""}`} type="button" aria-label={`Compare concept ${conceptId}`} aria-pressed={selected} onClick={() => setCompare(selected ? compareIds : [...compare, conceptId])}>Compare</button>}
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
  const [compare, setCompare] = useState<number[]>([]);

  return (
    <>
      {
        Array.from(concepts.entries()).map(([conceptId, entries]) => (
          <ConceptCard key={conceptId} conceptId={conceptId} rows={groupEntriesByLanguageOrdered(entries, languages, !query, languageIdCodeMap)} query={query} compare={compare} setCompare={setCompare} />
        ))
      }
      {query && <Link className="suggest" href={`/concept/create${compare.length ? `?compare=${compare.join(",")}` : ""}`}>Suggest a new concept</Link>}
    </>
  );
}
