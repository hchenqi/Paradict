"use client";

import ConceptList from "../ConceptList";
import { useActiveLanguageList } from "../ActiveLanguageListProvider";
import type { Concept, Entry } from "@/lib/types";

export default function ExploreResults({ entries }: { entries: Entry[] }) {
  const { activeLanguageList } = useActiveLanguageList();
  const concepts = Object.values(entries.reduce<Record<number, Concept>>((result, entry) => {
    const concept = result[entry.concept_id] ?? { id: entry.concept_id, entries: [] };
    concept.entries.push(entry);
    result[entry.concept_id] = concept;
    return result;
  }, {}));
  return (
    <section className="results">
      <div className="results-heading"><span className="eyebrow">Explore concepts</span></div>
      <ConceptList concepts={concepts} activeLanguageList={activeLanguageList} />
    </section>
  );
}