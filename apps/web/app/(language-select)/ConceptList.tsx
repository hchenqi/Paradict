import type { LanguageCode, Entry } from "@/lib/types";
import ConceptCard from "./ConceptCard";

export default function ({ concepts, activeLanguages }: { concepts: Map<number, Entry[]>, activeLanguages: LanguageCode[] }) {
  return (
    <>
      {
        Array.from(concepts.entries()).map(([concept_id, entries]) => (
          <ConceptCard
            key={concept_id}
            conceptId={concept_id}
            entries={entries}
            activeLanguages={activeLanguages}
          />
        ))
      }
    </>
  );
}
