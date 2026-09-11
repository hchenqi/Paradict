import { type LanguageCode, type Entry, languageLabel } from "@/lib/types";

function groupEntriesByLanguage(entries: Entry[], languageList: LanguageCode[]) {
  return languageList.map(language => ({
    language,
    entries: entries.filter(entry => entry.language === language),
  }));
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
        <span className="concept-title">Concept {conceptId}</span>
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
