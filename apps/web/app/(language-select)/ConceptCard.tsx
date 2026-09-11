import { groupEntriesByLanguage, languageLabel, type ConceptEntry, type LanguageCode } from "@/lib/types";

function LanguageRow({ language, entries }: { language: LanguageCode; entries: ConceptEntry[] }) {
  return (
    <div className="entry">
      <div className="entry-language">{languageLabel(language)}</div>
      <div className="entry-words">
        {entries.map((entry) => (
          <span className="entry-word" key={entry.entry_id}>{entry.expression}</span>
        ))}
      </div>
    </div>
  );
}

export default function ConceptCard({
  conceptId,
  entries,
  activeLanguageList,
}: {
  conceptId: number;
  entries: ConceptEntry[];
  activeLanguageList: LanguageCode[];
}) {
  return (
    <article className="concept-card">
      <div className="concept-heading">
        <span className="concept-title">Concept {conceptId}</span>
      </div>
      <div className="entries-grid">
        {groupEntriesByLanguage(entries, activeLanguageList).map((row) => (
          <LanguageRow key={row.language} language={row.language} entries={row.entries} />
        ))}
      </div>
    </article>
  );
}
