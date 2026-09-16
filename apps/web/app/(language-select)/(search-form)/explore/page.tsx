"use client";

import { useEffect, useState } from "react";
import { type Entry, groupEntriesByConcept } from "@/lib/types";
import { exploreAction } from "@/app/actions";
import { useActiveLanguages } from "../../LanguageProvider";
import ConceptList from "../ConceptList";

export default function () {
  const [activeLanguages] = useActiveLanguages();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [concepts, setConcepts] = useState<Map<number, Entry[]>>(new Map());

  useEffect(() => {
    exploreAction().then(entries => setEntries(entries));
  }, []);

  useEffect(() => {
    if (activeLanguages.length) {
      setConcepts(groupEntriesByConcept(entries));
    } else {
      setConcepts(new Map());
    }
  }, [activeLanguages, entries]);

  return (
    <>
      <div className="heading">Explore</div>
      <ConceptList concepts={concepts} languages={activeLanguages} />
    </>
  );
}
