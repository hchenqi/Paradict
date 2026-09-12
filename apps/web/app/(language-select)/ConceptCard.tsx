"use client";

import { type LanguageCode, type Entry, languageLabel } from "@/lib/types";
import Link from "next/link";

function groupEntriesByLanguage(entries: Entry[], languageList: LanguageCode[]) {
  return languageList.map(language => ({
    language,
    entries: entries.filter(entry => entry.language === language),
  }));
}

function highlight(text: string, query: string | null) {
  if (query === null) { return text; }
  const trimmed = query.trim();
  if (!trimmed) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .split(new RegExp(`(${escaped})`, "ig"))
    .map((part, index) =>
      part.toLocaleLowerCase() === trimmed.toLocaleLowerCase() ? (
        <mark key={`${part}-${index}`}>{part}</mark>
      ) : (
        part
      ),
    );
}

function LanguageRow({ language, entries }: { language: LanguageCode; entries: Entry[] }) {
  return (
    <div className="entry">
      <div className="entry-language">{languageLabel(language)}</div>
      <div className="entry-words">
        {
          entries.map(entry => (
            <span className="entry-word" key={entry.entry_id}>{entry.expression}</span>
          ))
        }
      </div>
    </div>
  );
}

export default function ({ conceptId, entries, activeLanguages }: { conceptId: number; entries: Entry[]; activeLanguages: LanguageCode[]; }) {
  return (
    <article className="concept-card">
      <div className="concept-heading">
        <Link className="concept-title" href={`/concept/${conceptId}?lang=${activeLanguages.join(",")}`}>Concept {conceptId}</Link>
      </div>
      <div className="entries-grid">
        {
          groupEntriesByLanguage(entries, activeLanguages).map(row => (
            <LanguageRow key={row.language} language={row.language} entries={row.entries} />
          ))
        }
      </div>
    </article>
  );
}
