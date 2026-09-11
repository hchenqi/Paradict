
import { LanguageCode, ConceptEntry, LanguageEntry, languageLabel } from "@/lib/types";

function groupEntriesByLanguage(entries: ConceptEntry[], languageList: LanguageCode[]) {

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


function LanguageRow({ language, entries } : { language: LanguageCode; entries: LanguageEntry[] }) {
  return (
    <div className="entry" key={language}>
      <div className="entry-language">
        {languageLabel(language)}
      </div>
      <div className="entry-words">
        {entries.map((entry) => (
          <span className="entry-word" key={entry.entry_id}>
            {entry.expression}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ConceptCard({ concept_id, entries, activeLanguageList }: { concept_id: number; entries: ConceptEntry[]; activeLanguageList: LanguageCode[] }) {
  return (
    <article className="concept-card">
      <div className="concept-heading">
        <span className="concept-title">Concept {concept_id}</span>
      </div>
      <div className="entries-grid">
        {
          groupEntriesByLanguage(entries, activeLanguageList).map(row => <LanguageRow language={row.language} entries={row.entries} />)
        }
      </div>
    </article>
  )
}
