import Link from "next/link";
import { notFound } from "next/navigation";
import {
  groupEntriesByLanguage,
  languageLabel,
  type LanguageCode,
} from "../../lib/dictionary";
import { getConceptFromSupabase } from "../../lib/supabase/dictionary";
import LanguageSelector from "../language-selector";
import SelectionSearch from "../selection-search";

export default async function ConceptPage({
  searchParams,
}: {
  searchParams: Promise<{ concept_id?: string; languages?: string }>;
}) {
  const params = await searchParams;
  const conceptId = Number(params.concept_id);
  const selectedLanguages = (params.languages?.split(",") ?? []).filter(
    (code): code is LanguageCode => Boolean(code),
  );
  const remoteConcept = Number.isInteger(conceptId)
    ? await getConceptFromSupabase(conceptId, selectedLanguages)
    : undefined;
  const concept = remoteConcept;
  if (!concept) notFound();
  const displayLanguages = selectedLanguages.length
    ? selectedLanguages
    : [...new Set(concept.entries.map((entry) => entry.language))];
  const entries = selectedLanguages.length
    ? concept.entries.filter((entry) =>
        selectedLanguages.includes(entry.language),
      )
    : concept.entries;
  return (
    <main className="shell concept-page">
      <header className="topbar">
        <Link className="brand" href="/">
          paradict<span>.</span>
        </Link>
        <div className="topbar-actions">
          <Link className="back-link" href="/submissions">
            Submissions
          </Link>
          <Link className="back-link" href="/">
            ← Back to search
          </Link>
        </div>
      </header>
      <LanguageSelector selectedLanguages={selectedLanguages} refreshOnChange />
      <section className="results concept-results">
        {entries.length ? (
          <article className="concept-card">
            <div className="concept-heading">
              <span className="concept-title">Concept {concept.id}</span>
            </div>
            <div className="entries-grid">
              {groupEntriesByLanguage(concept, displayLanguages).map(
                (group) => (
                  <div className="entry" key={group.language}>
                    <div className="entry-language">
                      {languageLabel(group.language, group.language)}
                    </div>
                    <div className="entry-words">
                      {group.entries.map((entry) => (
                        <span className="entry-word" key={entry.id}>
                          {entry.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </article>
        ) : (
          <div className="empty-state">
            <p>This concept has no entries in the selected languages.</p>
          </div>
        )}
        <div className="concept-actions">
          <Link
            className="submission-cta"
            href={`/submissions?type=update_concept&concept_id=${concept.id}&languages=${selectedLanguages.join(",")}`}
          >
            Update entries
          </Link>
          <Link
            className="submission-cta"
            href={`/submissions?type=merge_concepts&concept_id=${concept.id}`}
          >
            Merge concept
          </Link>
        </div>
      </section>
      <footer>
        <span>Share this page to share the meaning</span>
        <span>/concepts?concept_id={concept.id}</span>
      </footer>
      <SelectionSearch />
    </main>
  );
}
