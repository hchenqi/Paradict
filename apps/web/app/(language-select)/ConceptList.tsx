import type { Concept, Entry, LanguageCode } from "@/lib/types";
import ConceptCard from "./ConceptCard";

export default function ConceptList({
  concepts,
  activeLanguageList,
}: {
  concepts: Concept[] | Entry[];
  activeLanguageList: LanguageCode[];
}) {
  const flatEntries = concepts.filter((item): item is Entry => "concept_id" in item);
  const grouped: Concept[] = flatEntries.length
    ? Object.values(flatEntries.reduce<Record<number, Concept>>((result, entry) => {
        const concept = result[entry.concept_id] ?? { id: entry.concept_id, entries: [] };
        concept.entries.push(entry);
        result[entry.concept_id] = concept;
        return result;
      }, {}))
    : concepts as Concept[];
  return (
    <>
      {grouped.map((concept) => (
        <ConceptCard
          key={concept.id}
          conceptId={concept.id}
          entries={concept.entries}
          activeLanguageList={activeLanguageList}
        />
      ))}
    </>
  );
}
