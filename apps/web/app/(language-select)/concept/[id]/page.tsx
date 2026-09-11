import Link from "next/link";
import { notFound } from "next/navigation";
import { getConcept } from "@/lib/server";
import ConceptCard from "../../ConceptCard";
import type { LanguageCode } from "@/lib/types";

export default async function ConceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ languages?: string }>;
}) {
  const { id } = await params;
  const { languages } = await searchParams;
  const conceptId = Number(id);
  if (!Number.isInteger(conceptId) || conceptId < 1) notFound();
  const activeLanguages = (languages?.split(",") ?? []).filter(
    (code): code is LanguageCode => Boolean(code),
  );
  const entries = await getConcept(conceptId, activeLanguages);
  if (!entries.length) notFound();

  return (
    <main className="concept-page">
      <section className="results concept-results">
        <ConceptCard
          conceptId={conceptId}
          entries={entries}
          activeLanguages={activeLanguages}
        />
        <div className="concept-actions">
          <Link
            className="submission-cta"
            href={`/submissions?type=update_concept&concept_id=${conceptId}&languages=${activeLanguages.join(",")}`}
          >
            Update entries
          </Link>
          <Link
            className="submission-cta"
            href={`/submissions?type=merge_concepts&concept_id=${conceptId}`}
          >
            Merge concept
          </Link>
        </div>
      </section>
    </main>
  );
}
