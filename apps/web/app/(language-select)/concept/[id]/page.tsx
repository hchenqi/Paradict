import Link from "next/link";
import { notFound } from "next/navigation";
import {
  groupEntriesByLanguage,
  languageLabel,
  type LanguageCode,
} from "../../lib/types";
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


import { NextResponse } from "next/server";
import type { LanguageCode } from "../../../../lib/types";
import { getConcept } from "../../../../lib/supabase/query";

function parseLanguages(value: string | null): LanguageCode[] {
  return (value?.split(",") ?? [])
    .filter((code): code is LanguageCode => Boolean(code))
    .slice(0, 20);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const conceptId = Number((await params).id);
  if (!Number.isInteger(conceptId) || conceptId < 1)
    return NextResponse.json({ error: "Invalid concept id" }, { status: 400 });

  try {
    const concept = await getConcept(
      conceptId,
      parseLanguages(new URL(request.url).searchParams.get("languages")),
    );
    if (concept === null)
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    if (concept === undefined)
      return NextResponse.json({ error: "Concept not found" }, { status: 404 });
    return NextResponse.json({ configured: true, concept });
  } catch (error) {
    console.error("Concept lookup failed", error);
    return NextResponse.json(
      { error: "Concept lookup failed" },
      { status: 500 },
    );
  }
}
export default function LoadingConcept() {
  return (
    <main className="shell concept-page">
      <section className="loading-state" role="status">
        Loading concept...
      </section>
    </main>
  );
}
