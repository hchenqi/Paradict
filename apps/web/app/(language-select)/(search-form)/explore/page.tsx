"use client";

import { useMemo } from "react";
import { type Entry, groupEntriesByConcept } from "@/lib/types";
import { useActiveLanguages } from "@/app/LanguageProvider";
import { useExplore } from "@/app/ExploreProvider";
import ConceptList from "../ConceptList";

export default function () {
  const [activeLanguages] = useActiveLanguages();
  const entries = useExplore();
  const concepts = useMemo<Map<number, Entry[]>>(() => groupEntriesByConcept(entries), [entries]);
  return (
    <>
      <div className="heading">Explore</div>
      <ConceptList concepts={concepts} languages={activeLanguages} />
    </>
  );
}
